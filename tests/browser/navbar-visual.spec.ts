import { expect, test, type Page } from "@playwright/test";

import {
  navbar,
  NAVBAR_COLLAGE_PATH,
  NAVBAR_CUSTOM_PATH,
  NAVBAR_CUSTOM_RIBBON_PATH,
  NAVBAR_INACTIVE_PATH,
  NAVBAR_LONG_PATH,
  NAVBAR_NIGHT_PATH,
  NAVBAR_PATH,
  NAVBAR_REDUCED_PATH,
  openNavbarMenu,
} from "./helpers/navbar.ts";

const visualExpect = expect.configure({ timeout: 15_000 });

async function settleVisual(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(850);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await expect(navbar(page)).toHaveAttribute(
    "data-navbar-frame-pending",
    "false",
  );
}

test.describe("StickerNavbar Windows review baselines", () => {
  test("Ribbon desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_INACTIVE_PATH);
    await settleVisual(page);
    await expect(navbar(page).locator('[aria-current="page"]')).toHaveCount(0);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-ribbon-desktop.png",
    );
  });

  test("Collage desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_COLLAGE_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-collage-desktop.png",
    );
  });

  test("Ribbon current-page state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_PATH);
    await settleVisual(page);
    await expect(
      navbar(page).locator('[data-navbar-item="components"]').first(),
    ).toHaveAttribute("aria-current", "page");
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-ribbon-active.png",
    );
  });

  test("tablet composition", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 1024, width: 820 });
    await page.goto(NAVBAR_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot("navbar-tablet.png");
  });

  test("mobile closed", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(NAVBAR_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-mobile-closed.png",
    );
  });

  test("mobile Dialog open", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(NAVBAR_PATH);
    await openNavbarMenu(page);
    await settleVisual(page);
    await visualExpect(page).toHaveScreenshot("navbar-mobile-dialog-open.png");
  });

  test("very small mobile 375", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 812, width: 375 });
    await page.goto(NAVBAR_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot("navbar-mobile-375.png");
  });

  test("very small mobile 320", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 720, width: 320 });
    await page.goto(NAVBAR_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot("navbar-mobile-320.png");
  });

  test("long labels", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1180 });
    await page.goto(NAVBAR_LONG_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot("navbar-long-labels.png");
  });

  test("custom brand and primary action", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_CUSTOM_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-custom-brand-action.png",
    );
  });

  test("custom brand and primary action at 320", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 720, width: 320 });
    await page.goto(NAVBAR_CUSTOM_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-custom-brand-action-320.png",
    );
  });

  test("sticky scrolled", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_PATH);
    await page.evaluate(() => {
      window.scrollTo(0, 560);
    });
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-sticky-scrolled.png",
    );
  });

  test("scroll progress at document midpoint", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_PATH);
    await page.evaluate(() => {
      const maximum =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, maximum / 2);
    });
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-progress-middle.png",
    );
  });

  test("reduced-motion Ribbon", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_REDUCED_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-ribbon-reduced-motion.png",
    );
  });

  test("forced-colors current and focus states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_PATH);
    await navbar(page)
      .locator('[data-navbar-item="components"]')
      .first()
      .focus();
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-forced-colors.png",
    );
  });

  test("night Collage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_NIGHT_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-night-collage.png",
    );
  });

  test("custom Ribbon path", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_CUSTOM_RIBBON_PATH);
    await settleVisual(page);
    await visualExpect(navbar(page)).toHaveScreenshot(
      "navbar-custom-ribbon.png",
    );
  });
});
