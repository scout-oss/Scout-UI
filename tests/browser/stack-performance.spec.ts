import { expect, test, type Page } from "@playwright/test";

import {
  installResourceTracker,
  readResourceCounts,
} from "./helpers/resource-tracker.ts";
import { dragStack, stackDragProgress } from "./helpers/stack.ts";

const DEV_PAGE = "/strict/stack-render-count.html";

function devURL() {
  const base = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(base).toBeTruthy();
  return `${base ?? "about:blank"}${DEV_PAGE}`;
}

async function readCounts(page: Page) {
  return await page.evaluate(() => {
    const scope = window as typeof window & {
      __scoutUiStackChildRenders?: number;
      __scoutUiStackCommits?: number;
    };
    return {
      childRenders: scope.__scoutUiStackChildRenders ?? 0,
      commits: scope.__scoutUiStackCommits ?? 0,
    };
  });
}

test.describe("StickerStack imperative drag performance", () => {
  test("many pointer samples change progress with zero React commits", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("render-count-stack")).toBeVisible();
    await page.waitForTimeout(200);
    const baseline = await readCounts(page);
    expect(baseline.commits).toBeGreaterThan(0);
    expect(baseline.childRenders).toBeGreaterThan(0);
    await dragStack(page, "render-count-stack", {
      fraction: 0.28,
      release: false,
    });
    const progress = await stackDragProgress(page, "render-count-stack");
    expect(progress).toBeGreaterThan(0.18);
    const duringProgress = await readCounts(page);
    expect(duringProgress).toEqual(baseline);
    console.log(
      "STACK_DRAG_PROGRESS",
      JSON.stringify({
        childRendersDuringProgress:
          duringProgress.childRenders - baseline.childRenders,
        progress,
        reactCommitsDuringProgress: duringProgress.commits - baseline.commits,
      }),
    );
    await page.mouse.up();
    await expect
      .poll(async () => (await readResourceCounts(page)).frames)
      .toBe(0);
    expect(await readCounts(page)).toEqual(baseline);
  });

  test("Strict Mode remounts release pointer frames and resources", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("lifecycle-stack")).toBeVisible();
    await expect
      .poll(
        async () =>
          await page.evaluate(
            () =>
              (
                window as typeof window & {
                  __scoutUiStackStrictEffectRuns?: number;
                }
              ).__scoutUiStackStrictEffectRuns ?? 0,
          ),
      )
      .toBeGreaterThanOrEqual(2);
    await dragStack(page, "lifecycle-stack", {
      fraction: 0.25,
      release: false,
    });
    await page.getByTestId("stack-remount").dispatchEvent("click");
    await page.mouse.up();
    await expect(page.getByTestId("stack-cycle")).toHaveText("1");
    const baseline = await readResourceCounts(page);
    for (let cycle = 2; cycle <= 9; cycle += 1) {
      await dragStack(page, "lifecycle-stack", {
        fraction: 0.25,
        release: false,
      });
      await page.getByTestId("stack-remount").dispatchEvent("click");
      await page.mouse.up();
      await expect(page.getByTestId("stack-cycle")).toHaveText(String(cycle));
    }
    await page.waitForTimeout(100);
    const after = await readResourceCounts(page);
    expect(after.frames).toBe(0);
    expect(after.listeners).toBe(baseline.listeners);
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(after.intersectionObservers).toBe(baseline.intersectionObservers);
  });

  test("repeated full swipes stay bounded with no long tasks", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    // Warm React's delegated pointer events and browser input machinery before
    // comparing the sustained window, so one-time host listeners are not
    // mistaken for a Stack leak.
    await dragStack(page, "render-count-stack", { fraction: 0.55 });
    await page.waitForTimeout(280);
    await page.evaluate(() => {
      const scope = window as typeof window & { __stackLongTasks?: number };
      scope.__stackLongTasks = 0;
      new PerformanceObserver((list) => {
        scope.__stackLongTasks =
          (scope.__stackLongTasks ?? 0) + list.getEntries().length;
      }).observe({ entryTypes: ["longtask"] });
    });
    const baselineResources = await readResourceCounts(page);
    const baselineIndexChanges = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __scoutUiStackIndexChanges?: number;
          }
        ).__scoutUiStackIndexChanges ?? 0,
    );
    const startedAt = Date.now();
    let maximumOutgoingCards = 0;
    let maximumRenderedCards = 0;
    let pointerMoves = 0;
    for (let cycle = 0; cycle < 12; cycle += 1) {
      await dragStack(page, "render-count-stack", { fraction: 0.55 });
      pointerMoves += 14;
      maximumRenderedCards = Math.max(
        maximumRenderedCards,
        await page
          .getByTestId("render-count-stack")
          .locator('[data-stack-card="true"]')
          .count(),
      );
      maximumOutgoingCards = Math.max(
        maximumOutgoingCards,
        await page
          .getByTestId("render-count-stack")
          .locator('[data-outgoing="true"]')
          .count(),
      );
      await page.waitForTimeout(280);
    }
    await page.waitForTimeout(120);
    const result = await page.evaluate(() => ({
      longTasks:
        (window as typeof window & { __stackLongTasks?: number })
          .__stackLongTasks ?? 0,
      userAgent: navigator.userAgent,
    }));
    const afterResources = await readResourceCounts(page);
    const successfulSwipeCommits =
      (await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiStackIndexChanges?: number;
            }
          ).__scoutUiStackIndexChanges ?? 0,
      )) - baselineIndexChanges;
    console.log(
      "STACK_PERFORMANCE",
      JSON.stringify({
        architecture: process.arch,
        browser: testInfo.project.name,
        durationMs: Date.now() - startedAt,
        framesAfter: afterResources.frames,
        listenersAfter: afterResources.listeners,
        listenersBefore: baselineResources.listeners,
        longTasks: result.longTasks,
        maximumOutgoingCards,
        maximumRenderedCards,
        node: process.version,
        observersAfter: {
          intersection: afterResources.intersectionObservers,
          resize: afterResources.resizeObservers,
        },
        observersBefore: {
          intersection: baselineResources.intersectionObservers,
          resize: baselineResources.resizeObservers,
        },
        platform: process.platform,
        pointerMoves,
        successfulSwipeCommits,
        userAgent: result.userAgent,
        viewport: page.viewportSize(),
      }),
    );
    expect(pointerMoves).toBe(168);
    expect(successfulSwipeCommits).toBe(12);
    expect(maximumRenderedCards).toBeLessThanOrEqual(4);
    expect(maximumOutgoingCards).toBeLessThanOrEqual(1);
    expect(result.longTasks).toBe(0);
    expect(afterResources.frames).toBe(0);
    expect(afterResources.listeners).toBe(baselineResources.listeners);
    expect(
      await page
        .getByTestId("render-count-stack")
        .locator('[data-stack-card="true"]')
        .count(),
    ).toBeLessThanOrEqual(3);
  });
});
