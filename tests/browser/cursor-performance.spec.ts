import { expect, test, type Page } from "@playwright/test";

import {
  installResourceTracker,
  readResourceCounts,
  trailListenerTotal,
} from "./helpers/resource-tracker.ts";
import { readCursor, visibleBox } from "./helpers/cursor.ts";

const DEV_PAGE = "/strict/cursor-render-count.html";

interface CursorCounts {
  childRenders: number;
  commits: number;
}

async function readCounts(page: Page): Promise<CursorCounts> {
  return await page.evaluate(() => {
    const scope = window as typeof window & {
      __scoutUiCursorCommits?: number;
      __scoutUiCursorChildRenders?: number;
    };

    return {
      childRenders: scope.__scoutUiCursorChildRenders ?? 0,
      commits: scope.__scoutUiCursorCommits ?? 0,
    };
  });
}

function devURL() {
  const base = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(base).toBeTruthy();
  return `${base ?? "about:blank"}${DEV_PAGE}`;
}

/** Sweep the pointer in steps so each lands in its own frame. */
async function sweep(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  laps: number,
) {
  const stepWidth = (box.width - 24) / 10;
  for (let lap = 0; lap < laps; lap += 1) {
    for (let step = 0; step <= 10; step += 1) {
      await page.mouse.move(
        box.x + 12 + stepWidth * step,
        box.y + 24 + (lap % 4) * 14,
      );
      await page.waitForTimeout(18);
    }
  }
}

test.describe("zero React renders from pointer work", () => {
  test("sustained movement and state changes cause no React commit", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(devURL());
    await expect(page.getByTestId("render-count-cursor")).toBeVisible();
    await page.waitForTimeout(400);

    const baseline = await readCounts(page);
    expect(
      baseline.commits,
      "the Profiler reported no commits, so it is not instrumenting this build",
    ).toBeGreaterThan(0);
    expect(baseline.childRenders).toBeGreaterThan(0);

    const box = await visibleBox(page, "render-count-cursor");
    await sweep(page, box, 8);

    // The cursor must actually have moved, or the proof is vacuous.
    const moved = await readCursor(page, "render-count-cursor");
    expect(moved.visible).toBe(true);

    // Cross a state boundary and press, both of which change the visual.
    await page.getByTestId("cursor-hover-target").hover();
    await page.waitForTimeout(80);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
    await page.waitForTimeout(80);

    const after = await readCounts(page);
    expect(
      after.commits,
      "pointer movement or a state change committed a React render",
    ).toBe(baseline.commits);
    expect(after.childRenders).toBe(baseline.childRenders);

    // Let echoes expire: their lifecycle is engine work, not React work.
    await page.waitForTimeout(700);
    expect((await readCounts(page)).commits).toBe(baseline.commits);

    // A genuine state change still renders, so the instrument is not dead.
    await page.getByTestId("cursor-force-rerender").click();
    await expect
      .poll(async () => (await readCounts(page)).commits)
      .toBeGreaterThan(baseline.commits);
  });
});

test.describe("frame idling", () => {
  test("scheduled frames return to zero once the cursor settles", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("render-count-cursor")).toBeVisible();
    await page.waitForTimeout(400);

    const box = await visibleBox(page, "render-count-cursor");
    const idle = await readResourceCounts(page);

    // Repeat: a leak would accumulate across rounds rather than show up once.
    for (let round = 0; round < 3; round += 1) {
      let sawScheduledFrame = false;

      for (let step = 0; step <= 8; step += 1) {
        await page.mouse.move(box.x + 20 + step * 18, box.y + 40 + round * 10);
        const during = await readResourceCounts(page);
        if (during.frames > 0) {
          sawScheduledFrame = true;
        }
      }

      expect(
        sawScheduledFrame,
        `round ${String(round)} scheduled no frames, so settling proves nothing`,
      ).toBe(true);

      // Stop moving and let the engine converge.
      await expect
        .poll(async () => (await readResourceCounts(page)).frames, {
          timeout: 5000,
        })
        .toBe(idle.frames);
    }

    const settled = await readResourceCounts(page);
    expect(settled.frames, "an idle frame loop survived settling").toBe(
      idle.frames,
    );
  });
});

test.describe("Strict Mode", () => {
  test("survives the development-build setup/cleanup replay", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto(devURL());
    await expect(page.getByTestId("cursor-mounted")).toBeVisible();

    // Refuse to pass vacuously: prove the replay is really happening.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __scoutUiCursorStrictEffectRuns?: number;
              }
            ).__scoutUiCursorStrictEffectRuns ?? 0,
        ),
      )
      .toBe(2);

    // The doubled setup must not produce a second layer or a second echo pool.
    await expect(
      page.getByTestId("lifecycle-cursor").locator(".sui-sticker-cursor-layer"),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("lifecycle-cursor").locator("[data-sui-cursor-echo]"),
    ).toHaveCount(4);

    const toggle = page.getByTestId("cursor-toggle");

    async function runCycles(count: number) {
      for (let cycle = 0; cycle < count; cycle += 1) {
        await toggle.click();
        await expect(page.getByTestId("cursor-mounted")).toBeVisible();

        const box = await visibleBox(page, "lifecycle-cursor");
        await page.mouse.move(box.x + 20, box.y + 20);
        await page.mouse.move(box.x + box.width - 20, box.y + 40);
        await page.mouse.down();
        await page.mouse.up();

        await toggle.click();
        await expect(page.getByTestId("cursor-mounted")).toHaveCount(0);
      }

      await page.waitForTimeout(400);
      return await readResourceCounts(page);
    }

    // Two equal phases compared to each other: a per-cycle leak necessarily
    // differs between them, while one-time host registrations cancel out.
    await toggle.click();
    await expect(page.getByTestId("cursor-mounted")).toHaveCount(0);
    const first = await runCycles(6);
    const second = await runCycles(6);

    expect(
      trailListenerTotal(second),
      `engine listener leak: ${JSON.stringify(second.listenersByType)}`,
    ).toBe(trailListenerTotal(first));
    expect(second.resizeObservers, "ResizeObserver leak").toBe(
      first.resizeObservers,
    );
    expect(second.frames, "animation frame leak").toBe(first.frames);

    // Cursor-owned DOM can be attributed unambiguously: with the component
    // unmounted, no layer, visual, or echo node may survive.
    expect(await page.locator(".sui-sticker-cursor-layer").count()).toBe(1);
    expect(await page.getByTestId("cursor-mounted").locator("*").count()).toBe(
      0,
    );

    // And the native cursor must be back.
    await page.mouse.move(200, 200);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).cursor === "none",
      ),
    ).toBe(false);
  });
});

