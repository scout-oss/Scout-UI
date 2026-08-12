import { expect, type Locator, type Page } from "@playwright/test";

import { advanceAnimationFrame } from "./deterministic-motion.ts";

export const SLOT_SELECTOR = "[data-sui-trail-slot]";
export const ACTIVE_SLOT_SELECTOR = '[data-sui-trail-slot][data-active="true"]';

export function trail(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

export function slots(page: Page, testId: string): Locator {
  return trail(page, testId).locator(SLOT_SELECTOR);
}

export function activeSlots(page: Page, testId: string): Locator {
  return trail(page, testId).locator(ACTIVE_SLOT_SELECTOR);
}

/**
 * Scroll the container into view before measuring it. `mouse.move` uses
 * viewport coordinates, so a box below the fold would place every synthetic
 * pointer event outside the window.
 */
export async function visibleBox(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const locator = trail(page, testId);
  await locator.scrollIntoViewIfNeeded();
  // Let the engine's scroll-driven geometry invalidation settle.
  await page.waitForTimeout(80);

  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error(`Trail container "${testId}" has no layout box`);
  }

  return box;
}

/**
 * The engine stamps `data-mode` during setup, so this also waits for hydration
 * rather than racing it.
 */
export async function layerMode(page: Page, testId: string): Promise<string> {
  const layer = trail(page, testId).locator(".sui-trail-layer").first();
  await expect(layer).toHaveAttribute("data-mode", /.+/u);
  return await layer.evaluate(
    (element) => element.getAttribute("data-mode") ?? "",
  );
}

/** Local coordinates the engine wrote onto each active slot. */
export async function activePositions(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number }[]> {
  return await activeSlots(page, testId).evaluateAll((elements) =>
    elements.map((element) => {
      const style = element.style;
      return {
        x: Number.parseFloat(style.getPropertyValue("--sui-trail-internal-x")),
        y: Number.parseFloat(style.getPropertyValue("--sui-trail-internal-y")),
      };
    }),
  );
}

/**
 * The origin the engine should be resolving against, computed independently
 * from the engine's own maths.
 */
export async function expectedOrigin(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number }> {
  return await trail(page, testId).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + element.clientLeft - element.scrollLeft,
      y: rect.top + element.clientTop - element.scrollTop,
    };
  });
}

/**
 * Move the pointer and advance the deterministic clock in lockstep, so a
 * screenshot can never capture an empty trail because no frame ever ran.
 */
export async function driveDeterministicPath(
  page: Page,
  points: readonly { x: number; y: number }[],
  stepMs = 16,
): Promise<void> {
  for (const point of points) {
    await page.mouse.move(point.x, point.y);
    await advanceAnimationFrame(page, stepMs);
  }
}

export function horizontalSweep(
  box: { x: number; y: number; width: number; height: number },
  steps: number,
): { x: number; y: number }[] {
  const startX = box.x + box.width * 0.1;
  const endX = box.x + box.width * 0.9;
  const y = box.y + box.height * 0.5;

  return Array.from({ length: steps + 1 }, (_, index) => ({
    x: startX + ((endX - startX) * index) / steps,
    y,
  }));
}

/**
 * Stabilise a trail screenshot without emulating reduced motion — that would
 * suppress the trail itself and capture an empty canvas.
 */
export async function prepareTrailScreenshot(page: Page): Promise<void> {
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
}

/**
 * Every visible slot must have decoded artwork before a screenshot is taken.
 * Call this after driving the trail; with the deterministic clock frozen the
 * visual state cannot drift while the images settle.
 */
export async function expectSlotArtworkLoaded(
  page: Page,
  testId: string,
): Promise<void> {
  await expect
    .poll(() =>
      trail(page, testId)
        .locator(ACTIVE_SLOT_SELECTOR)
        .evaluateAll((elements) =>
          elements.every(
            (element) =>
              element instanceof HTMLImageElement &&
              element.complete &&
              element.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
}
