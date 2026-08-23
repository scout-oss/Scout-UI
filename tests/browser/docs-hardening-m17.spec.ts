import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";

const componentRoutes = [
  "sticker",
  "sticker-badge",
  "sticker-button",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
].map((slug) => `/components/${slug}`);

const exampleRoutes = [
  "sticker-trail-hero",
  "custom-cursor-canvas",
  "campaign-navbar",
  "peel-product-detail",
  "sticker-mood-board",
  "stacked-stories",
].map((slug) => `/examples/${slug}`);

const majorRoutes = [
  "/",
  "/components",
  ...componentRoutes,
  "/playground/sticker-trail",
  "/stickers",
  "/examples",
  ...exampleRoutes,
  "/guides",
  "/guides/accessibility",
];

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop");
}

async function expectNoDocumentOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document, JSON.stringify(widths)).toBeLessThanOrEqual(
    widths.viewport + 1,
  );
  expect(widths.body, JSON.stringify(widths)).toBeLessThanOrEqual(
    widths.viewport + 1,
  );
}

test.describe("M17 documentation accessibility matrix", () => {
  test("every major route has no critical or serious axe violation", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    test.setTimeout(240_000);
    const diagnostics = captureBrowserDiagnostics(page);
    for (const route of majorRoutes) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await expectNoAxeViolations(page, testInfo);
    }
    await diagnostics.expectClean(testInfo);
  });

  test("open Search, Prompt, and mobile navigation states pass axe and return focus", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    const diagnostics = captureBrowserDiagnostics(page);

    await page.goto("/");
    await page.keyboard.press("/");
    const search = page.getByRole("dialog", { name: "Search Scout UI" });
    await expect(search).toBeVisible();
    await search.getByRole("searchbox").fill("sticker");
    await expectNoAxeViolations(page, testInfo);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /search/iu })).toBeFocused();

    await page.goto("/playground/sticker-trail");
    const promptTrigger = page.getByRole("button", { name: "Copy AI Prompt" });
    await promptTrigger.focus();
    await page.keyboard.press("Enter");
    const prompt = page.getByRole("dialog", {
      name: "AI Prompt · StickerTrail",
    });
    await expect(prompt).toBeVisible();
    await expectNoAxeViolations(page, testInfo);
    await page.keyboard.press("Escape");
    await expect(promptTrigger).toBeFocused();

    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    const menuTrigger = page.getByRole("button", {
      name: "Open navigation menu",
    });
    await menuTrigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "Open navigation menu" });
    await expect(menu).toBeVisible();
    await menu.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map(async (animation) => animation.finished),
      );
    });
    await expectNoAxeViolations(page, testInfo);
    await page.keyboard.press("Escape");
    await expect(menuTrigger).toBeFocused();
    await diagnostics.expectClean(testInfo);
  });

  test("keyboard-only paths preserve skip, search, prompt, and share controls", async ({
    context,
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();

    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox")).toBeFocused();
    await page.keyboard.press("Escape");

    await page.goto("/playground/sticker-trail");
    await page.getByRole("button", { name: "Share", exact: true }).focus();
    await page.keyboard.press("Space");
    await expect(page.locator('[data-share-status="copied"]')).toContainText(
      "Share link copied",
    );
    await page.getByRole("button", { name: "Copy AI Prompt" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("dialog", { name: "AI Prompt · StickerTrail" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("Chromium accessibility tree excludes decorative engines and inactive layers", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/examples/stacked-stories");
    await page.getByRole("button", { name: "Next item" }).click();
    await expect(page.getByText("Item 2 of 3")).toBeAttached();
    const session = await page.context().newCDPSession(page);
    const stackTree = await session.send("Accessibility.getFullAXTree");
    const stackText = JSON.stringify(stackTree);
    expect(stackText).toContain("Item 2 of 3");
    expect(stackText).toContain(
      "Native semantics are the strongest special effect.",
    );
    expect(stackText).not.toContain(
      "Expression needs boundaries to stay usable.",
    );
    expect(stackText).not.toContain(
      "One loud interaction beats ten competing ones.",
    );

    await page.goto("/examples/sticker-trail-hero");
    const trailTree = await session.send("Accessibility.getFullAXTree");
    expect(JSON.stringify(trailTree)).not.toContain("data-sui-trail-slot");

    await page.goto("/examples/custom-cursor-canvas");
    const cursorTree = await session.send("Accessibility.getFullAXTree");
    expect(JSON.stringify(cursorTree)).not.toContain("data-sui-cursor-echo");
    await session.detach();
  });
});

test.describe("M17 reflow and capability matrix", () => {
  test("all major route classes reflow at 320 CSS pixels", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 320, height: 720 });
    for (const route of majorRoutes) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  });

  test("representative pages and dialogs reflow at effective 200 percent", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    // At 200% browser zoom a 640px viewport exposes 320 CSS px to layout.
    // Playwright cannot change browser zoom portably, so the equivalent CSS
    // viewport is the deterministic cross-engine reflow proof.
    await page.setViewportSize({ width: 320, height: 900 });
    for (const route of [
      "/",
      "/components/sticker-trail",
      "/components/sticker-peel",
      "/components/sticker-stack",
      "/components/sticker-navbar",
      "/stickers",
      "/examples/peel-product-detail",
      "/guides/accessibility",
    ]) {
      await page.goto(route);
      await expectNoDocumentOverflow(page);
    }

    await page.goto("/playground/sticker-trail");
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect(
      page.getByRole("button", { name: "Copy Prompt" }),
    ).toBeVisible();
    await expectNoDocumentOverflow(page);
  });

  test("forced colors preserves boundaries, current state, and focus", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    await page.goto("/components/sticker-button");
    const link = page.getByRole("link", { name: /Playground/iu }).first();
    await link.focus();
    expect(
      await link.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    await expectNoAxeViolations(page, testInfo);
    await page.keyboard.press("/");
    await expectNoAxeViolations(page, testInfo);
  });

  test("OS reduced motion leaves calm, understandable docs state", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.goto("/");
    await expectNoAxeViolations(page, testInfo);
    const runningAnimations = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    );
    expect(runningAnimations).toBe(0);
  });

  test("touch/coarse controls remain usable without hover", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-coarse-pointer");
    await page.goto("/playground/sticker-peel");
    await expect(
      page.getByRole("button", { name: "Copy AI Prompt" }),
    ).toBeVisible();
    const controls = page.locator("button:visible, a:visible");
    const count = await controls.count();
    for (let index = 0; index < Math.min(count, 12); index += 1) {
      const box = await controls.nth(index).boundingBox();
      if (box !== null) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
    }
    await expectNoDocumentOverflow(page);
  });
});

