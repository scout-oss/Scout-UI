import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";

const majorRoutes = [
  ["/", "UI THAT STICKS."],
  ["/components", "Components"],
  ["/stickers", "The sticker drawer"],
  ["/playground", "Playground"],
  ["/examples", "Examples with boundaries"],
  ["/guides", "Guides"],
  ["/changelog", "Changelog"],
  ["/open-source", "Open source, with receipts"],
] as const;

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test.describe("Scout UI docs server foundation", () => {
  test("representative shell stays healthy across the browser and device matrix", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto("/components/sticker");
    await expect(
      page.getByRole("heading", { level: 1, name: "Sticker" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expectNoDocumentOverflow(page);
    await diagnostics.expectClean(testInfo);
  });

  for (const [route, heading] of majorRoutes) {
    test(`${route} returns route-specific server HTML and metadata`, async ({
      page,
      request,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop");
      const response = await request.get(route);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(
        route === "/" ? "open-source sticker UI library" : heading,
      );
      expect(html).toContain('rel="canonical"');
      expect(html).toContain("Scout UI documentation");
      expect(html).toContain("Footer navigation");

      const diagnostics = captureBrowserDiagnostics(page);
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(heading);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        route === "/" ? /^https?:\/\/[^/]+\/?$/u : new RegExp(`${route}$`, "u"),
      );
      await diagnostics.expectClean(testInfo);
    });
  }

  test("representative MDX guide renders headings, TOC, links and code in server HTML", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const response = await request.get("/guides/getting-started");
    const html = await response.text();
    expect(html).toContain('id="install-the-foundation"');
    expect(html).toContain('id="keep-semantics-native"');
    expect(html).toContain("@scout-ui/react/styles.css");
    await page.goto("/guides/getting-started");
    await expect(page.locator(".sui-docs-mdx pre code")).toContainText(
      "StickerButton",
    );
    await expect(
      page.getByRole("link", { name: "component pinboard" }),
    ).toHaveAttribute("href", "/components");
    await expectNoAxeViolations(page, testInfo);
  });
});

test.describe("Scout UI docs keyboard and resilience", () => {
  test("skip link is first, visible on focus, and reaches main content", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await skip.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("search opens with slash, traps focus, ignores editing, closes, and returns focus", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/components");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Search Scout UI" });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("searchbox");
    await expect(input).toBeFocused();
    await input.pressSequentially("/stickers");
    await expect(input).toHaveValue("/stickers");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /search/iu })).toBeFocused();
  });

  test("search result navigation uses the replaceable foundation source and route focus", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/");
    await page.keyboard.press("/");
    await page.getByRole("searchbox").fill("getting started");
    await page.getByRole("link", { name: /getting started/iu }).click();
    await expect(page).toHaveURL(/\/guides\/getting-started$/u);
    await expect(page.locator("[data-route-heading]")).toBeFocused();
  });

  test("desktop Next navigation preserves current route and focuses the new H1", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");
    await page
      .locator('[data-navbar-nav="desktop"]')
      .getByRole("link", { name: "Components" })
      .click();
    await expect(page).toHaveURL(/\/components$/u);
    await expect(page.locator("[data-route-heading]")).toBeFocused();
    await expect(
      page.locator('[data-navbar-item="components"]').first(),
    ).toHaveAttribute("aria-current", "page");
  });

  test("mobile Navbar closes on Next navigation and preserves native links", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Open navigation menu" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Guides" }).click();
    await expect(page).toHaveURL(/\/guides$/u);
    await expect(dialog).toBeHidden();
    await expect(page.locator("h1")).toContainText("Guides");
  });

  test("desktop and mobile TOC expose current state and keyboard-safe anchors", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/components/sticker");
    const desktopToc = page.locator(".sui-docs-page-edge-desktop");
    await expect(desktopToc).toBeVisible();
    await desktopToc.getByRole("link", { name: "API" }).click();
    await expect(page).toHaveURL(/#api$/u);
    await expect(page.locator("#api h2")).toBeFocused();
    const top = await page
      .locator("#api h2")
      .evaluate((heading) => heading.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(60);

    await page.setViewportSize({ height: 844, width: 390 });
    const mobileToc = page.locator(".sui-docs-page-edge-mobile");
    await expect(mobileToc).toBeVisible();
    await mobileToc.getByText("On this page", { exact: true }).click();
    await expect(
      mobileToc.getByRole("link", { name: "Accessibility" }),
    ).toBeVisible();
  });

  test("preview poster, hydration, and settled stage preserve surrounding geometry", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.addInitScript(() => {
      const previewWindow = window as Window & {
        __SCOUT_UI_HOLD_PREVIEW__?: boolean;
      };
      previewWindow.__SCOUT_UI_HOLD_PREVIEW__ = true;
    });
    await page.goto("/components/sticker");
    const preview = page.locator(".sui-docs-preview-stage");
    const following = page.locator("[data-preview-following-content]");
    await expect(preview).toHaveAttribute("data-preview-phase", "poster");
    const before = await Promise.all([
      preview.boundingBox(),
      following.boundingBox(),
    ]);
    await page.evaluate(() => {
      const previewWindow = window as Window & {
        __SCOUT_UI_HOLD_PREVIEW__?: boolean;
      };
      previewWindow.__SCOUT_UI_HOLD_PREVIEW__ = false;
      window.dispatchEvent(new Event("scout-ui:activate-preview"));
    });
    await expect(preview).toHaveAttribute("data-preview-phase", "active");
    await page.waitForTimeout(250);
    const after = await Promise.all([
      preview.boundingBox(),
      following.boundingBox(),
    ]);
    expect(before[0]).not.toBeNull();
    expect(before[1]).not.toBeNull();
    expect(after[0]).not.toBeNull();
    expect(after[1]).not.toBeNull();
    expect(
      Math.abs((before[0]?.height ?? 0) - (after[0]?.height ?? 0)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs((before[1]?.y ?? 0) - (after[1]?.y ?? 0)),
    ).toBeLessThanOrEqual(1);
  });

  test("preview failure stays contained and retry restores the live board", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator("[data-preview-error='true']")).toBeVisible();
    for (const heading of [
      "Install",
      "API",
      "Accessibility",
      "Performance",
      "Source",
    ]) {
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("navigation", { name: "Scout UI documentation" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Retry preview" }).click();
    await expect(page.locator("[data-preview-active='true']")).toBeVisible();
  });

  test("user reduced effects persist and preserve content", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/");
    const control = page.getByRole("button", { name: /reduce effects/iu });
    await control.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-sui-docs-effects-effective",
      "reduced",
    );
    await expect(page.locator("h1")).toContainText("UI THAT STICKS.");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-sui-docs-effects-preference",
      "reduced",
    );
  });

  test("operating-system reduced motion remains authoritative", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto("/");
    const root = page.locator("html");
    const control = page.getByRole("button", { name: /reduce effects/iu });
    await expect(root).toHaveAttribute(
      "data-sui-docs-effects-effective",
      "reduced",
    );
    await control.click();
    const systemControl = page.getByRole("button", {
      name: /use system effects/iu,
    });
    await expect(systemControl).toBeVisible();
    await systemControl.click();
    await expect(root).toHaveAttribute(
      "data-sui-docs-effects-preference",
      "system",
    );
    await expect(root).toHaveAttribute(
      "data-sui-docs-effects-effective",
      "reduced",
    );
    await expect(page.locator("h1")).toContainText("UI THAT STICKS.");
  });

  test("320px and 200% equivalent reflow avoid document overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 720, width: 320 });
    await page.goto("/components/sticker");
    await expectNoDocumentOverflow(page);
    await expect(page.locator(".sui-docs-page-edge-mobile")).toBeVisible();
    await page.setViewportSize({ height: 500, width: 640 });
    await page.goto("/guides/getting-started");
    await expectNoDocumentOverflow(page);
    await expect(page.locator(".sui-docs-code pre")).toHaveCSS(
      "overflow-x",
      "auto",
    );
  });

  test("forced colors preserves boundaries, current state, and focus", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto("/components/sticker");
    const current = page.locator('[data-navbar-item="components"]').first();
    await expect(current).toHaveAttribute("aria-current", "page");
    await current.focus();
    await expect(current).toBeFocused();
    await expect(page.locator(".sui-docs-code")).toHaveCSS(
      "border-top-style",
      "solid",
    );
    await expectNoAxeViolations(page, testInfo);
  });
});

test.describe("Scout UI docs axe matrix", () => {
  for (const [route] of [
    ...majorRoutes,
    ["/components/sticker", "component"],
    ["/test-surfaces/preview-error", "error"],
  ] as const) {
    test(`${route} has no automated accessibility violations`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop");
      await page.goto(route);
      if (route.includes("preview-error")) {
        await expect(page.locator("[data-preview-error='true']")).toBeVisible();
      }
      await expectNoAxeViolations(page, testInfo);
    });
  }

  test("open search Dialog passes axe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto("/");
    await page.keyboard.press("/");
    await expectNoAxeViolations(page, testInfo);
  });

  test("open mobile Navbar passes axe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expectNoAxeViolations(page, testInfo);
  });
});
