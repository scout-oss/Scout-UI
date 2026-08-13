import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  dragPeel,
  peel,
  PEEL_PATH,
  peelProgress,
  peelToggle,
} from "./helpers/peel.ts";

const DESKTOP = ["chromium-desktop", "firefox-desktop", "webkit-desktop"];
const TOUCH = ["chromium-tablet", "webkit-mobile", "chromium-coarse-pointer"];

test.describe("semantic disclosure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PEEL_PATH);
  });

  test("uses a native named button and one active semantic layer", async ({
    page,
  }) => {
    const root = peel(page, "peel-closed");
    const toggle = peelToggle(page, "peel-closed");
    expect(await toggle.evaluate((element) => element.tagName)).toBe("BUTTON");
    await expect(toggle).toHaveAccessibleName("Peel to reveal");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(root.locator(".sui-sticker-peel-front")).not.toHaveAttribute(
      "inert",
      "",
    );
    await expect(root.locator(".sui-sticker-peel-back")).toHaveAttribute(
      "inert",
      "",
    );
    await expect(root.locator(".sui-sticker-peel-back")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("click opens and closes with exactly one callback per change", async ({
    page,
  }) => {
    const toggle = peelToggle(page, "peel-controlled");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("1");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("2");
  });

  test("Enter and Space toggle without drag", async ({ page }) => {
    const toggle = peelToggle(page, "peel-closed");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape closes and returns focus to the disclosure button", async ({
    page,
  }) => {
    const root = peel(page, "peel-open");
    const toggle = peelToggle(page, "peel-open");
    const backAction = root.getByRole("button", {
      name: "Use the back action",
    });
    expect(
      await backAction.evaluate((element) => {
        element.focus();
        return document.activeElement === element;
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("inactive descendants cannot receive focus or pointer interaction", async ({
    page,
  }) => {
    const root = peel(page, "peel-closed");
    const frontLink = root.locator(".sui-sticker-peel-front a");
    const backAction = root.locator(".sui-sticker-peel-back button");
    await frontLink.focus();
    await expect(frontLink).toBeFocused();
    expect(
      await backAction.evaluate((element) => {
        element.focus();
        return document.activeElement === element;
      }),
    ).toBe(false);
    await expect(backAction.click({ timeout: 400 })).rejects.toThrow();

    await peelToggle(page, "peel-closed").click();
    await backAction.focus();
    await expect(backAction).toBeFocused();
    expect(
      await frontLink.evaluate((element) => {
        element.focus();
        return document.activeElement === element;
      }),
    ).toBe(false);
    await expect(frontLink.click({ timeout: 400 })).rejects.toThrow();
  });

  test("active content preserves links, buttons, and text selection", async ({
    page,
  }) => {
    const root = peel(page, "peel-closed");
    const frontLabel = root.locator(".sui-sticker-peel-front strong");
    await frontLabel.selectText();
    expect(await page.evaluate(() => getSelection()?.toString())).toContain(
      "THE FIELD NOTE",
    );

    await root.locator(".sui-sticker-peel-front a").click();
    await expect(page).toHaveURL(/#peel-fixture-end$/u);

    await peelToggle(page, "peel-closed").click();
    const backAction = root.locator(".sui-sticker-peel-back button");
    await backAction.evaluate((button) => {
      button.addEventListener("click", () => {
        button.setAttribute("data-activated", "true");
      });
    });
    await backAction.click();
    await expect(backAction).toHaveAttribute("data-activated", "true");
  });

  test("a controlled parent may refuse a request without internal state drift", async ({
    page,
  }) => {
    const toggle = peelToggle(page, "peel-refused");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("refused-callback-count")).toHaveText("1");
  });

  test("disabled state stays stable", async ({ page }) => {
    const toggle = peelToggle(page, "peel-disabled");
    await expect(toggle).toBeDisabled();
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(await peelProgress(page, "peel-disabled")).toBe(0);
  });

  test("loading-to-loaded back content preserves the open layer", async ({
    page,
  }) => {
    const toggle = peelToggle(page, "peel-loading");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("loading-back-content")).toBeVisible();
    await page.getByTestId("load-back-content").click();
    await expect(page.getByTestId("loaded-back-content")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("passes automated accessibility checks", async ({ page }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await expectNoAxeViolations(page, testInfo);
    await diagnostics.expectClean(testInfo);
  });
});

test.describe("pointer enhancement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PEEL_PATH);
  });

  test("all four origins map a valid diagonal to partial progress", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    for (const origin of [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]) {
      const id = `peel-origin-${origin}`;
      await dragPeel(page, id, 0.45, false);
      const progress = await peelProgress(page, id);
      expect(progress, origin).toBeGreaterThan(0.25);
      expect(progress, origin).toBeLessThan(0.75);
      await peelToggle(page, id).dispatchEvent("pointercancel", {
        bubbles: true,
        isPrimary: true,
        pointerId: 1,
      });
      await page.mouse.up();
      await expect.poll(() => peelProgress(page, id)).toBe(0);
    }
  });

  test("pointer cancel restores the prior state without a callback", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await dragPeel(page, "peel-controlled", 0.65, false);
    expect(await peelProgress(page, "peel-controlled")).toBeGreaterThan(0);
    await peelToggle(page, "peel-controlled").dispatchEvent("pointercancel", {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
    });
    await page.mouse.up();
    await expect.poll(() => peelProgress(page, "peel-controlled")).toBe(0);
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("0");
  });

  test("drag commits once and its following click cannot reverse it", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await dragPeel(page, "peel-controlled", 0.8);
    await expect(peelToggle(page, "peel-controlled")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("1");
  });

  test("Escape during drag restores state without committing", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await dragPeel(page, "peel-controlled", 0.55, false);
    expect(await peelProgress(page, "peel-controlled")).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect.poll(() => peelProgress(page, "peel-controlled")).toBe(0);
    await expect(peelToggle(page, "peel-controlled")).toBeFocused();
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("0");
  });

  test("controlled prop changes cancel stale drag progress", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await dragPeel(page, "peel-controlled", 0.55, false);
    await page.getByTestId("controlled-external-toggle").dispatchEvent("click");
    await expect(peelToggle(page, "peel-controlled")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect.poll(() => peelProgress(page, "peel-controlled")).toBe(1);
    await page.mouse.up();
    await expect(page.getByTestId("controlled-callback-count")).toHaveText("0");
  });

  test("becoming disabled during drag cancels without opening", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    await dragPeel(page, "peel-runtime-disabled", 0.55, false);
    await page.getByTestId("runtime-disabled-toggle").dispatchEvent("click");
    const toggle = peelToggle(page, "peel-runtime-disabled");
    await expect(toggle).toBeDisabled();
    await expect
      .poll(() => peelProgress(page, "peel-runtime-disabled"))
      .toBe(0);
    await page.mouse.up();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("perpendicular movement is not prevented or claimed", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP.includes(testInfo.project.name));
    const result = await peelToggle(page, "peel-closed").evaluate((toggle) => {
      let movePrevented = false;
      const observer = (event: Event) => {
        movePrevented = event.defaultPrevented;
      };
      document.addEventListener("pointermove", observer, { once: true });
      toggle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
          pointerId: 77,
        }),
      );
      toggle.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 145,
          clientY: 145,
          isPrimary: true,
          pointerId: 77,
        }),
      );
      return {
        dragging: toggle
          .closest(".sui-sticker-peel")
          ?.getAttribute("data-dragging"),
        movePrevented,
      };
    });
    expect(result).toEqual({ dragging: "false", movePrevented: false });
    expect(await peelProgress(page, "peel-closed")).toBe(0);
  });
});

