import { expect, test } from "@playwright/test";

import { prepareStableScreenshot } from "../browser/helpers/stable-screenshot.ts";

/**
 * Candidate design baselines for the kinetic redesign. They live under
 * tests/browser-kinetic/__screenshots__ and never touch the frozen v0.1
 * baselines in tests/browser/__screenshots__. Captured in the composed,
 * motion-free resting state.
 */
const desktop = [
  ["kinetic-home-hero.png", "/", ".sui-k-hero"],
  ["kinetic-home-specimens.png", "/", ".sui-k-gallery"],
  ["kinetic-home-drawer.png", "/", ".sui-k-drawer"],
  ["kinetic-home-rules-final.png", "/", ".sui-k-final"],
  ["kinetic-components.png", "/components", ".sui-k-specimens"],
  ["kinetic-stickers-drawer.png", "/stickers", ".sui-k-drawer-layout"],
  [
    "kinetic-component-title.png",
    "/components/sticker-peel",
    ".sui-docs-component-intro",
  ],
] as const;

test.describe("Kinetic candidate baselines", () => {
  for (const [name, route, selector] of desktop) {
    test(name, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop");
      await page.setViewportSize({ height: 900, width: 1440 });
      await prepareStableScreenshot(page);
      await page.goto(route);
      // Element captures must not depend on where the sticky navbar happens
      // to overlap them; it has its own release coverage.
      await page.addStyleTag({
        content: ".sui-sticker-navbar { position: static !important; }",
      });
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await expect(target).toHaveScreenshot(name, {
        animations: "disabled",
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  test("kinetic-mobile-hero.png", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile");
    await prepareStableScreenshot(page);
    await page.goto("/");
    await expect(page).toHaveScreenshot("kinetic-mobile-hero.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });
});
