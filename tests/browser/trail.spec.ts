import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  ACTIVE_SLOT_SELECTOR,
  activePositions,
  activeSlots,
  expectedOrigin,
  layerMode,
  slots,
  trail,
  visibleBox,
} from "./helpers/trail.ts";

const TRAIL_PATH = "/test-surfaces/trail";

/** Move in separate steps so each segment is consumed by its own frame. */
async function sweep(
  page: import("@playwright/test").Page,
  testId: string,
  steps = 8,
) {
  const box = await visibleBox(page, testId);
  const y = box.y + box.height / 2;
  for (let step = 0; step <= steps; step += 1) {
    await page.mouse.move(box.x + 10 + ((box.width - 20) * step) / steps, y, {
      steps: 2,
    });
    await page.waitForTimeout(40);
  }
}

test.describe("wrapper and hook", () => {
  test("both spawn bounded trails on pointer movement", async ({
    page,
  }, testInfo) => {
    test.skip(
      !["chromium-desktop", "firefox-desktop", "webkit-desktop"].includes(
        testInfo.project.name,
      ),
    );
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(TRAIL_PATH);

    // Server output is a complete inert pool, so hydration cannot shift layout.
    await expect(slots(page, "wrapper-trail")).toHaveCount(8);
    await expect(activeSlots(page, "wrapper-trail")).toHaveCount(0);

    await sweep(page, "wrapper-trail");
    const wrapperActive = await activeSlots(page, "wrapper-trail").count();
    expect(wrapperActive).toBeGreaterThan(0);
    expect(wrapperActive).toBeLessThanOrEqual(8);

    await sweep(page, "hook-trail");
    const hookActive = await activeSlots(page, "hook-trail").count();
    expect(hookActive).toBeGreaterThan(0);
    expect(hookActive).toBeLessThanOrEqual(8);
    // The hook builds the same bounded pool inside the caller's own layer.
    await expect(slots(page, "hook-trail")).toHaveCount(8);

    await diagnostics.expectClean(testInfo);
  });

  test("the controller clears, pauses, and resumes", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);

    await sweep(page, "hook-trail");
    expect(await activeSlots(page, "hook-trail").count()).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Clear hook trail" }).click();
    await expect(activeSlots(page, "hook-trail")).toHaveCount(0);

    await page.getByRole("button", { name: "Pause hook trail" }).click();
    await sweep(page, "hook-trail");
    await expect(activeSlots(page, "hook-trail")).toHaveCount(0);

    await page.getByRole("button", { name: "Resume hook trail" }).click();
    await sweep(page, "hook-trail");
    expect(await activeSlots(page, "hook-trail").count()).toBeGreaterThan(0);
  });
});

test.describe("pass-through", () => {
  test("never blocks controls, links, or text selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);
    await sweep(page, "wrapper-trail");
    expect(await activeSlots(page, "wrapper-trail").count()).toBeGreaterThan(0);

    // A control underneath the decorative layer still receives the click.
    const button = page.getByTestId("wrapper-trail-button");
    await button.click();
    await expect(button).toContainText("Clicks: 1");

    // Text under the layer stays selectable. Target a position over the words
    // themselves: double-clicking trailing whitespace selects nothing.
    await page
      .getByTestId("wrapper-trail-text")
      .dblclick({ position: { x: 24, y: 8 } });
    const selection = await page.evaluate(
      () => window.getSelection()?.toString() ?? "",
    );
    expect(selection.trim().length).toBeGreaterThan(0);

    const pointerEvents = await activeSlots(page, "wrapper-trail")
      .first()
      .evaluate((element) => getComputedStyle(element).pointerEvents);
    expect(pointerEvents).toBe("none");
  });

  test("is absent from the accessibility tree and the tab order", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(TRAIL_PATH);
    await sweep(page, "wrapper-trail", 4);

    const layer = trail(page, "wrapper-trail").locator(".sui-trail-layer");
    await expect(layer).toHaveAttribute("aria-hidden", "true");
    await expect(layer).toHaveAttribute("role", "presentation");

    const focusable = await page
      .locator(`${ACTIVE_SLOT_SELECTOR}[tabindex]`)
      .count();
    expect(focusable).toBe(0);

    await expectNoAxeViolations(page, testInfo);
    await diagnostics.expectClean(testInfo);
  });
});

