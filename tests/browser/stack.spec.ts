import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  activeStackCard,
  dragStack,
  stack,
  STACK_PATH,
  stackDragProgress,
} from "./helpers/stack.ts";

test.describe("StickerStack semantics and interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STACK_PATH);
  });

  test("renders a bounded window with only the active card interactive", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    const root = stack(page, "stack-main");
    await expect(root.locator('[data-stack-card="true"]')).toHaveCount(3);
    await expect(activeStackCard(page, "stack-main")).toHaveCount(1);
    await expect(root.locator('[data-active="false"]')).toHaveCount(2);
    expect(
      await root
        .locator('[data-active="false"]')
        .evaluateAll((cards) =>
          cards.every(
            (card) =>
              card.hasAttribute("inert") &&
              card.getAttribute("aria-hidden") === "true",
          ),
        ),
    ).toBe(true);
    const activeButton = activeStackCard(page, "stack-main").getByRole(
      "button",
      { name: "Pin note" },
    );
    await activeButton.focus();
    await expect(activeButton).toBeFocused();
    const hiddenButton = root
      .locator('[data-active="false"]')
      .first()
      .getByRole("button", { name: "Pin note", includeHidden: true });
    await hiddenButton.evaluate((button: HTMLButtonElement) => {
      button.focus();
    });
    await expect(hiddenButton).not.toBeFocused();
    await expectNoAxeViolations(page, testInfo);
    await diagnostics.expectClean(testInfo);
  });

  test("honours every visible count and the transition ceiling", async ({
    page,
  }, testInfo) => {
    await expect(
      stack(page, "stack-visible-2").locator('[data-stack-card="true"]'),
    ).toHaveCount(2);
    await expect(
      stack(page, "stack-visible-5").locator('[data-stack-card="true"]'),
    ).toHaveCount(5);
    const root = stack(page, "stack-main");
    await root.evaluate((element) => {
      const observed = element as HTMLElement & {
        __scoutUiOutgoingObserver?: MutationObserver;
      };
      const recordOutgoingCount = () => {
        const count = element.querySelectorAll('[data-outgoing="true"]').length;
        const previous = Number(
          element.getAttribute("data-test-max-outgoing") ?? "0",
        );
        element.setAttribute(
          "data-test-max-outgoing",
          String(Math.max(previous, count)),
        );
      };
      const observer = new MutationObserver(recordOutgoingCount);
      observer.observe(element, {
        attributeFilter: ["data-outgoing"],
        attributes: true,
        childList: true,
        subtree: true,
      });
      observed.__scoutUiOutgoingObserver = observer;
      recordOutgoingCount();
    });

    try {
      await root.getByRole("button", { name: "Next item" }).click();
      await expect(root).toHaveAttribute(
        "data-test-max-outgoing",
        testInfo.project.name === "chromium-reduced-motion" ? "0" : "1",
      );
      expect(
        await root.locator('[data-stack-card="true"]').count(),
      ).toBeLessThanOrEqual(4);
      await expect(root.locator('[data-outgoing="true"]')).toHaveCount(0);
      await expect(root.locator('[data-stack-card="true"]')).toHaveCount(3);
    } finally {
      await root.evaluate((element) => {
        const observed = element as HTMLElement & {
          __scoutUiOutgoingObserver?: MutationObserver;
        };
        observed.__scoutUiOutgoingObserver?.disconnect();
        delete observed.__scoutUiOutgoingObserver;
        element.removeAttribute("data-test-max-outgoing");
      });
    }
  });

  test("buttons navigate once, preserve focus, announce once, and gate rapid input", async ({
    page,
  }, testInfo) => {
    const root = stack(page, "stack-main");
    const next = root.getByRole("button", { name: "Next item" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("1");
    await expect(page.getByTestId("stack-main-last-index")).toHaveText("1");
    await expect(root.locator('[aria-live="polite"]')).toHaveText(
      "Item 2 of 100",
    );
    await expect(next).toBeFocused();
    if (testInfo.project.name === "chromium-reduced-motion") return;

    // Begin the burst from a known idle state. The assertions above can take
    // longer than the 260ms transition on WebKit, so relying on that first
    // transition to remain active makes the gate proof command-latency
    // dependent. One click from this synchronous burst must be accepted and
    // the remaining 29 must be rejected in the same JavaScript turn.
    await expect(root).toHaveAttribute("data-transition", "idle");
    await next.evaluate((button: HTMLButtonElement) => {
      for (let count = 0; count < 30; count += 1) button.click();
    });
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("2");
    await expect(page.getByTestId("stack-main-last-index")).toHaveText("2");
    expect(
      await root.locator('[data-outgoing="true"]').count(),
    ).toBeLessThanOrEqual(1);
    await expect(root).toHaveAttribute("data-transition", "idle");
    await next.click();
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("3");
  });

  test("finite, loop, empty, and one-item boundaries are semantic", async ({
    page,
  }) => {
    const finite = stack(page, "stack-visible-2");
    await expect(
      finite.getByRole("button", { name: "Previous item" }),
    ).toBeDisabled();
    const one = stack(page, "stack-one");
    await expect(one.locator('[data-stack-card="true"]')).toHaveCount(1);
    await expect(
      one.getByRole("button", { name: "Previous item" }),
    ).toBeDisabled();
    await expect(one.getByRole("button", { name: "Next item" })).toBeDisabled();
    const empty = stack(page, "stack-empty");
    await expect(empty).toContainText("NOTHING STUCK HERE");
    await expect(empty.locator('[data-stack-card="true"]')).toHaveCount(0);
    await expect(empty.getByRole("button")).toHaveCount(0);
    const loop = stack(page, "stack-loop");
    await loop.getByRole("button", { name: "Next item" }).click();
    await expect(activeStackCard(page, "stack-loop")).toHaveAttribute(
      "data-item-index",
      "0",
    );
  });

  test("controlled acceptance and refusal stay parent-authoritative", async ({
    page,
  }) => {
    const controlled = stack(page, "stack-controlled");
    await expect(activeStackCard(page, "stack-controlled")).toHaveAttribute(
      "data-item-index",
      "1",
    );
    await controlled.getByRole("button", { name: "Next item" }).click();
    await expect(page.getByTestId("stack-controlled-count")).toHaveText("1");
    await expect(activeStackCard(page, "stack-controlled")).toHaveAttribute(
      "data-item-index",
      "2",
    );
    const refused = stack(page, "stack-refused");
    await refused.getByRole("button", { name: "Next item" }).click();
    await expect(page.getByTestId("stack-refused-count")).toHaveText("1");
    await expect(refused).toHaveAttribute("data-transition", "idle");
    await expect(activeStackCard(page, "stack-refused")).toHaveAttribute(
      "data-item-index",
      "1",
    );
  });

  test("keyboard follows the configured axis without hijacking nested controls", async ({
    page,
  }) => {
    const horizontal = stack(page, "stack-main");
    await horizontal.focus();
    await page.keyboard.press("ArrowRight");
    await expect(activeStackCard(page, "stack-main")).toHaveAttribute(
      "data-item-index",
      "1",
    );
    await expect(horizontal).toBeFocused();
    await expect(horizontal).toHaveAttribute("data-transition", "idle");
    const input = activeStackCard(page, "stack-main").getByRole("textbox");
    await input.fill("AB");
    await input.press("ArrowLeft");
    await expect(input).toHaveValue("AB");
    await expect(activeStackCard(page, "stack-main")).toHaveAttribute(
      "data-item-index",
      "1",
    );
    const vertical = stack(page, "stack-vertical");
    await vertical.focus();
    await page.keyboard.press("ArrowDown");
    await expect(activeStackCard(page, "stack-vertical")).toHaveAttribute(
      "data-item-index",
      "2",
    );
  });

  test("horizontal and vertical swipes commit exactly once", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-reduced-motion",
      "Reduced motion intentionally removes spatial dragging.",
    );
    await dragStack(page, "stack-main", { direction: "next", fraction: 0.48 });
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("1");
    await expect(activeStackCard(page, "stack-main")).toHaveAttribute(
      "data-item-index",
      "1",
    );
    await dragStack(page, "stack-vertical", {
      direction: "next",
      fraction: 0.48,
    });
    await expect(activeStackCard(page, "stack-vertical")).toHaveAttribute(
      "data-item-index",
      "2",
    );
  });

  test("perpendicular intent, below-threshold movement, and cancel do not commit", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-reduced-motion",
      "Reduced motion intentionally removes spatial dragging.",
    );
    await dragStack(page, "stack-main", { perpendicular: true });
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("0");
    await expect(stack(page, "stack-main")).toHaveAttribute(
      "data-stack-dragging",
      "false",
    );
    await dragStack(page, "stack-main", { fraction: 0.06 });
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("0");
    if (testInfo.project.name === "firefox-desktop") return;
    await dragStack(page, "stack-main", { fraction: 0.5, release: false });
    expect(await stackDragProgress(page, "stack-main")).toBeGreaterThan(0.3);
    await activeStackCard(page, "stack-main").dispatchEvent("pointercancel", {
      pointerId: 1,
    });
    await expect(page.getByTestId("stack-main-callback-count")).toHaveText("0");
    await expect(stack(page, "stack-main")).toHaveAttribute(
      "data-stack-drag-progress",
      "0",
    );
    await page.mouse.up();
  });

  test("dynamic item changes cancel stale work and normalize safely", async ({
    page,
  }) => {
    const dynamic = stack(page, "stack-dynamic");
    await expect(activeStackCard(page, "stack-dynamic")).toContainText(
      "CHAOS NEEDS A CEILING",
    );
    await page.getByTestId("stack-remove-active").click();
    await expect(activeStackCard(page, "stack-dynamic")).toContainText(
      "CHAOS NEEDS A CEILING",
    );
    await dynamic.getByRole("button", { name: "Next item" }).click();
    await page.getByTestId("stack-empty-items").click();
    await expect(dynamic.locator('[data-outgoing="true"]')).toHaveCount(0);
    await expect(dynamic.locator('[data-stack-card="true"]')).toHaveCount(0);
    await expect(dynamic).toContainText("NO NOTES ARE STUCK YET");
    await page.getByTestId("stack-restore-items").click();
    await expect(activeStackCard(page, "stack-dynamic")).toHaveCount(1);
  });

  test("external controlled and item changes cancel an active drag", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "The deterministic pointer-capture interruption proof runs once on desktop Chromium.",
    );
    await dragStack(page, "stack-controlled", {
      fraction: 0.28,
      release: false,
    });
    expect(await stackDragProgress(page, "stack-controlled")).toBeGreaterThan(
      0.18,
    );
    await page.getByTestId("stack-controlled-external").dispatchEvent("click");
    await expect(stack(page, "stack-controlled")).toHaveAttribute(
      "data-stack-drag-progress",
      "0",
    );
    await expect(stack(page, "stack-controlled")).toHaveAttribute(
      "data-stack-frame-pending",
      "false",
    );
    await expect(page.getByTestId("stack-controlled-count")).toHaveText("0");
    await page.mouse.up();

    await dragStack(page, "stack-dynamic", {
      fraction: 0.28,
      release: false,
    });
    expect(await stackDragProgress(page, "stack-dynamic")).toBeGreaterThan(
      0.18,
    );
    await page.getByTestId("stack-empty-items").dispatchEvent("click");
    await expect(stack(page, "stack-dynamic")).toHaveAttribute(
      "data-stack-drag-progress",
      "0",
    );
    await expect(stack(page, "stack-dynamic")).toHaveAttribute(
      "data-stack-frame-pending",
      "false",
    );
    await expect(
      stack(page, "stack-dynamic").locator('[data-stack-card="true"]'),
    ).toHaveCount(0);
    await page.mouse.up();
  });

  test("disabled and reduced-motion modes remain stable", async ({
    page,
  }, testInfo) => {
    await page.getByTestId("stack-toggle-disabled").click();
    const controlled = stack(page, "stack-controlled");
    await expect(
      controlled.getByRole("button", { name: "Next item" }),
    ).toBeDisabled();
    await dragStack(page, "stack-controlled", { fraction: 0.6 });
    await expect(page.getByTestId("stack-controlled-count")).toHaveText("0");
    const reduced = stack(page, "stack-reduced-always");
    await reduced.getByRole("button", { name: "Next item" }).click();
    await expect(reduced.locator('[data-outgoing="true"]')).toHaveCount(0);
    if (testInfo.project.name === "chromium-reduced-motion") {
      const main = stack(page, "stack-main");
      await main.getByRole("button", { name: "Next item" }).click();
      await expect(main.locator('[data-outgoing="true"]')).toHaveCount(0);
    }
  });

  test("reflows at 200% without horizontal page overflow", async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 640 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await stack(page, "stack-long").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(activeStackCard(page, "stack-long")).toContainText(
      "LONG CONTENT STILL BELONGS",
    );
  });
});