test.describe("sustained motion", () => {
  test("thirty seconds of movement stays bounded", async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "The sustained benchmark runs on the designated reference project only.",
    );
    test.setTimeout(180_000);

    await installResourceTracker(page);
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __scoutUiPerf?: { frames: number[]; longTasks: number[] };
      };
      scope.__scoutUiPerf = { frames: [], longTasks: [] };

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            scope.__scoutUiPerf?.longTasks.push(entry.duration);
          }
        }).observe({ entryTypes: ["longtask"] });
      } catch {
        // Long-task timing is unavailable in some engines; frame data still is.
      }

      let previous = 0;
      const sample = (timestamp: number) => {
        if (previous > 0) {
          scope.__scoutUiPerf?.frames.push(timestamp - previous);
        }
        previous = timestamp;
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await page.goto(devURL());
    await expect(page.getByTestId("render-count-cursor")).toBeVisible();
    await page.waitForTimeout(500);

    const box = await visibleBox(page, "render-count-cursor");
    const baseline = await readResourceCounts(page);
    const renderBaseline = await readCounts(page);

    const durationMs = 30_000;
    const started = Date.now();
    let moves = 0;
    let clicks = 0;
    let peakEchoes = 0;

    while (Date.now() - started < durationMs) {
      const phase = ((Date.now() - started) / durationMs) * Math.PI * 8;
      await page.mouse.move(
        box.x + box.width / 2 + Math.cos(phase) * (box.width * 0.4),
        box.y + box.height / 2 + Math.sin(phase * 1.7) * (box.height * 0.35),
      );
      moves += 1;

      if (moves % 40 === 0) {
        await page.mouse.down();
        await page.mouse.up();
        clicks += 1;
        peakEchoes = Math.max(
          peakEchoes,
          await page.locator("[data-sui-cursor-echo]").count(),
        );
      }
    }

    const perf = await page.evaluate(() => {
      const scope = window as typeof window & {
        __scoutUiPerf?: { frames: number[]; longTasks: number[] };
      };
      return scope.__scoutUiPerf ?? { frames: [], longTasks: [] };
    });

    const frames = [...perf.frames].sort((a, b) => a - b);
    const percentile = (value: number) =>
      frames.length === 0
        ? 0
        : (frames[
            Math.min(frames.length - 1, Math.floor(frames.length * value))
          ] ?? 0);

    // Let the cursor settle, then confirm the loop stopped.
    await page.waitForTimeout(1500);
    const after = await readResourceCounts(page);
    const renderAfter = await readCounts(page);

    const report = {
      browser: browserName,
      browserVersion: page.context().browser()?.version() ?? "unknown",
      clicks,
      cursorVisuals: await page.locator(".sui-sticker-cursor-visual").count(),
      durationMs,
      echoNodesMax: peakEchoes,
      frameSamples: frames.length,
      frameTimeMedianMs: Number(percentile(0.5).toFixed(2)),
      frameTimeP95Ms: Number(percentile(0.95).toFixed(2)),
      longTaskCount: perf.longTasks.length,
      longTaskMaxMs: Number(Math.max(0, ...perf.longTasks).toFixed(2)),
      nodeVersion: process.version,
      pendingFramesAfterSettle: after.frames,
      platform: process.platform,
      pointerMoves: moves,
      reactCommitsDuringMovement: renderAfter.commits - renderBaseline.commits,
      resourcesAfter: {
        engineListeners: trailListenerTotal(after),
        intersectionObservers: after.intersectionObservers,
        resizeObservers: after.resizeObservers,
      },
      resourcesBefore: {
        engineListeners: trailListenerTotal(baseline),
        intersectionObservers: baseline.intersectionObservers,
        resizeObservers: baseline.resizeObservers,
      },
    };

    await testInfo.attach("cursor-performance.json", {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: "application/json",
    });
    console.log(`CURSOR_PERFORMANCE ${JSON.stringify(report)}`);

    // Regression properties: bounded work and stable resources. No universal
    // frame-rate claim is made.
    expect(
      report.reactCommitsDuringMovement,
      "React rendered on movement",
    ).toBe(0);
    expect(report.cursorVisuals, "more than one cursor visual exists").toBe(2);
    expect(report.echoNodesMax, "echo pool grew").toBeLessThanOrEqual(8);
    expect(
      after.frames,
      "an idle frame loop survived the benchmark",
    ).toBeLessThanOrEqual(baseline.frames + 1);
    expect(trailListenerTotal(after), "listener growth").toBe(
      trailListenerTotal(baseline),
    );
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(frames.length, "no frames were sampled").toBeGreaterThan(100);
    expect(
      report.frameTimeP95Ms,
      "95th percentile frame time regressed",
    ).toBeLessThan(100);
  });
});
