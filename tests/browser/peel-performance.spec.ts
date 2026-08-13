import { expect, test, type Page } from "@playwright/test";

import {
  installResourceTracker,
  readResourceCounts,
} from "./helpers/resource-tracker.ts";
import { dragPeel, peelProgress } from "./helpers/peel.ts";

const DEV_PAGE = "/strict/peel-render-count.html";

interface PeelCounts {
  childRenders: number;
  commits: number;
}

function devURL() {
  const base = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(base).toBeTruthy();
  return `${base ?? "about:blank"}${DEV_PAGE}`;
}

async function readCounts(page: Page): Promise<PeelCounts> {
  return await page.evaluate(() => {
    const scope = window as typeof window & {
      __scoutUiPeelChildRenders?: number;
      __scoutUiPeelCommits?: number;
    };
    return {
      childRenders: scope.__scoutUiPeelChildRenders ?? 0,
      commits: scope.__scoutUiPeelCommits ?? 0,
    };
  });
}

test.describe("Peel imperative drag performance", () => {
  test("drag progress does not commit React work and frames settle", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("render-count-peel")).toBeVisible();
    await page.waitForTimeout(200);

    const baseline = await readCounts(page);
    expect(baseline.commits).toBeGreaterThan(0);
    expect(baseline.childRenders).toBeGreaterThan(0);

    await dragPeel(page, "render-count-peel", 0.48, false);
    const progress = await peelProgress(page, "render-count-peel");
    expect(progress).toBeGreaterThan(0.3);
    expect(progress).toBeLessThan(0.7);
    expect(await readCounts(page)).toEqual(baseline);

    await page.mouse.up();
    await expect
      .poll(async () => (await readResourceCounts(page)).frames)
      .toBe(0);
    const afterCommit = await readCounts(page);
    expect(afterCommit.commits).toBe(baseline.commits + 1);

    await page.getByTestId("peel-force-rerender").click();
    await expect
      .poll(async () => (await readCounts(page)).commits)
      .toBeGreaterThan(afterCommit.commits);
  });

  test("Strict Mode remounts leave no frame or resource growth", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("lifecycle-peel")).toBeVisible();
    await expect
      .poll(
        async () =>
          await page.evaluate(
            () =>
              (
                window as typeof window & {
                  __scoutUiPeelStrictEffectRuns?: number;
                }
              ).__scoutUiPeelStrictEffectRuns ?? 0,
          ),
      )
      .toBeGreaterThanOrEqual(2);

    // Warm the framework's pointer event delegation once, then compare equal
    // lifecycle phases so one-time React listeners are not mistaken for a Peel
    // leak.
    await dragPeel(page, "lifecycle-peel", 0.4, false);
    await page.getByTestId("peel-remount").dispatchEvent("click");
    await page.mouse.up();
    await expect(page.getByTestId("peel-cycle")).toHaveText("1");
    const baseline = await readResourceCounts(page);

    for (let cycle = 2; cycle <= 9; cycle += 1) {
      await dragPeel(page, "lifecycle-peel", 0.4, false);
      await page.getByTestId("peel-remount").dispatchEvent("click");
      await page.mouse.up();
      await expect(page.getByTestId("peel-cycle")).toHaveText(String(cycle));
    }
    await page.waitForTimeout(100);
    const after = await readResourceCounts(page);
    expect(after.frames).toBe(0);
    expect(after.listeners).toBe(baseline.listeners);
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(after.intersectionObservers).toBe(baseline.intersectionObservers);
  });

  test("repeated drag remains bounded and avoids long tasks", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());

    // Warm React's delegated events and the browser's input machinery before
    // measuring only the sustained gesture window.
    await dragPeel(page, "render-count-peel", 0.82);
    await page.getByTestId("peel-toggle").first().click();
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      const scope = window as typeof window & { __peelLongTasks?: number };
      scope.__peelLongTasks = 0;
      new PerformanceObserver((list) => {
        scope.__peelLongTasks =
          (scope.__peelLongTasks ?? 0) + list.getEntries().length;
      }).observe({ entryTypes: ["longtask"] });
    });
    const baselineResources = await readResourceCounts(page);
    const startedAt = Date.now();
    let pointerMoves = 0;
    for (let cycle = 0; cycle < 12; cycle += 1) {
      await dragPeel(page, "render-count-peel", 0.82);
      pointerMoves += 12;
      await page.getByTestId("peel-toggle").first().click();
    }
    await page.waitForTimeout(120);
    const result = await page.evaluate(() => ({
      longTasks:
        (
          window as typeof window & {
            __peelLongTasks?: number;
          }
        ).__peelLongTasks ?? 0,
      userAgent: navigator.userAgent,
    }));
    const afterResources = await readResourceCounts(page);
    console.log(
      "PEEL_PERFORMANCE",
      JSON.stringify({
        browser: testInfo.project.name,
        durationMs: Date.now() - startedAt,
        framesAfter: afterResources.frames,
        listenersStable:
          afterResources.listeners === baselineResources.listeners,
        longTasks: result.longTasks,
        node: process.version,
        platform: process.platform,
        pointerMoves,
        userAgent: result.userAgent,
        viewport: page.viewportSize(),
      }),
    );
    expect(pointerMoves).toBe(144);
    expect(result.longTasks).toBe(0);
    expect(afterResources.frames).toBe(0);
    expect(afterResources.listeners).toBe(baselineResources.listeners);
  });
});