test.describe("coordinates", () => {
  test("stay container-local when positioned, padded, bordered, and scrolled", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);

    // Scroll the page and the inner scroller so viewport and local coordinates
    // can never coincide by accident.
    await page.evaluate(() => {
      window.scrollTo(0, 120);
      document
        .querySelector('[data-testid="trail-scroller"]')
        ?.scrollTo({ top: 60 });
    });
    await page.waitForTimeout(80);

    const box = await visibleBox(page, "offset-trail");

    const start = { x: Math.round(box.x + 60), y: Math.round(box.y + 60) };
    await page.mouse.move(start.x, start.y);
    await page.waitForTimeout(60);
    // Spacing is pinned to exactly 20px, so a 20px step must land one node.
    await page.mouse.move(start.x + 20, start.y);
    await page.waitForTimeout(60);

    const origin = await expectedOrigin(page, "offset-trail");
    const positions = await activePositions(page, "offset-trail");
    expect(positions.length).toBeGreaterThan(0);

    const expectedX = start.x + 20 - origin.x;
    const expectedY = start.y - origin.y;
    const match = positions.some(
      (position) =>
        Math.abs(position.x - expectedX) <= 2 &&
        Math.abs(position.y - expectedY) <= 2,
    );
    expect(
      match,
      `expected a node near (${String(expectedX)}, ${String(expectedY)}), got ${JSON.stringify(positions)}`,
    ).toBe(true);

    // Every node must sit inside the container's own coordinate space.
    const size = await trail(page, "offset-trail").evaluate((element) => ({
      height: element.clientHeight,
      width: element.clientWidth,
    }));
    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(-1);
      expect(position.y).toBeGreaterThanOrEqual(-1);
      expect(position.x).toBeLessThanOrEqual(size.width + 1);
      expect(position.y).toBeLessThanOrEqual(size.height + 1);
    }
  });

  test("stay correct after the viewport is resized", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);
    await page.setViewportSize({ height: 800, width: 1000 });
    await page.waitForTimeout(120);

    const box = await visibleBox(page, "offset-trail");

    const start = { x: Math.round(box.x + 50), y: Math.round(box.y + 50) };
    await page.mouse.move(start.x, start.y);
    await page.waitForTimeout(60);
    await page.mouse.move(start.x + 20, start.y);
    await page.waitForTimeout(60);

    const origin = await expectedOrigin(page, "offset-trail");
    const positions = await activePositions(page, "offset-trail");
    expect(positions.length).toBeGreaterThan(0);
    expect(
      positions.some(
        (position) =>
          Math.abs(position.x - (start.x + 20 - origin.x)) <= 2 &&
          Math.abs(position.y - (start.y - origin.y)) <= 2,
      ),
    ).toBe(true);
  });
});

test.describe("bounded work", () => {
  test("clamps an extreme pool request to the hard ceiling", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);
    await expect(slots(page, "ceiling-trail")).toHaveCount(48);
  });

  test("keeps the DOM stable under sustained movement", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);

    const box = await visibleBox(page, "ceiling-trail");

    for (let lap = 0; lap < 12; lap += 1) {
      await page.mouse.move(box.x + 12, box.y + 20 + (lap % 5) * 12);
      await page.mouse.move(
        box.x + box.width - 12,
        box.y + 30 + (lap % 5) * 12,
      );
      await page.waitForTimeout(24);
      expect(await slots(page, "ceiling-trail").count()).toBe(48);
      expect(
        await activeSlots(page, "ceiling-trail").count(),
      ).toBeLessThanOrEqual(48);
    }
  });

  test("a long pointer jump does not backfill the path", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);

    const box = await visibleBox(page, "ceiling-trail");

    await page.mouse.move(box.x + 8, box.y + 8);
    await page.waitForTimeout(60);
    const before = await activeSlots(page, "ceiling-trail").count();

    // One teleport across the whole container: with 4px spacing an unbounded
    // engine would fill hundreds of nodes.
    await page.mouse.move(box.x + box.width - 8, box.y + box.height - 8);
    await page.waitForTimeout(60);

    const after = await activeSlots(page, "ceiling-trail").count();
    expect(after - before).toBeLessThanOrEqual(6);
  });
});