test.describe("environment policies", () => {
  test("tap provides the complete interaction on touch devices", async ({
    page,
  }, testInfo) => {
    test.skip(!TOUCH.includes(testInfo.project.name));
    await page.goto(PEEL_PATH);
    const toggle = peelToggle(page, "peel-closed");
    await toggle.scrollIntoViewIfNeeded();
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    if (box !== null) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("reduced motion disables spatial drag but preserves toggle", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto(PEEL_PATH);
    await dragPeel(page, "peel-closed", 0.7, false);
    expect(await peelProgress(page, "peel-closed")).toBe(0);
    await page.mouse.up();
    const toggle = peelToggle(page, "peel-closed");
    await toggle.click();
    expect(await peelProgress(page, "peel-closed")).toBe(1);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const duration = await peel(page, "peel-closed")
      .locator(".sui-sticker-peel-front")
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(duration).toMatch(/^(?:0s|0\.001s)(?:, (?:0s|0\.001s))*$/u);
  });

  test("long content reflows without horizontal page overflow at 200% zoom", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 640 });
    await page.goto(PEEL_PATH);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect(peelToggle(page, "peel-long")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("forced colors retain a visible toggle boundary and focus", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto(PEEL_PATH);
    const toggle = peelToggle(page, "peel-closed");
    await toggle.focus();
    const styles = await toggle.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
      };
    });
    expect(styles.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(2);
  });
});
