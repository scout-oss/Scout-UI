import { expect, test, type Page } from "@playwright/test";

import {
  dragPeel,
  peel,
  PEEL_PATH,
  peelProgress,
  peelToggle,
} from "./helpers/peel.ts";

async function freeze(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await page.evaluate(async () => document.fonts.ready);
}

test.describe("Peel review baselines", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(PEEL_PATH);
  });

  test("closed resting peel", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(peel(page, "peel-closed")).toHaveScreenshot("peel-closed.png");
  });

  test("partial drag progress", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await dragPeel(page, "peel-origin-top-left", 0.5, false);
    const progress = await peelProgress(page, "peel-origin-top-left");
    expect(progress).toBeGreaterThan(0.35);
    expect(progress).toBeLessThan(0.65);
    await freeze(page);
    await expect(peel(page, "peel-origin-top-left")).toHaveScreenshot(
      "peel-partial-drag.png",
    );
    await page.mouse.up();
  });

  test("fully open state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(peel(page, "peel-open")).toHaveScreenshot("peel-open.png");
  });

  test("all four resting origins", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(page.locator(".peel-origin-grid")).toHaveScreenshot(
      "peel-four-origins.png",
    );
  });

  test("reduced-motion state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await peelToggle(page, "peel-reduced").click();
    await freeze(page);
    await expect(peel(page, "peel-reduced")).toHaveScreenshot(
      "peel-reduced-motion.png",
    );
  });

  test("long-content reflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 640 });
    await peelToggle(page, "peel-long").click();
    await freeze(page);
    await expect(peel(page, "peel-long")).toHaveScreenshot("peel-long.png");
  });

  test("forced-colors focus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await peelToggle(page, "peel-closed").focus();
    await freeze(page);
    await expect(peel(page, "peel-closed")).toHaveScreenshot(
      "peel-forced-colors.png",
    );
  });
});