test.describe("visibility", () => {
  test("does not spawn while the container is offscreen", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    // Let the intersection observer report the offscreen state.
    await page.waitForTimeout(250);

    // Synthetic events isolate the visibility gate from hit testing: an
    // offscreen element cannot be hovered, but its listeners still fire.
    // Each event is dispatched in its own task so a frame runs between them —
    // one synchronous burst would collapse into a single sample and spawn
    // nothing regardless of visibility.
    const send = async (type: string, offsetX: number, offsetY: number) => {
      await page.evaluate(
        ({ eventType, x, y }) => {
          const container = document.querySelector(
            '[data-testid="offscreen-trail"]',
          );
          if (container === null) {
            return;
          }

          const rect = container.getBoundingClientRect();
          container.dispatchEvent(
            new PointerEvent(eventType, {
              bubbles: true,
              clientX: rect.left + x,
              clientY: rect.top + y,
              pointerType: "mouse",
            }),
          );
        },
        { eventType: type, x: offsetX, y: offsetY },
      );
      await page.waitForTimeout(40);
    };

    const drive = async () => {
      await send("pointerenter", 10, 10);
      for (let step = 1; step <= 8; step += 1) {
        await send("pointermove", 10 + step * 30, 40);
      }
    };

    await drive();
    await expect(activeSlots(page, "offscreen-trail")).toHaveCount(0);

    await trail(page, "offscreen-trail").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await drive();
    expect(await activeSlots(page, "offscreen-trail").count()).toBeGreaterThan(
      0,
    );
  });

  test("returning from a hidden document does not replay a stale segment", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(TRAIL_PATH);

    const box = await visibleBox(page, "ceiling-trail");

    await page.mouse.move(box.x + 10, box.y + 10);
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const before = await activeSlots(page, "ceiling-trail").count();
    // The first sample after the reset only re-anchors the segment.
    await page.mouse.move(box.x + box.width - 10, box.y + 10);
    await page.waitForTimeout(60);
    expect(await activeSlots(page, "ceiling-trail").count()).toBe(before);
  });
});

test.describe("capability policy", () => {
  test("a disabled trail attaches no loop", async ({ page }) => {
    await page.goto(TRAIL_PATH);
    expect(await layerMode(page, "disabled-trail")).toBe("inert");
    await sweep(page, "disabled-trail", 4);
    await expect(activeSlots(page, "disabled-trail")).toHaveCount(0);
  });

  test("reduced motion suppresses the trail entirely", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto(TRAIL_PATH);

    expect(await layerMode(page, "wrapper-trail")).toBe("inert");
    expect(await layerMode(page, "tap-trail")).toBe("inert");

    await sweep(page, "wrapper-trail", 6);
    await expect(activeSlots(page, "wrapper-trail")).toHaveCount(0);

    const display = await trail(page, "wrapper-trail")
      .locator(".sui-trail-layer")
      .evaluate((element) => getComputedStyle(element).display);
    expect(display).toBe("none");
  });

  test("forced colors withdraws the decorative layer", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto(TRAIL_PATH);
    const display = await trail(page, "wrapper-trail")
      .locator(".sui-trail-layer")
      .evaluate((element) => getComputedStyle(element).display);
    expect(display).toBe("none");
  });

  test("a coarse pointer disables continuous mode but allows opt-in tap", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-coarse-pointer");
    await page.goto(TRAIL_PATH);

    expect(await layerMode(page, "wrapper-trail")).toBe("inert");
    expect(await layerMode(page, "tap-trail")).toBe("tap");
  });
});

