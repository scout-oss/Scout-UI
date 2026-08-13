import { expect, test, type Page } from "@playwright/test";

import {
  activeStackCard,
  dragStack,
  stack,
  STACK_PATH,
  stackDragProgress,
} from "./helpers/stack.ts";

async function freeze(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation-duration: 0s !important; caret-color: transparent !important; transition-duration: 0s !important; }`,
  });
  await page.evaluate(async () => document.fonts.ready);
}

test.describe("StickerStack review baselines", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ height: 950, width: 1280 });
    await page.goto(STACK_PATH);
  });

  test("default resting stack", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(stack(page, "stack-main")).toHaveScreenshot(
      "stack-default-resting.png",
    );
  });

  test("visible count two", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(stack(page, "stack-visible-2")).toHaveScreenshot(
      "stack-visible-count-2.png",
    );
  });

  test("visible count five", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(stack(page, "stack-visible-5")).toHaveScreenshot(
      "stack-visible-count-5.png",
    );
  });

  test("active transition with one outgoing card", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const root = stack(page, "stack-main");
    await root.getByRole("button", { name: "Next item" }).click();
    await expect(root.locator('[data-outgoing="true"]')).toHaveCount(1);
    await page.addStyleTag({
      content: `.sui-sticker-stack-card-outgoing { animation-delay: -130ms !important; animation-play-state: paused !important; }`,
    });
    await expect(root.locator("xpath=..")).toHaveScreenshot(
      "stack-active-transition.png",
    );
  });

  test("horizontal partial drag", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await dragStack(page, "stack-main", { fraction: 0.28, release: false });
    expect(await stackDragProgress(page, "stack-main")).toBeGreaterThan(0.18);
    await page.addStyleTag({
      content: `*, *::before, *::after { caret-color: transparent !important; transition-duration: 0s !important; }`,
    });
    await expect(
      stack(page, "stack-main").locator("xpath=.."),
    ).toHaveScreenshot("stack-partial-drag.png");
    await page.mouse.up();
  });

  test("vertical axis stack", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await freeze(page);
    await expect(stack(page, "stack-vertical")).toHaveScreenshot(
      "stack-vertical-axis.png",
    );
  });

  test("looping boundary", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const root = stack(page, "stack-loop");
    await root.getByRole("button", { name: "Next item" }).click();
    await expect(root).toHaveAttribute("data-transition", "idle");
    await freeze(page);
    await expect(root).toHaveScreenshot("stack-loop-boundary.png");
  });

  test("mobile bounded depth", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await freeze(page);
    await expect(stack(page, "stack-main")).toHaveScreenshot(
      "stack-mobile-depth.png",
    );
  });

  test("reduced motion resting state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    const root = stack(page, "stack-main");
    await root.getByRole("button", { name: "Next item" }).click();
    await expect(root.locator('[data-outgoing="true"]')).toHaveCount(0);
    await freeze(page);
    await expect(root).toHaveScreenshot("stack-reduced-motion.png");
  });

  test("forced colors focus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    const root = stack(page, "stack-main");
    await root.getByRole("button", { name: "Next item" }).focus();
    await freeze(page);
    await expect(root).toHaveScreenshot("stack-forced-colors.png");
  });

  test("long content reflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 520 });
    await freeze(page);
    await expect(activeStackCard(page, "stack-long")).toHaveScreenshot(
      "stack-long-content.png",
    );
  });
});
