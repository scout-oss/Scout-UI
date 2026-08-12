import { expect, test, type Page } from "@playwright/test";

import {
  installResourceTracker,
  readResourceCounts,
  trailListenerTotal,
} from "./helpers/resource-tracker.ts";
import { activeSlots, slots, visibleBox } from "./helpers/trail.ts";

interface RenderCounts {
  childRenders: number;
  commits: number;
}

async function readRenderCounts(page: Page): Promise<RenderCounts> {
  return await page.evaluate(() => {
    const scope = window as typeof window & {
      __scoutUiTrailCommits?: number;
      __scoutUiTrailChildRenders?: number;
    };

    return {
      childRenders: scope.__scoutUiTrailChildRenders ?? 0,
      commits: scope.__scoutUiTrailCommits ?? 0,
    };
  });
}

test.describe("zero React renders from pointer work", () => {
  test("sustained movement and slot lifecycles cause no React commit", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
    expect(viteURL).toBeTruthy();

    // A development build: React's Profiler only reports commits there, so a
    // production bundle would count zero and prove nothing.
    await page.goto(`${viteURL ?? "about:blank"}/strict/render-count.html`);
    await expect(slots(page, "render-count-trail")).toHaveCount(12);

    const box = await visibleBox(page, "render-count-trail");

    // Let initialisation settle, then take the baseline.
    await page.waitForTimeout(300);
    const baseline = await readRenderCounts(page);
    expect(
      baseline.commits,
      "the Profiler reported no commits, so it is not instrumenting this build",
    ).toBeGreaterThan(0);
    expect(baseline.childRenders).toBeGreaterThan(0);

    // Each step must land in its own frame. Firing a whole lap synchronously
    // would collapse into one long segment, which the engine correctly rejects
    // as a teleport — and then nothing would spawn to measure.
    const stepWidth = (box.width - 24) / 10;
    for (let lap = 0; lap < 10; lap += 1) {
      for (let step = 0; step <= 10; step += 1) {
        await page.mouse.move(
          box.x + 12 + stepWidth * step,
          box.y + 24 + (lap % 4) * 16,
        );
        await page.waitForTimeout(20);
      }
    }

    const spawned = await activeSlots(page, "render-count-trail").count();
    expect(
      spawned,
      "no nodes spawned, so the proof would be vacuous",
    ).toBeGreaterThan(0);

    const afterMovement = await readRenderCounts(page);
    expect(
      afterMovement.commits,
      "pointer movement must not commit a React render",
    ).toBe(baseline.commits);
    expect(afterMovement.childRenders).toBe(baseline.childRenders);

    // Let every slot expire: recycling is engine work, not React work.
    await page.waitForTimeout(1200);
    const afterExpiry = await readRenderCounts(page);
    expect(
      afterExpiry.commits,
      "slot expiry must not commit a React render",
    ).toBe(baseline.commits);

    // A genuine state change still renders, so the counter is not simply dead.
    await page.getByTestId("force-rerender").click();
    await expect
      .poll(async () => (await readRenderCounts(page)).commits)
      .toBeGreaterThan(baseline.commits);
  });
});

