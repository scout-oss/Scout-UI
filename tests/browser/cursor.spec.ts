import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  CURSOR_HOTSPOT_PATH,
  CURSOR_PATH,
  cursorMode,
  cursorOrigin,
  cursorPosition,
  hoverTarget,
  layer,
  readCursor,
  visibleBox,
  visual,
} from "./helpers/cursor.ts";

const DESKTOP = ["chromium-desktop", "firefox-desktop", "webkit-desktop"];
const CURSOR_ASSETS_PATH = "/test-surfaces/cursor-assets";

test.describe("readiness", () => {
  test("the native cursor stays visible until the artwork decodes", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    const diagnostics = captureBrowserDiagnostics(page);

    // Hold every image response until the assertion below has run, so the
    // pre-decode window is observable rather than a race.
    let release = () => {
      // Replaced synchronously by the promise executor below.
    };
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/*.png", async (route) => {
      await gate;
      await route.abort();
    });

    await page.goto(CURSOR_ASSETS_PATH);
    const box = await visibleBox(page, "broken-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.waitForTimeout(150);

    const beforeReady = await readCursor(page, "broken-cursor");
    expect(
      beforeReady.nativeHidden,
      "the native cursor was hidden before the artwork was ready",
    ).toBe(false);
    expect(beforeReady.visible).toBe(false);

    release();
    await diagnostics.expectClean(testInfo);
  });

  test("a valid asset becomes ready and only then hides the native cursor", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await page.goto(CURSOR_ASSETS_PATH);

    const box = await visibleBox(page, "readiness-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);

    await expect
      .poll(
        async () => (await readCursor(page, "readiness-cursor")).nativeHidden,
      )
      .toBe(true);

    const snapshot = await readCursor(page, "readiness-cursor");
    expect(snapshot.visible).toBe(true);
    expect(snapshot.src).not.toBeNull();
  });

  test("a decode failure never leaves the region cursorless", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    // A 404 console entry is expected here; an uncaught exception is not.
    const uncaught: string[] = [];
    page.on("pageerror", (error) => uncaught.push(error.message));
    await page.goto(CURSOR_ASSETS_PATH);

    const box = await visibleBox(page, "broken-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.waitForTimeout(600);

    const snapshot = await readCursor(page, "broken-cursor");
    expect(snapshot.nativeHidden, "user left without any cursor").toBe(false);
    expect(snapshot.visible).toBe(false);
    // A failed decode must not leave a broken image showing either.
    expect(snapshot.src).toBeNull();

    // The failure is handled, not thrown.
    expect(uncaught, uncaught.join(" | ")).toEqual([]);
  });

  test("swapping to a broken source restores the native cursor", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_ASSETS_PATH);

    const box = await visibleBox(page, "readiness-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await expect
      .poll(
        async () => (await readCursor(page, "readiness-cursor")).nativeHidden,
      )
      .toBe(true);

    // A configuration change mid-session must not keep hiding the cursor on the
    // strength of the previous generation's decode.
    await page.getByTestId("readiness-break").click();
    await page.mouse.move(box.x + 60, box.y + 60);
    await expect
      .poll(
        async () => (await readCursor(page, "readiness-cursor")).nativeHidden,
      )
      .toBe(false);

    // Restoring a valid source recovers, proving the generation token did not
    // permanently poison the registry.
    await page.getByTestId("readiness-restore").click();
    await page.mouse.move(box.x + 80, box.y + 50);
    await expect
      .poll(
        async () => (await readCursor(page, "readiness-cursor")).nativeHidden,
      )
      .toBe(true);
  });

  test("hideNative=never keeps the browser cursor as an enhancement", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    const box = await visibleBox(page, "never-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.waitForTimeout(200);

    const snapshot = await readCursor(page, "never-cursor");
    expect(snapshot.nativeHidden).toBe(false);
    // The custom visual still renders; it simply does not replace the native one.
    expect(snapshot.visible).toBe(true);
  });
});

test.describe("state resolution", () => {
  test("moves through default, hover, active and back deterministically", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    await hoverTarget(page, "bypass-text");
    await expect
      .poll(async () => (await readCursor(page, "bypass-cursor")).visible)
      .toBe(true);

    const asDefault = await readCursor(page, "bypass-cursor");
    expect(asDefault.state).toBe("default");

    await hoverTarget(page, "bypass-custom-nested");
    const asCustom = await readCursor(page, "bypass-cursor");
    expect(asCustom.state).toBe("sparkle");
    expect(asCustom.src).not.toBe(asDefault.src);

    await page.mouse.down();
    await page.waitForTimeout(80);
    const asActive = await readCursor(page, "bypass-cursor");
    // Active outranks the custom annotation.
    expect(asActive.state).toBe("active");
    expect(asActive.pressed).toBe(true);

    await page.mouse.up();
    await page.waitForTimeout(80);
    const back = await readCursor(page, "bypass-cursor");
    expect(back.state).toBe("sparkle");
    expect(back.pressed).toBe(false);

    await hoverTarget(page, "bypass-text");
    expect((await readCursor(page, "bypass-cursor")).state).toBe("default");
  });
});

test.describe("native bypass", () => {
  const bypassCases = [
    { reason: "editable", testId: "bypass-input" },
    { reason: "editable", testId: "bypass-search" },
    { reason: "editable", testId: "bypass-textarea" },
    { reason: "editable", testId: "bypass-contenteditable" },
    { reason: "media", testId: "bypass-media" },
    { reason: "native-region", testId: "bypass-native" },
    { reason: "native-region", testId: "bypass-native-nested" },
    { reason: "disabled-selector", testId: "bypass-disabled" },
  ] as const;

  for (const { reason, testId } of bypassCases) {
    test(`restores the native cursor over ${testId}`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop");
      await page.goto(CURSOR_PATH);

      // Establish the custom cursor first, so the assertion proves a change.
      await hoverTarget(page, "bypass-text");
      expect((await readCursor(page, "bypass-cursor")).nativeHidden).toBe(true);

      await hoverTarget(page, testId);
      const snapshot = await readCursor(page, "bypass-cursor");
      expect(snapshot.nativeHidden, `${testId} kept the cursor hidden`).toBe(
        false,
      );
      expect(snapshot.visible).toBe(false);
      expect(snapshot.bypass).toBe(reason);
    });
  }

  test("a nested custom annotation cannot escape a native region", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    await hoverTarget(page, "bypass-text");
    await hoverTarget(page, "bypass-native-inner");

    const snapshot = await readCursor(page, "bypass-cursor");
    expect(
      snapshot.bypass,
      "a custom state overrode an explicit native region",
    ).toBe("native-region");
    expect(snapshot.nativeHidden).toBe(false);
  });

  test("keeps the custom cursor over ordinary controls", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    for (const testId of [
      "bypass-link",
      "bypass-button",
      "bypass-sticker-button",
      "bypass-checkbox",
    ]) {
      await hoverTarget(page, testId);
      const snapshot = await readCursor(page, "bypass-cursor");
      expect(snapshot.bypass, `${testId} was treated as a bypass`).toBeNull();
      expect(snapshot.nativeHidden).toBe(true);
    }
  });
});

test.describe("leave, blur, and disable", () => {
  test("restores the native cursor when the pointer leaves", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    await hoverTarget(page, "bypass-text");
    expect((await readCursor(page, "bypass-cursor")).nativeHidden).toBe(true);

    const box = await visibleBox(page, "bypass-cursor");
    await page.mouse.move(box.x - 60, box.y - 60);
    await page.waitForTimeout(120);

    const snapshot = await readCursor(page, "bypass-cursor");
    expect(snapshot.nativeHidden).toBe(false);
    expect(snapshot.visible).toBe(false);
  });

  test("re-entry restarts from the new position without sweeping across", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    // Both anchors are known non-bypass elements: a geometric corner can land
    // in one of the bypass regions this fixture is deliberately full of.
    await hoverTarget(page, "bypass-text");
    const start = await cursorPosition(page, "bypass-cursor");

    // Leave decisively, and prove it: without a real leave the re-entry snap
    // would not be under test at all.
    await page.mouse.move(2, 2);
    await expect
      .poll(async () => (await readCursor(page, "bypass-cursor")).visible)
      .toBe(false);

    // Re-enter far from the previous point. The first sample must place the
    // cursor directly rather than animating it across the region.
    const target = page.getByTestId("bypass-custom-nested");
    await target.scrollIntoViewIfNeeded();
    const entry = await target.boundingBox();
    expect(entry).not.toBeNull();
    if (entry === null) {
      return;
    }

    const entryX = Math.round(entry.x + entry.width / 2);
    const entryY = Math.round(entry.y + entry.height / 2);
    await page.mouse.move(entryX, entryY);
    await page.waitForTimeout(120);

    const origin = await cursorOrigin(page, "bypass-cursor");
    const position = await cursorPosition(page, "bypass-cursor");
    const expectedX = entryX - origin.x;
    const expectedY = entryY - origin.y;

    const jump = Math.hypot(expectedX - start.x, expectedY - start.y);
    const remaining = Math.hypot(
      position.x - expectedX,
      position.y - expectedY,
    );

    // The re-entry covers real distance, which is what makes this
    // discriminating: a swept cursor would still be a large fraction of that
    // distance short of the entry point.
    expect(
      jump,
      "the two anchors are too close to distinguish a sweep",
    ).toBeGreaterThan(80);
    expect(
      remaining,
      `re-entry swept across the region: ${String(remaining)}px short`,
    ).toBeLessThan(jump / 4);
  });

  test("window blur restores the native cursor and clears the press", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    await hoverTarget(page, "bypass-text");
    await page.mouse.down();
    await page.waitForTimeout(60);
    expect((await readCursor(page, "bypass-cursor")).pressed).toBe(true);

    await page.evaluate(() => {
      window.dispatchEvent(new Event("blur"));
    });
    await page.waitForTimeout(120);

    const snapshot = await readCursor(page, "bypass-cursor");
    expect(snapshot.nativeHidden).toBe(false);
    expect(snapshot.visible).toBe(false);
    expect(snapshot.pressed).toBe(false);
    await page.mouse.up();
  });

  test("a hidden document restores the native cursor", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);
    await hoverTarget(page, "bypass-text");
    expect((await readCursor(page, "bypass-cursor")).nativeHidden).toBe(true);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(120);

    expect((await readCursor(page, "bypass-cursor")).nativeHidden).toBe(false);
  });

  test("a disabled cursor attaches no loop and hides nothing", async ({
    page,
  }) => {
    await page.goto(CURSOR_PATH);
    expect(await cursorMode(page, "disabled-cursor")).toBe("inert");

    const box = await visibleBox(page, "disabled-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.waitForTimeout(150);

    const snapshot = await readCursor(page, "disabled-cursor");
    expect(snapshot.nativeHidden).toBe(false);
    expect(snapshot.visible).toBe(false);
  });
});

test.describe("capability policy", () => {
  test("reduced motion receives the native cursor only", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto(CURSOR_PATH);

    expect(await cursorMode(page, "bypass-cursor")).toBe("inert");

    const box = await visibleBox(page, "bypass-cursor");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.waitForTimeout(150);

    const snapshot = await readCursor(page, "bypass-cursor");
    expect(snapshot.nativeHidden).toBe(false);
    expect(snapshot.visible).toBe(false);

    const display = await layer(page, "bypass-cursor").evaluate(
      (element) => getComputedStyle(element).display,
    );
    expect(display).toBe("none");
  });

  test("a coarse pointer receives native platform behaviour only", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-coarse-pointer");
    await page.goto(CURSOR_PATH);

    expect(await cursorMode(page, "bypass-cursor")).toBe("inert");
    expect((await readCursor(page, "bypass-cursor")).nativeHidden).toBe(false);
  });

  test("forced colors withdraws the decorative layer", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto(CURSOR_PATH);

    const display = await layer(page, "bypass-cursor").evaluate(
      (element) => getComputedStyle(element).display,
    );
    expect(display).toBe("none");
  });
});

test.describe("hotspot", () => {
  test("places each declared anchor under the pointer", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_HOTSPOT_PATH);

    const expected = {
      "hotspot-bottom-right": ["-100.000%", "-100.000%"],
      "hotspot-centre": ["-50.000%", "-50.000%"],
      "hotspot-quarter": ["-25.000%", "-75.000%"],
      "hotspot-top-left-tip": ["0.000%", "0.000%"],
    } as const;

    for (const [testId, [x, y]] of Object.entries(expected)) {
      const box = await visibleBox(page, testId);
      await page.mouse.move(box.x + 60, box.y + 60);
      await page.waitForTimeout(120);

      const snapshot = await readCursor(page, testId);
      expect(snapshot.hotspotX, testId).toBe(x);
      expect(snapshot.hotspotY, testId).toBe(y);
    }
  });

  test("a state change does not shift the apparent pointer position", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_HOTSPOT_PATH);

    const box = await visibleBox(page, "hotspot-stability");
    const point = { x: box.x + 80, y: box.y + 40 };
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(150);

    const origin = await cursorOrigin(page, "hotspot-stability");
    const before = await cursorPosition(page, "hotspot-stability");
    const beforeSnapshot = await readCursor(page, "hotspot-stability");

    // Enter a zone whose visual has a different aspect ratio and a different
    // declared anchor.
    await hoverTarget(page, "hotspot-sparkle-zone");
    const after = await cursorPosition(page, "hotspot-stability");
    const afterSnapshot = await readCursor(page, "hotspot-stability");

    // The artwork and its anchor both changed...
    expect(afterSnapshot.src).not.toBe(beforeSnapshot.src);
    expect(afterSnapshot.hotspotX).not.toBe(beforeSnapshot.hotspotX);

    // ...but the tracked point is still the pointer, in container-local terms.
    expect(Math.abs(before.x - (point.x - origin.x))).toBeLessThan(4);
    expect(after.x).toBeGreaterThan(0);
    expect(after.y).toBeGreaterThan(0);
  });

  test("survives swapping the default visual for a different aspect ratio", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_HOTSPOT_PATH);

    const box = await visibleBox(page, "hotspot-stability");
    await page.mouse.move(box.x + 70, box.y + 50);
    await page.waitForTimeout(150);
    const before = await readCursor(page, "hotspot-stability");

    await page.getByTestId("hotspot-toggle").click();
    await page.mouse.move(box.x + 71, box.y + 51);
    await page.waitForTimeout(200);
    const after = await readCursor(page, "hotspot-stability");

    // A different intrinsic size, the same normalised anchor: percentages are
    // what make this hold.
    expect(after.src).not.toBe(before.src);
    expect(after.hotspotX).toBe(before.hotspotX);
    expect(after.hotspotY).toBe(before.hotspotY);
  });
});

test.describe("decoration contract", () => {
  test("never intercepts pointer events or text selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    await hoverTarget(page, "echo-target");
    const button = page.getByTestId("echo-target");
    await button.click();
    await expect(button).toContainText("Clicks: 1");

    const pointerEvents = await visual(page, "echo-cursor").evaluate(
      (element) => getComputedStyle(element).pointerEvents,
    );
    expect(pointerEvents).toBe("none");

    await page
      .getByTestId("bypass-text")
      .dblclick({ position: { x: 24, y: 8 } });
    const selection = await page.evaluate(
      () => window.getSelection()?.toString() ?? "",
    );
    expect(selection.trim().length).toBeGreaterThan(0);
  });

  test("is absent from the accessibility tree and the tab order", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(CURSOR_PATH);

    const element = layer(page, "bypass-cursor");
    await expect(element).toHaveAttribute("aria-hidden", "true");
    await expect(element).toHaveAttribute("role", "presentation");
    expect(
      await page
        .locator(
          ".sui-sticker-cursor-visual[tabindex], .sui-sticker-cursor-echo[tabindex]",
        )
        .count(),
    ).toBe(0);

    await expectNoAxeViolations(page, testInfo);
    await diagnostics.expectClean(testInfo);
  });

  test("keyboard focus indicators are unaffected by the cursor", async ({
    page,
  }, testInfo) => {
    test.skip(
      !["chromium-desktop", "chromium-forced-colors"].includes(
        testInfo.project.name,
      ),
    );
    await page.goto(CURSOR_PATH);

    const button = page.getByTestId("bypass-sticker-button");
    await button.focus();
    await expect(button).toBeFocused();

    const focus = await button.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        offset: Number.parseFloat(styles.outlineOffset),
        style: styles.outlineStyle,
        width: Number.parseFloat(styles.outlineWidth),
      };
    });

    expect(focus.style).not.toBe("none");
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.offset).toBeGreaterThanOrEqual(3);
  });
});

test.describe("click feedback", () => {
  test("press applies a finite tactile response", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);
    await hoverTarget(page, "bypass-text");

    await page.mouse.down();
    await page.waitForTimeout(80);
    expect((await readCursor(page, "bypass-cursor")).pressed).toBe(true);

    await page.mouse.up();
    await page.waitForTimeout(80);
    expect((await readCursor(page, "bypass-cursor")).pressed).toBe(false);
  });

  test("echo never exceeds four reusable nodes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    const echoNodes = page
      .getByTestId("echo-cursor")
      .locator("[data-sui-cursor-echo]");
    await expect(echoNodes).toHaveCount(4);

    const box = await visibleBox(page, "echo-cursor");
    await page.mouse.move(box.x + 40, box.y + 30);
    await page.waitForTimeout(120);

    // Sustained rapid clicking must recycle, never append.
    for (let click = 0; click < 30; click += 1) {
      await page.mouse.down();
      await page.mouse.up();
      expect(await echoNodes.count()).toBe(4);
    }

    await page.waitForTimeout(600);
    await expect(echoNodes).toHaveCount(4);
  });

  test("echo nodes stay decorative", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    const styles = await page
      .getByTestId("echo-cursor")
      .locator("[data-sui-cursor-echo]")
      .first()
      .evaluate((element) => ({
        ariaHidden: element.getAttribute("aria-hidden"),
        pointerEvents: getComputedStyle(element).pointerEvents,
      }));

    expect(styles.pointerEvents).toBe("none");
    expect(styles.ariaHidden).toBe("true");
  });
});

test.describe("server rendering", () => {
  test("emits an inert layer with no source and hydrates cleanly", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const response = await page.request.get(CURSOR_PATH);
    expect(response.ok()).toBe(true);
    const html = await response.text();

    expect(html).toContain("sui-sticker-cursor-layer");
    expect(html).toContain('data-visible="false"');
    // No artwork and no position may be committed before the engine starts.
    expect(html).not.toMatch(/sui-sticker-cursor-visual[^>]*\ssrc=/u);
    expect(html).not.toContain("--sui-sticker-cursor-internal-x");

    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(CURSOR_PATH);
    await expect(page.getByTestId("bypass-button")).toBeVisible();
    await diagnostics.expectClean(testInfo);
  });
});
