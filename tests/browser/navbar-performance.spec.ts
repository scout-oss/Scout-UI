import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installResourceTracker,
  readResourceCounts,
} from "./helpers/resource-tracker.ts";
import {
  navbar,
  NAVBAR_PATH,
  NAVBAR_STATIC_PATH,
  navbarProgress,
  readNavbarProgress,
} from "./helpers/navbar.ts";

const DEV_PAGE = "/strict/navbar-render-count.html";
// A fully concurrent cross-browser matrix can contribute one unrelated >50ms
// host task. Focused reference runs are expected to remain at zero.
const MATRIX_LONG_TASK_REFERENCE_THRESHOLD = 1;

interface NavbarMetrics {
  childRenders: number;
  commits: number;
  listenerAdds: number;
  listenerRemoves: number;
  maxPendingFrames: number;
  pendingFrames: number;
  scrollSamples: number;
  strictEffectRuns: number;
}

function devURL() {
  const base = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(base).toBeTruthy();
  return `${base ?? "about:blank"}${DEV_PAGE}`;
}

async function readMetrics(page: Page): Promise<NavbarMetrics> {
  return await page.evaluate(
    () =>
      (
        window as typeof window & {
          __navbarMetrics: NavbarMetrics;
        }
      ).__navbarMetrics,
  );
}

async function resetMetrics(page: Page) {
  await page.evaluate(() => {
    (
      window as typeof window & {
        __resetNavbarMetrics: () => void;
      }
    ).__resetNavbarMetrics();
  });
}