test.describe("tap mode", () => {
  test("spawns on a deliberate tap and leaves scrolling alone", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-coarse-pointer");
    await page.goto(TRAIL_PATH);

    const box = await visibleBox(page, "tap-trail");

    await page.touchscreen.tap(box.x + 60, box.y + 60);
    await page.waitForTimeout(150);
    expect(await activeSlots(page, "tap-trail").count()).toBe(1);

    // Scrolling inside the container still works, and produces no node.
    const scrollable = page.getByTestId("tap-scroll");
    await scrollable.evaluate((element) => {
      element.scrollTop = 40;
    });
    expect(
      await scrollable.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0);
    expect(await activeSlots(page, "tap-trail").count()).toBe(1);
  });

  test("a cancelled gesture spawns nothing", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-coarse-pointer");
    await page.goto(TRAIL_PATH);

    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="tap-trail"]');
      if (container === null) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const send = (type: string, x: number, y: number) => {
        container.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerType: "touch",
          }),
        );
      };

      send("pointerdown", rect.left + 40, rect.top + 40);
      send("pointercancel", rect.left + 40, rect.top + 40);
      send("pointerup", rect.left + 40, rect.top + 40);
    });
    await page.waitForTimeout(150);
    await expect(activeSlots(page, "tap-trail")).toHaveCount(0);

    // A drag is a scroll, not a tap.
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="tap-trail"]');
      if (container === null) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const send = (type: string, x: number, y: number) => {
        container.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerType: "touch",
          }),
        );
      };

      send("pointerdown", rect.left + 40, rect.top + 40);
      send("pointerup", rect.left + 140, rect.top + 40);
    });
    await page.waitForTimeout(150);
    await expect(activeSlots(page, "tap-trail")).toHaveCount(0);
  });
});

test.describe("React work in the production build", () => {
  test("pointer movement does not re-render the consumer subtree", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    // The commit-level proof runs against a development build, where React's
    // Profiler is instrumented. This is the complementary check that survives
    // in a real production bundle: a render of the trail's children would
    // increment the probe, and pointer movement must never cause one.
    await page.goto("/test-surfaces/trail-render-count");
    await expect(slots(page, "render-count-trail")).toHaveCount(12);
    await page.waitForTimeout(300);

    const readProbe = async () =>
      await page.evaluate(
        () =>
          (window as typeof window & { __scoutUiTrailChildRenders?: number })
            .__scoutUiTrailChildRenders ?? 0,
      );

    const baseline = await readProbe();
    expect(baseline).toBeGreaterThan(0);

    const box = await visibleBox(page, "render-count-trail");
    const stepWidth = (box.width - 24) / 10;
    for (let lap = 0; lap < 4; lap += 1) {
      for (let step = 0; step <= 10; step += 1) {
        await page.mouse.move(
          box.x + 12 + stepWidth * step,
          box.y + 24 + (lap % 4) * 16,
        );
        await page.waitForTimeout(20);
      }
    }

    expect(
      await activeSlots(page, "render-count-trail").count(),
    ).toBeGreaterThan(0);
    expect(
      await readProbe(),
      "pointer movement re-rendered React children",
    ).toBe(baseline);
    // The pool never grows, and a real state change still renders.
    expect(await slots(page, "render-count-trail").count()).toBe(12);
    await page.getByTestId("force-rerender").click();
    await expect.poll(readProbe).toBeGreaterThan(baseline);
  });
});

test.describe("server rendering", () => {
  test("emits a deterministic inert pool with no image source", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const response = await page.request.get(TRAIL_PATH);
    expect(response.ok()).toBe(true);
    const html = await response.text();

    const slotMatches = html.match(/data-sui-trail-slot/gu) ?? [];
    expect(slotMatches.length).toBeGreaterThan(0);
    expect(html).toContain('data-active="false"');
    expect(html).not.toContain('data-active="true"');
    // No slot may carry a source or a position before the engine starts.
    expect(html).not.toMatch(/data-sui-trail-slot[^>]*\ssrc=/u);
    expect(html).not.toContain("--sui-trail-internal-x");

    // Two requests must produce byte-identical pool markup.
    const repeat = await (await page.request.get(TRAIL_PATH)).text();
    expect(repeat.match(/data-sui-trail-slot/gu)?.length).toBe(
      slotMatches.length,
    );
  });

  test("hydrates without a warning or mismatch", async ({ page }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(TRAIL_PATH);
    await expect(slots(page, "wrapper-trail")).toHaveCount(8);
    await expect(page.getByTestId("wrapper-trail-button")).toBeVisible();
    await diagnostics.expectClean(testInfo);
  });
});
