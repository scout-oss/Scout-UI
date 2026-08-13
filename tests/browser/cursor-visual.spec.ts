import { expect, test, type Page } from "@playwright/test";

import {
  CURSOR_HOTSPOT_PATH,
  CURSOR_PATH,
  cursor,
  hoverTarget,
  readCursor,
  visibleBox,
} from "./helpers/cursor.ts";

/**
 * Deterministic review baselines for StickerCursor.
 *
 * Determinism comes from four things: fixed viewport, fixed pointer
 * coordinates, a settled engine (position and tilt both converge, and the loop
 * stops), and frozen animations. Reduced motion is deliberately not emulated —
 * it would suppress the cursor entirely and capture an empty canvas.
 */

/**
 * Freeze presentation without suppressing the cursor. CSS transitions are
 * zeroed so the press state is captured at its end state rather than mid-curve,
 * and any running Web Animation — the echo — is pinned to a fixed time.
 */
async function freeze(page: Page, animationTimeMs = 0) {
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
  await page.evaluate(async () => document.fonts.ready);
  await page.evaluate((time) => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
  }, animationTimeMs);
}

/** Wait until the engine reports the artwork decoded and displayed. */
async function settled(page: Page, testId: string) {
  await expect
    .poll(async () => (await readCursor(page, testId)).visible)
    .toBe(true);
  // The settle threshold is sub-pixel, so a short pause is enough for both
  // position and tilt to converge and for the loop to stop scheduling.
  await page.waitForTimeout(400);
}

test.describe("cursor review baselines", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
  });

  test("primary default cursor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);
    await hoverTarget(page, "bypass-text");
    await settled(page, "bypass-cursor");

    expect((await readCursor(page, "bypass-cursor")).state).toBe("default");
    await freeze(page);
    await expect(cursor(page, "bypass-cursor")).toHaveScreenshot(
      "cursor-default.png",
    );
  });

  test("state transition to a custom visual", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);
    await hoverTarget(page, "bypass-text");
    await settled(page, "bypass-cursor");

    // Transition into the annotated region: different artwork, same tracked
    // point under the pointer.
    await hoverTarget(page, "bypass-custom-nested");
    await page.waitForTimeout(400);
    expect((await readCursor(page, "bypass-cursor")).state).toBe("sparkle");

    await freeze(page);
    await expect(cursor(page, "bypass-cursor")).toHaveScreenshot(
      "cursor-state-custom.png",
    );
  });

  test("press feedback", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);
    await hoverTarget(page, "bypass-text");
    await settled(page, "bypass-cursor");

    await page.mouse.down();
    await page.waitForTimeout(300);
    const pressed = await readCursor(page, "bypass-cursor");
    expect(pressed.pressed).toBe(true);
    expect(pressed.state).toBe("active");

    await freeze(page);
    await expect(cursor(page, "bypass-cursor")).toHaveScreenshot(
      "cursor-press.png",
    );
    await page.mouse.up();
  });

  test("echo feedback", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    const box = await visibleBox(page, "echo-cursor");
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await settled(page, "echo-cursor");

    // Fill the pool with no waits: an echo lives 420ms, so all four must still
    // be in flight when they are pinned. Pausing after they expired would
    // capture an empty layer and silently prove nothing.
    for (let index = 0; index < 4; index += 1) {
      await page.mouse.move(box.x + 60 + index * 70, box.y + 40);
      await page.mouse.down();
      await page.mouse.up();
    }

    await expect(
      cursor(page, "echo-cursor").locator("[data-sui-cursor-echo]"),
    ).toHaveCount(4);

    // Pin every echo mid-flight so the capture is reproducible, then assert
    // they are genuinely mid-flight rather than finished.
    await freeze(page, 120);
    const live = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "paused").length,
    );
    expect(live, "every echo had already expired before the capture").toBe(4);
    await expect(cursor(page, "echo-cursor")).toHaveScreenshot(
      "cursor-echo.png",
    );
  });

  test("hotspot alignment", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_HOTSPOT_PATH);

    await freeze(page);

    // One capture per panel. The pointer can only occupy one panel at a time,
    // so a single grid shot would show three empty boxes and one cursor — an
    // artifact that looks fine and reviews nothing. Each panel is driven to the
    // exact centre of its own crosshair, so a misplaced hotspot reads directly
    // as an offset between the artwork's anchor and the guide.
    for (const id of [
      "hotspot-centre",
      "hotspot-top-left-tip",
      "hotspot-bottom-right",
      "hotspot-quarter",
    ]) {
      const box = await visibleBox(page, id);
      await page.mouse.move(
        Math.round(box.x + box.width / 2),
        Math.round(box.y + box.height / 2),
      );
      await page.waitForTimeout(300);
      expect((await readCursor(page, id)).visible, id).toBe(true);

      await expect(cursor(page, id)).toHaveScreenshot(
        `cursor-hotspot-${id.replace("hotspot-", "")}.png`,
      );
    }
  });

  test("native and bypass review", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop");
    await page.goto(CURSOR_PATH);

    // Park the pointer on an editable field: the custom visual must be absent
    // and the native cursor restored, which is what this baseline records.
    await hoverTarget(page, "bypass-input");
    await page.waitForTimeout(300);

    const snapshot = await readCursor(page, "bypass-cursor");
    expect(snapshot.bypass).toBe("editable");
    expect(snapshot.visible).toBe(false);
    expect(snapshot.nativeHidden).toBe(false);

    await freeze(page);
    await expect(cursor(page, "bypass-cursor")).toHaveScreenshot(
      "cursor-bypass-review.png",
    );
  });
});