test.describe("StickerNavbar scroll and lifecycle performance", () => {
  test("development renderLink diagnostics warn once per invalid item under Strict Mode", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.goto(devURL());
    await expect(page.getByTestId("invalid-render-link-navbar")).toBeVisible();
    await expect
      .poll(() =>
        warnings.filter((entry) => /renderLink.*anchor/iu.test(entry)),
      )
      .toHaveLength(2);
    const diagnostics = warnings.filter((entry) =>
      /renderLink.*anchor/iu.test(entry),
    );
    expect(new Set(diagnostics)).toHaveProperty("size", 2);
  });

  test("progress-disabled mode adds no Navbar scroll listener or frame work", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(NAVBAR_STATIC_PATH);
    await expect(navbarProgress(page)).toHaveCount(0);
    const withoutProgress = await readResourceCounts(page);
    await page.goto(NAVBAR_PATH);
    await expect(navbarProgress(page)).toBeAttached();
    await expect(navbarProgress(page)).toHaveAttribute("aria-hidden", "true");
    const withProgress = await readResourceCounts(page);
    expect(withProgress.listenersByType.scroll ?? 0).toBeGreaterThan(
      withoutProgress.listenersByType.scroll ?? 0,
    );
    await expect(navbar(page)).toHaveAttribute(
      "data-navbar-frame-pending",
      "false",
    );
  });

  test("many scroll samples update transform with zero React commits and one pending frame", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    const root = page.getByTestId("render-count-navbar");
    const progress = root.locator('[data-navbar-progress="true"]');
    await expect(progress).toBeAttached();
    await expect(progress).toHaveAttribute("aria-hidden", "true");
    await page.waitForTimeout(200);

    const liveInstrument = await readMetrics(page);
    expect(liveInstrument.commits).toBeGreaterThan(0);
    expect(liveInstrument.childRenders).toBeGreaterThan(0);
    await page.getByTestId("navbar-toggle-mount").click();
    await expect(page.getByTestId("lifecycle-navbar")).toHaveCount(0);
    await resetMetrics(page);
    const baseline = await readMetrics(page);
    expect(baseline.pendingFrames).toBe(0);

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight / 2);
      for (let index = 0; index < 240; index += 1) {
        window.dispatchEvent(new Event("scroll"));
      }
    });
    await expect
      .poll(async () =>
        Number.parseFloat(
          (await progress.getAttribute("data-navbar-progress-value")) ?? "0",
        ),
      )
      .toBeGreaterThan(0.2);
    await expect
      .poll(async () => (await readMetrics(page)).pendingFrames)
      .toBe(0);

    const after = await readMetrics(page);
    expect(after.scrollSamples).toBeGreaterThanOrEqual(240);
    expect(after.maxPendingFrames).toBeLessThanOrEqual(1);
    expect(after.commits).toBe(0);
    expect(after.childRenders).toBe(0);
    expect(await readNavbarLikeProgress(progress)).toBeGreaterThan(0.2);
    expect((await readResourceCounts(page)).frames).toBe(0);
    await expect(root).toHaveAttribute("data-navbar-frame-pending", "false");

    console.log(
      "NAVBAR_SCROLL_COALESCING",
      JSON.stringify({
        maxPendingFrames: after.maxPendingFrames,
        pendingFramesAfterRest: after.pendingFrames,
        reactCommitsDuringProgress: after.commits,
        scrollSamples: after.scrollSamples,
      }),
    );
  });

  test("Strict Mode remounts and open Dialog teardown release resources and portals", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.setViewportSize({ height: 844, width: 390 });
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect
      .poll(async () => (await readMetrics(page)).strictEffectRuns)
      .toBeGreaterThanOrEqual(2);

    const remount = page.getByTestId("navbar-remount");
    const resourcesBeforeFirstOpen = await readResourceCounts(page);
    const bodyStateBefore = await page.evaluate(() => ({
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
      style: document.body.style.cssText,
    }));
    expect(bodyStateBefore.scrollLocked).toBe(false);

    await page
      .getByTestId("lifecycle-navbar")
      .locator('[data-navbar-menu-trigger="true"]')
      .click();
    await expect(page.locator('[data-navbar-content="true"]')).toHaveCount(1);
    await remount.evaluate((button: HTMLButtonElement) => {
      button.click();
    });
    await expect(page.locator('[data-navbar-content="true"]')).toHaveCount(0);
    await expect(page.getByTestId("navbar-cycle")).toHaveText("1");
    await page.waitForTimeout(100);
    const baseline = await readResourceCounts(page);
    expect(baseline.frames).toBe(0);
    expect(baseline.detachedListeners).toBe(0);
    expect(baseline.resizeObservers).toBe(
      resourcesBeforeFirstOpen.resizeObservers,
    );
    expect(baseline.intersectionObservers).toBe(
      resourcesBeforeFirstOpen.intersectionObservers,
    );

    for (let cycle = 2; cycle <= 10; cycle += 1) {
      await page
        .getByTestId("lifecycle-navbar")
        .locator('[data-navbar-menu-trigger="true"]')
        .click();
      await expect(page.locator('[data-navbar-content="true"]')).toHaveCount(1);
      await remount.evaluate((button: HTMLButtonElement) => {
        button.click();
      });
      await expect(page.locator('[data-navbar-content="true"]')).toHaveCount(0);
      await expect(page.getByTestId("navbar-cycle")).toHaveText(String(cycle));
    }

    await page.waitForTimeout(120);
    const after = await readResourceCounts(page);
    expect(after.frames).toBe(0);
    expect(after.detachedListeners).toBe(0);
    expect(after.listeners).toBe(baseline.listeners);
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(after.intersectionObservers).toBe(baseline.intersectionObservers);
    expect(
      await page
        .locator(
          "[data-radix-portal], [data-navbar-content], [data-navbar-dialog-overlay], [data-navbar-overlay]",
        )
        .count(),
    ).toBe(0);
    const bodyStateAfter = await page.evaluate(() => ({
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
      style: document.body.style.cssText,
    }));
    expect(bodyStateAfter).toEqual(bodyStateBefore);

    console.log(
      "NAVBAR_DIALOG_CLEANUP",
      JSON.stringify({
        dialogRemountCycles: 10,
        leakedDialogPortalNodes: 0,
        listenersAfter: after.listeners,
        listenersBefore: baseline.listeners,
        observersAfter: {
          intersection: after.intersectionObservers,
          resize: after.resizeObservers,
        },
        observersBefore: {
          intersection: baseline.intersectionObservers,
          resize: baseline.resizeObservers,
        },
      }),
    );
  });

  test("sustained scroll returns to idle without long tasks or resource growth", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await page.waitForTimeout(200);
    await page.getByTestId("navbar-toggle-mount").click();
    await expect(page.getByTestId("lifecycle-navbar")).toHaveCount(0);
    await resetMetrics(page);
    await page.evaluate(() => {
      const state = window as typeof window & { __navbarLongTasks?: number };
      state.__navbarLongTasks = 0;
      new PerformanceObserver((list) => {
        state.__navbarLongTasks =
          (state.__navbarLongTasks ?? 0) + list.getEntries().length;
      }).observe({ entryTypes: ["longtask"] });
    });
    const resourcesBefore = await readResourceCounts(page);
    const startedAt = Date.now();
    const scrollSamples = 180;

    for (let index = 0; index < scrollSamples; index += 1) {
      await page.evaluate((sample) => {
        const maximum =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, (maximum * sample) / 179);
      }, index);
    }
    await page.waitForTimeout(150);
    await expect.poll(() => readRibbonPersistentAnimations(page)).toBe(0);

    const [
      metricsAfter,
      resourcesAfter,
      runtime,
      ribbonPersistentFramesAfterReveal,
    ] = await Promise.all([
      readMetrics(page),
      readResourceCounts(page),
      page.evaluate(() => ({
        longTasks:
          (window as typeof window & { __navbarLongTasks?: number })
            .__navbarLongTasks ?? 0,
        userAgent: navigator.userAgent,
      })),
      readRibbonPersistentAnimations(page),
    ]);
    const durationMs = Date.now() - startedAt;
    expect(metricsAfter.commits).toBe(0);
    expect(metricsAfter.pendingFrames).toBe(0);
    expect(metricsAfter.maxPendingFrames).toBeLessThanOrEqual(1);
    expect(resourcesAfter.frames).toBe(0);
    expect(resourcesAfter.listeners).toBe(resourcesBefore.listeners);
    expect(resourcesAfter.resizeObservers).toBe(
      resourcesBefore.resizeObservers,
    );
    expect(resourcesAfter.intersectionObservers).toBe(
      resourcesBefore.intersectionObservers,
    );
    expect(runtime.longTasks).toBeLessThanOrEqual(
      MATRIX_LONG_TASK_REFERENCE_THRESHOLD,
    );
    expect(ribbonPersistentFramesAfterReveal).toBe(0);

    console.log(
      "NAVBAR_PERFORMANCE",
      JSON.stringify({
        architecture: process.arch,
        browser: testInfo.project.name,
        durationMs,
        listenersAfter: resourcesAfter.listeners,
        listenersBefore: resourcesBefore.listeners,
        longTasks: runtime.longTasks,
        maximumPendingNavbarFrames: metricsAfter.maxPendingFrames,
        node: process.version,
        observersAfter: {
          intersection: resourcesAfter.intersectionObservers,
          resize: resourcesAfter.resizeObservers,
        },
        observersBefore: {
          intersection: resourcesBefore.intersectionObservers,
          resize: resourcesBefore.resizeObservers,
        },
        pendingNavbarFramesAfterRest: metricsAfter.pendingFrames,
        platform: process.platform,
        reactCommitsDuringProgress: metricsAfter.commits,
        ribbonPersistentFramesAfterReveal,
        scrollSamples,
        userAgent: runtime.userAgent,
        viewport: page.viewportSize(),
      }),
    );
  });
});

async function readNavbarLikeProgress(progress: Locator): Promise<number> {
  return await progress.evaluate((element: HTMLElement) => {
    const match = /scaleX\(([-+\d.eE]+)\)/u.exec(element.style.transform);
    if (match?.[1] !== undefined) return Number.parseFloat(match[1]);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return matrix.a;
  });
}

async function readRibbonPersistentAnimations(page: Page): Promise<number> {
  return await page.evaluate(
    () =>
      document
        .querySelector(
          '[data-testid="render-count-navbar"] [data-navbar-ribbon="true"]',
        )
        ?.getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation.playState === "running" ||
            animation.playState === "pending",
        ).length ?? -1,
  );
}

// Keep the shared helper exercised against the Next fixture so accidental
// selector drift is caught in the same file as the imperative measurements.
test("Navbar progress helper reads the packed Next surface", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto(NAVBAR_PATH);
  expect(await readNavbarProgress(page)).toBeGreaterThanOrEqual(0);
});