test.describe("mount lifecycle", () => {
  test("repeated mount and unmount leaves no listener, observer, frame, or node", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto("/test-surfaces/trail-lifecycle");
    await expect(page.getByTestId("lifecycle-mounted")).toBeVisible();

    const toggle = page.getByTestId("lifecycle-toggle");

    async function runCycles(count: number) {
      for (let cycle = 0; cycle < count; cycle += 1) {
        await toggle.click();
        await expect(page.getByTestId("lifecycle-mounted")).toBeVisible();

        const box = await visibleBox(page, "lifecycle-trail");
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.mouse.move(box.x + box.width - 10, box.y + 40);

        await toggle.click();
        await expect(page.getByTestId("lifecycle-mounted")).toHaveCount(0);
      }

      await page.waitForTimeout(400);
      return await readResourceCounts(page);
    }

    // Two equal phases are compared to each other rather than to a cold
    // baseline. A per-cycle leak necessarily differs between them, while the
    // host framework's one-time listener registrations cancel out — so this
    // measures Scout UI's cleanup, not Next.js's.
    await toggle.click();
    await expect(page.getByTestId("lifecycle-mounted")).toHaveCount(0);
    const first = await runCycles(8);
    const second = await runCycles(8);

    expect(
      trailListenerTotal(second),
      `engine listener leak: ${JSON.stringify(second.listenersByType)}`,
    ).toBe(trailListenerTotal(first));
    expect(second.resizeObservers, "ResizeObserver leak").toBe(
      first.resizeObservers,
    );
    expect(second.intersectionObservers, "IntersectionObserver leak").toBe(
      first.intersectionObservers,
    );
    expect(second.frames, "animation frame leak").toBe(first.frames);

    // Trail-owned DOM is the one resource that can be attributed unambiguously:
    // with the trail unmounted, not a single pool node may survive.
    expect(await page.locator("[data-sui-trail-slot]").count()).toBe(0);
  });

  test("repeated remount of a mounted trail is also clean", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await installResourceTracker(page);
    await page.goto("/test-surfaces/trail-lifecycle");
    await expect(page.getByTestId("lifecycle-mounted")).toBeVisible();
    await page.waitForTimeout(200);

    const baseline = await readResourceCounts(page);
    const remount = page.getByTestId("lifecycle-remount");

    for (let cycle = 0; cycle < 8; cycle += 1) {
      await remount.click();
      await expect(page.getByTestId("lifecycle-cycle")).toHaveText(
        String(cycle + 1),
      );
    }

    await page.waitForTimeout(400);
    const after = await readResourceCounts(page);

    expect(trailListenerTotal(after)).toBe(trailListenerTotal(baseline));
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(after.intersectionObservers).toBe(baseline.intersectionObservers);
    // The pool is still exactly one wrapper pool plus one hook pool.
    expect(await page.locator("[data-sui-trail-slot]").count()).toBe(12);
  });
});

