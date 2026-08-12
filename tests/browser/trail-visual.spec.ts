import { expect, test } from "@playwright/test";

import { installDeterministicAnimationClock } from "./helpers/deterministic-motion.ts";
import {
  activeSlots,
  driveDeterministicPath,
  expectSlotArtworkLoaded,
  horizontalSweep,
  prepareTrailScreenshot,
  slots,
  visibleBox,
} from "./helpers/trail.ts";

const presets = ["calm", "scout", "dense", "floaty", "chaos"] as const;

/**
 * A deterministic comparison of every preset: one seed, one viewport, one
 * pointer path, one frame budget. The only variable is the preset.
 */
test("preset comparison artifact", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  await installDeterministicAnimationClock(page);
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/test-surfaces/trail-presets");

  await expect(page.getByTestId("trail-preset-grid")).toBeVisible();
  // Wait for hydration to place every pool before driving any frames.
  for (const preset of presets) {
    await expect(slots(page, `preset-trail-${preset}`)).not.toHaveCount(0);
  }

  await prepareTrailScreenshot(page);

  // The deterministic clock is global, so a panel driven earlier keeps ageing
  // while later panels are driven and would be past its lifetime by the time a
  // single combined screenshot were taken. Each panel is therefore driven and
  // captured at the same local phase — identical seed, path, step count, and
  // node age — which is what makes the set comparable.
  const counts: Record<string, number> = {};

  for (const preset of presets) {
    const box = await visibleBox(page, `preset-trail-${preset}`);
    await driveDeterministicPath(page, horizontalSweep(box, 24), 16);

    const count = await activeSlots(page, `preset-trail-${preset}`).count();
    counts[preset] = count;
    // A screenshot of an empty canvas would be a silent failure.
    expect(count, `${preset} produced no trail nodes`).toBeGreaterThan(0);

    await expectSlotArtworkLoaded(page, `preset-trail-${preset}`);
    await expect(page.getByTestId(`preset-trail-${preset}`)).toHaveScreenshot(
      `trail-preset-${preset}.png`,
    );
  }

  // The presets must be visibly different, not five copies of one default.
  expect(counts.dense).toBeGreaterThan(counts.calm ?? 0);
  expect(counts.scout ?? 0).toBeGreaterThan(counts.calm ?? 0);
  expect(counts.chaos ?? 0).toBeGreaterThan(counts.calm ?? 0);

  await testInfo.attach("preset-node-counts.json", {
    body: Buffer.from(JSON.stringify(counts, null, 2)),
    contentType: "application/json",
  });
  console.log(`TRAIL_PRESET_COUNTS ${JSON.stringify(counts)}`);
});

test("interaction review surface", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");

  await installDeterministicAnimationClock(page);
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/test-surfaces/trail");

  await prepareTrailScreenshot(page);
  const box = await visibleBox(page, "wrapper-trail");

  await driveDeterministicPath(page, horizontalSweep(box, 16), 16);
  expect(await activeSlots(page, "wrapper-trail").count()).toBeGreaterThan(0);

  await expectSlotArtworkLoaded(page, "wrapper-trail");
  await expect(page.getByTestId("wrapper-trail")).toHaveScreenshot(
    "trail-interaction.png",
  );
});