test.describe("M17 homepage runtime budget", () => {
  test("repeated full-page scrolling settles frames and records long tasks and layout shift", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __scoutUiM17HomeRuntime?: {
          frames: Set<number>;
          layoutShifts: number[];
          longTasks: number[];
        };
      };
      const frames = new Set<number>();
      const originalRequest = window.requestAnimationFrame.bind(window);
      const originalCancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        const handle = originalRequest((timestamp) => {
          frames.delete(handle);
          callback(timestamp);
        });
        frames.add(handle);
        return handle;
      };
      window.cancelAnimationFrame = (handle) => {
        frames.delete(handle);
        originalCancel(handle);
      };
      scope.__scoutUiM17HomeRuntime = {
        frames,
        layoutShifts: [],
        longTasks: [],
      };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            scope.__scoutUiM17HomeRuntime?.longTasks.push(entry.duration);
          }
        }).observe({ entryTypes: ["longtask"] });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (shift.hadRecentInput !== true) {
              scope.__scoutUiM17HomeRuntime?.layoutShifts.push(
                shift.value ?? 0,
              );
            }
          }
        }).observe({ entryTypes: ["layout-shift"] });
      } catch {
        // Chromium is the recorded reference. Unsupported supplemental APIs
        // leave empty arrays; the frame-set cleanup invariant still runs.
      }
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const metrics = (
        window as typeof window & {
          __scoutUiM17HomeRuntime?: {
            layoutShifts: number[];
            longTasks: number[];
          };
        }
      ).__scoutUiM17HomeRuntime;
      metrics?.layoutShifts.splice(0);
      metrics?.longTasks.splice(0);
    });

    const started = Date.now();
    for (let round = 0; round < 5; round += 1) {
      for (let step = 0; step <= 20; step += 1) {
        const direction = round % 2 === 0 ? step : 20 - step;
        await page.evaluate((ratio) => {
          const maximum =
            document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo(0, maximum * ratio);
        }, direction / 20);
        await page.waitForTimeout(32);
      }
    }
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
      const metrics = (
        window as typeof window & {
          __scoutUiM17HomeRuntime?: {
            frames: Set<number>;
            layoutShifts: number[];
            longTasks: number[];
          };
        }
      ).__scoutUiM17HomeRuntime;
      const layoutShifts = metrics?.layoutShifts ?? [];
      const longTasks = metrics?.longTasks ?? [];
      return {
        layoutShiftScore: Number(
          layoutShifts.reduce((total, value) => total + value, 0).toFixed(4),
        ),
        longTaskCount: longTasks.length,
        longTaskMaxMs: Number(Math.max(0, ...longTasks).toFixed(2)),
        pendingFramesAfterSettle: metrics?.frames.size ?? 0,
        runningAnimationsAfterSettle: document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
      };
    });
    const result = {
      ...report,
      browserVersion: page.context().browser()?.version() ?? "unknown",
      durationMs: Date.now() - started,
      platform: process.platform,
      viewport: { height: 720, width: 1280 },
    };
    console.log(`M17_HOMEPAGE_RUNTIME ${JSON.stringify(result)}`);
    await testInfo.attach("m17-homepage-runtime.json", {
      body: Buffer.from(JSON.stringify(result, null, 2)),
      contentType: "application/json",
    });

    expect(report.pendingFramesAfterSettle).toBe(0);
    expect(report.runningAnimationsAfterSettle).toBe(0);
    expect(report.layoutShiftScore).toBeLessThan(0.02);
    expect(report.longTaskCount).toBeLessThanOrEqual(3);
    expect(report.longTaskMaxMs).toBeLessThan(200);
  });
});
