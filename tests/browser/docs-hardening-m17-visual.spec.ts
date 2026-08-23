import { expect, test, type Page, type TestInfo } from "@playwright/test";

const visualExpect = expect.configure({ timeout: 20_000 });

async function settle(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
  });
  await page.waitForTimeout(150);
}

async function fullPage(page: Page, name: string) {
  await settle(page);
  await visualExpect(page).toHaveScreenshot(name, { fullPage: true });
}

function projectOnly(testInfo: TestInfo, project: string) {
  test.skip(testInfo.project.name !== project);
}

test.describe("M17 focused hardening visuals", () => {
  test("paper focus and hard-shadow overlap", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-desktop");
    await page.goto("/components/sticker-button");
    await page
      .getByRole("link", { name: /Playground/iu })
      .first()
      .focus();
    await fullPage(page, "m17-focus-paper-overlap.png");
  });

  test("night focus", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-desktop");
    await page.goto("/components/sticker-stack");
    await page.getByRole("button", { name: /Next/iu }).first().focus();
    await fullPage(page, "m17-focus-night-stack.png");
  });

  test("320 component reflow", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-desktop");
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/components/sticker-peel");
    await fullPage(page, "m17-component-peel-320.png");
  });

  test("prompt at effective 200 percent", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-desktop");
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/playground/sticker-trail");
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await page.getByRole("button", { name: "Copy Prompt" }).focus();
    await fullPage(page, "m17-prompt-focus-200-percent.png");
  });

  test("mobile navigation focus", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-desktop");
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("dialog").getByRole("link").first().focus();
    await fullPage(page, "m17-mobile-navbar-focus.png");
  });

  test("forced-colors Search focus", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-forced-colors");
    await page.goto("/");
    await page.keyboard.press("/");
    await page.getByRole("searchbox").fill("sticker");
    await page.getByRole("dialog").getByRole("link").first().focus();
    await fullPage(page, "m17-search-forced-colors-focus.png");
  });

  test("reduced-motion homepage resting state", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-reduced-motion");
    await page.goto("/");
    await fullPage(page, "m17-home-reduced-motion-resting.png");
  });

  test("coarse-pointer playground state", async ({ page }, testInfo) => {
    projectOnly(testInfo, "chromium-coarse-pointer");
    await page.goto("/playground/sticker-trail");
    await fullPage(page, "m17-playground-coarse-pointer.png");
  });
});