test.describe("React Strict Mode", () => {
  test("survives the development-build setup/cleanup replay", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
    expect(viteURL).toBeTruthy();

    await installResourceTracker(page);
    await page.goto(`${viteURL ?? "about:blank"}/strict/strict-mode.html`);
    await expect(page.getByTestId("strict-mounted")).toBeVisible();

    // The test refuses to pass vacuously: it first proves Strict Mode really is
    // double-invoking effects in this build.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { __scoutUiStrictEffectRuns?: number })
              .__scoutUiStrictEffectRuns ?? 0,
        ),
      )
      .toBe(2);

    await expect(page.getByTestId("strict-trail")).toBeVisible();
    expect(
      await page
        .getByTestId("strict-trail")
        .locator("[data-sui-trail-slot]")
        .count(),
      "the double setup must not produce a duplicated pool",
    ).toBe(6);
    expect(
      await page
        .getByTestId("strict-hook-trail")
        .locator("[data-sui-trail-slot]")
        .count(),
      "the hook must not append a second pool on the replayed setup",
    ).toBe(6);

    const toggle = page.getByTestId("strict-toggle");

    async function runCycles(count: number) {
      for (let cycle = 0; cycle < count; cycle += 1) {
        await toggle.click();
        await expect(page.getByTestId("strict-mounted")).toBeVisible();
        const box = await visibleBox(page, "strict-trail");
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.mouse.move(box.x + box.width - 10, box.y + 40);
        await toggle.click();
        await expect(page.getByTestId("strict-mounted")).toHaveCount(0);
      }

      await page.waitForTimeout(400);
      return await readResourceCounts(page);
    }

    // Two equal phases, compared to each other: any per-cycle leak in the
    // doubled setup/cleanup replay shows up as a difference.
    await toggle.click();
    await expect(page.getByTestId("strict-mounted")).toHaveCount(0);
    const first = await runCycles(6);
    const second = await runCycles(6);

    expect(
      trailListenerTotal(second),
      `engine listener leak under Strict Mode: ${JSON.stringify(second.listenersByType)}`,
    ).toBe(trailListenerTotal(first));
    expect(second.resizeObservers).toBe(first.resizeObservers);
    expect(second.intersectionObservers).toBe(first.intersectionObservers);
    expect(second.frames).toBe(first.frames);
    expect(await page.locator("[data-sui-trail-slot]").count()).toBe(0);
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

    await page.goto("/test-surfaces/trail");
    const box = await visibleBox(page, "official-trail");

    await page.waitForTimeout(500);
    const baseline = await readResourceCounts(page);
    const poolSize = await slots(page, "official-trail").count();

    const durationMs = 30_000;
    const started = Date.now();
    let peakActive = 0;
    let moves = 0;

    // A varied path: slow arcs, fast flicks, and direction reversals.
    while (Date.now() - started < durationMs) {
      const phase = ((Date.now() - started) / durationMs) * Math.PI * 8;
      const x = box.x + box.width / 2 + Math.cos(phase) * (box.width * 0.4);
      const y =
        box.y + box.height / 2 + Math.sin(phase * 1.7) * (box.height * 0.35);
      await page.mouse.move(x, y);
      moves += 1;

      if (moves % 25 === 0) {
        peakActive = Math.max(
          peakActive,
          await activeSlots(page, "official-trail").count(),
        );
      }
    }

    peakActive = Math.max(
      peakActive,
      await activeSlots(page, "official-trail").count(),
    );

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

    // Let every slot expire and confirm the pool returns to idle.
    await page.waitForTimeout(2000);
    const idleActive = await activeSlots(page, "official-trail").count();
    const after = await readResourceCounts(page);

    const report = {
      browser: browserName,
      browserVersion: page.context().browser()?.version() ?? "unknown",
      configuredMaxActive: poolSize,
      durationMs,
      frameSamples: frames.length,
      frameTimeMedianMs: Number(percentile(0.5).toFixed(2)),
      frameTimeP95Ms: Number(percentile(0.95).toFixed(2)),
      idleActiveAfterExpiry: idleActive,
      longTaskCount: perf.longTasks.length,
      longTaskMaxMs: Number(Math.max(0, ...perf.longTasks).toFixed(2)),
      nodeVersion: process.version,
      peakActiveNodes: peakActive,
      platform: process.platform,
      pointerMoves: moves,
      poolSizeAfter: await slots(page, "official-trail").count(),
      preset: "scout (default)",
      resourcesAfter: after,
      resourcesBefore: baseline,
    };

    await testInfo.attach("trail-performance.json", {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: "application/json",
    });
    // Surfaced in the run log so the recorded baseline is readable.
    console.log(`TRAIL_PERFORMANCE ${JSON.stringify(report)}`);

    // Regression properties: bounded work and stable resources. No universal
    // frame-rate claim is made.
    expect(
      peakActive,
      "active nodes exceeded the configured pool",
    ).toBeLessThanOrEqual(poolSize);
    expect(report.poolSizeAfter, "pool size drifted").toBe(poolSize);
    expect(idleActive, "nodes did not return to idle").toBe(0);
    expect(trailListenerTotal(after), "listener growth").toBe(
      trailListenerTotal(baseline),
    );
    expect(after.resizeObservers).toBe(baseline.resizeObservers);
    expect(after.intersectionObservers).toBe(baseline.intersectionObservers);
    expect(after.frames, "animation frames accumulated").toBeLessThanOrEqual(
      baseline.frames + 1,
    );
    expect(frames.length, "no frames were sampled").toBeGreaterThan(100);
    expect(
      report.frameTimeP95Ms,
      "95th percentile frame time regressed",
    ).toBeLessThan(100);
  });
});
