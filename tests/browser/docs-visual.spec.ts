import { expect, test, type Page, type TestInfo } from "@playwright/test";

const visualExpect = expect.configure({ timeout: 20_000 });

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop");
}

async function settle(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(250);
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
}

async function fullPage(page: Page, name: string) {
  await settle(page);
  await visualExpect(page).toHaveScreenshot(name, { fullPage: true });
}

test.describe("Scout UI M12 docs review baselines", () => {
  test("Home desktop", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/");
    await fullPage(page, "docs-home-desktop.png");
  });

  test("Home tablet", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1024, width: 820 });
    await page.goto("/");
    await fullPage(page, "docs-home-tablet.png");
  });

  test("Home mobile", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await fullPage(page, "docs-home-mobile.png");
  });

  test("Home 320", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 720, width: 320 });
    await page.goto("/");
    await fullPage(page, "docs-home-320.png");
  });

  test("Components desktop pinboard", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/components");
    await fullPage(page, "docs-components-pinboard-desktop.png");
  });

  test("Components mobile", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/components");
    await fullPage(page, "docs-components-mobile.png");
  });

  test("Stickers contact sheet", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/stickers");
    await fullPage(page, "docs-stickers-contact-sheet.png");
  });

  test("Guide paper reading page", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1280 });
    await page.goto("/guides/getting-started");
    await fullPage(page, "docs-guide-paper.png");
  });

  test("Component skeleton desktop", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/components/sticker");
    await fullPage(page, "docs-component-skeleton-desktop.png");
  });

  test("Component skeleton mobile", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/components/sticker");
    await fullPage(page, "docs-component-skeleton-mobile.png");
  });

  test("Desktop page-edge TOC", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/components/sticker#api");
    await page.locator("#api").scrollIntoViewIfNeeded();
    await settle(page);
    await visualExpect(page).toHaveScreenshot("docs-page-edge-toc-desktop.png");
  });

  test("Mobile TOC open", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/guides/getting-started");
    await page.locator(".sui-docs-page-edge-mobile summary").click();
    await settle(page);
    await visualExpect(page).toHaveScreenshot("docs-mobile-toc-open.png");
  });

  test("Search Dialog open", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");
    await page.keyboard.press("/");
    await settle(page);
    await visualExpect(page).toHaveScreenshot("docs-search-dialog-open.png");
  });

  test("Mobile navigation open", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await settle(page);
    await visualExpect(page).toHaveScreenshot(
      "docs-mobile-navigation-open.png",
    );
  });

  test("Night interactive preview board", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/components/sticker");
    await settle(page);
    await visualExpect(
      page.locator(".sui-docs-preview-stage"),
    ).toHaveScreenshot("docs-night-preview-board.png");
  });

  test("Reduced effects", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript(() => {
      window.localStorage.setItem("scout-ui-docs:reduced-effects", "reduced");
    });
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-sui-docs-effects-effective",
      "reduced",
    );
    await fullPage(page, "docs-reduced-effects.png");
  });

  test("200 percent equivalent reflow", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 500, width: 640 });
    await page.goto("/guides/getting-started");
    await fullPage(page, "docs-200-percent-reflow.png");
  });

  test("Preview error state", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator("[data-preview-error='true']")).toBeVisible();
    await settle(page);
    await visualExpect(
      page.locator(".sui-docs-preview-stage"),
    ).toHaveScreenshot("docs-preview-error.png");
  });

  test("Changelog", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/changelog");
    await fullPage(page, "docs-changelog.png");
  });

  test("Open source", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/open-source");
    await fullPage(page, "docs-open-source.png");
  });
});
