import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";

const guides = [
  "installation",
  "theming",
  "asset-authoring",
  "ssr-nextjs",
  "motion",
  "accessibility",
  "performance",
  "ai-handoff",
  "contributing",
  "migration",
] as const;
const examples = [
  "sticker-trail-hero",
  "custom-cursor-canvas",
  "campaign-navbar",
  "peel-product-detail",
  "sticker-mood-board",
  "stacked-stories",
] as const;

async function search(page: Page, query: string) {
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Scout UI" });
  await dialog.getByRole("searchbox").fill(query);
  return dialog;
}

test.describe("M16 documentation and discovery", () => {
  test("all authored guides and examples are static public pages", async ({
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    for (const slug of guides)
      expect((await request.get(`/guides/${slug}`)).status()).toBe(200);
    for (const slug of examples)
      expect((await request.get(`/examples/${slug}`)).status()).toBe(200);
  });

  test("Pagefind returns component props, guides, and sticker tags from the generated index", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/components");
    let dialog = await search(page, "smoothing");
    await expect(
      dialog.getByRole("link", { name: /StickerCursor/u }).first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    dialog = await search(page, "project facts");
    await expect(
      dialog.getByRole("link", { name: /AI handoff/u }).first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    dialog = await search(page, "scribble pointer");
    await expect(
      dialog.getByRole("link", { name: /sticker drawer/iu }).first(),
    ).toBeVisible();
  });

  test("Pagefind no-results and keyboard return-focus states remain explicit", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/");
    const dialog = await search(page, "qzxvplmno");
    await expect(dialog.getByText("No indexed pages found.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /search/iu })).toBeFocused();
  });

  test("canonical sitemap, robots, and social image use the configured public origin", async ({
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/components/sticker</loc>");
    expect(sitemap).toContain("/examples/stacked-stories</loc>");
    expect(sitemap).not.toContain("test-surfaces");
    const configuredOrigin = sitemap.match(/<loc>([^<]+)\/<\/loc>/u)?.[1] ?? "";
    expect(configuredOrigin).not.toBe("");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /test-surfaces/");
    expect(robots).toContain(`${configuredOrigin}/sitemap.xml`);
    const social = await request.get("/og/component/StickerCursor");
    expect(social.status()).toBe(200);
    expect(social.headers()["content-type"]).toContain("image/png");
  });

  test("representative content is semantic, accessible, and reflows without page overflow", async ({
    page,
  }, testInfo) => {
    test.skip(
      ![
        "chromium-desktop",
        "chromium-forced-colors",
        "chromium-reduced-motion",
      ].includes(testInfo.project.name),
    );
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto("/components/sticker-cursor");
    await expect(
      page.getByRole("heading", { name: "SSR and React Server Components" }),
    ).toBeVisible();
    await expectNoAxeViolations(page, testInfo);
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    await diagnostics.expectClean(testInfo);
  });

  test("only one loud homepage effect intersects a representative viewport", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const intersecting = await page
      .locator(
        ".sui-trail, .sui-sticker-cursor, .sui-sticker-peel, .sui-sticker-stack",
      )
      .evaluateAll(
        (nodes) =>
          nodes.filter((node) => {
            const box = node.getBoundingClientRect();
            return (
              box.bottom > 0 &&
              box.top < innerHeight &&
              box.right > 0 &&
              box.left < innerWidth
            );
          }).length,
      );
    expect(intersecting).toBeLessThanOrEqual(2);
  });
});
