import { expect, test, type Page, type TestInfo } from "@playwright/test";

const visualExpect = expect.configure({ timeout: 20_000 });

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop");
}
async function settle(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
  });
  await page.waitForTimeout(200);
}
async function shot(page: Page, name: string, locator?: string) {
  await settle(page);
  if (locator) await visualExpect(page.locator(locator)).toHaveScreenshot(name);
  else await visualExpect(page).toHaveScreenshot(name, { fullPage: true });
}

test.describe("M16 Darwin documentation review", () => {
  for (const [name, route, locator] of [
    ["m16-home-hero.png", "/", ".sui-docs-hero"],
    ["m16-home-proof.png", "/", ".sui-docs-proof-strip"],
    ["m16-home-field-guide.png", "/", ".sui-docs-home-field-guide"],
    ["m16-home-handoff.png", "/", ".sui-docs-home-handoff"],
    ["m16-home-sticker-pack.png", "/", ".sui-docs-home-pack"],
    ["m16-home-final.png", "/", ".sui-docs-home-final"],
    ["m16-components.png", "/components", undefined],
    ["m16-sticker-reference.png", "/components/sticker", undefined],
    ["m16-trail-reference.png", "/components/sticker-trail", undefined],
    ["m16-cursor-reference.png", "/components/sticker-cursor", undefined],
    ["m16-stack-reference.png", "/components/sticker-stack", undefined],
    ["m16-sticker-browser.png", "/stickers", undefined],
    ["m16-examples-index.png", "/examples", undefined],
    ["m16-example-trail.png", "/examples/sticker-trail-hero", undefined],
    ["m16-example-cursor.png", "/examples/custom-cursor-canvas", undefined],
    ["m16-example-navbar.png", "/examples/campaign-navbar", undefined],
    ["m16-example-peel.png", "/examples/peel-product-detail", undefined],
    ["m16-example-mood.png", "/examples/sticker-mood-board", undefined],
    ["m16-example-stack.png", "/examples/stacked-stories", undefined],
    ["m16-guides-index.png", "/guides", undefined],
    ["m16-guide-installation.png", "/guides/installation", undefined],
    ["m16-guide-accessibility.png", "/guides/accessibility", undefined],
    ["m16-guide-ai-handoff.png", "/guides/ai-handoff", undefined],
    ["m16-open-source.png", "/open-source", undefined],
    ["m16-changelog.png", "/changelog", undefined],
  ] as const) {
    test(name, async ({ page }, testInfo) => {
      desktopOnly(testInfo);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(route);
      await shot(page, name, locator);
    });
  }

  test("m16-mobile-home-and-browser.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await shot(page, "m16-home-mobile.png");
    await page.goto("/stickers");
    await shot(page, "m16-sticker-browser-mobile.png");
  });
  test("m16-search-results.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    await page.keyboard.press("/");
    await page.getByRole("searchbox").fill("smoothing");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("link", { name: /StickerCursor/u })
        .first(),
    ).toBeVisible();
    await shot(page, "m16-search-component-result.png");
    await page.getByRole("searchbox").fill("qzxvplmno");
    await expect(page.getByText("No indexed pages found.")).toBeVisible();
    await shot(page, "m16-search-no-results.png");
  });
  test("m16-search-guide-and-sticker.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    await page.keyboard.press("/");
    const input = page.getByRole("searchbox");
    await input.fill("project facts");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("link", { name: /AI handoff/u })
        .first(),
    ).toBeVisible();
    await shot(page, "m16-search-guide-result.png");
    await input.fill("scribble pointer");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("link", { name: /sticker drawer/iu })
        .first(),
    ).toBeVisible();
    await shot(page, "m16-search-sticker-result.png");
  });
  test("m16-small-screen-reflow.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/components");
    await shot(page, "m16-components-mobile.png");
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/components/sticker");
    await shot(page, "m16-component-320.png");
    await page.goto("/");
    await page.keyboard.press("/");
    await page.getByRole("searchbox").fill("rotation");
    await expect(
      page.getByRole("dialog").getByRole("link").first(),
    ).toBeVisible();
    await shot(page, "m16-search-320.png");
    await page.setViewportSize({ width: 640, height: 500 });
    await page.goto("/guides/accessibility");
    await shot(page, "m16-guide-200-percent.png");
  });
  test("m16-preview-failure-full-reference.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator("[data-preview-error='true']")).toBeVisible();
    await shot(page, "m16-preview-failure-reference.png");
  });
  test("m16-reduced-effects-home.png", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto("/");
    await shot(page, "m16-home-reduced-motion.png");
  });
  test("m16-forced-colors-reference.png", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto("/components/sticker-button");
    await shot(page, "m16-reference-forced-colors.png");
  });
  test("m16-social-card.png", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/og/component/StickerCursor");
    await visualExpect(page).toHaveScreenshot("m16-social-card.png");
  });
});
