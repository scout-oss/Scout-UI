import { expect, type Locator, type Page } from "@playwright/test";

export const CURSOR_PATH = "/test-surfaces/cursor";
export const CURSOR_HOTSPOT_PATH = "/test-surfaces/cursor-hotspot";

export function cursor(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

export function layer(page: Page, testId: string): Locator {
  return cursor(page, testId).locator(".sui-sticker-cursor-layer").first();
}

export function visual(page: Page, testId: string): Locator {
  return cursor(page, testId).locator(".sui-sticker-cursor-visual").first();
}

/**
 * The engine stamps `data-mode` during setup, so reading it also waits for
 * hydration rather than racing it.
 */
export async function cursorMode(page: Page, testId: string): Promise<string> {
  const element = layer(page, testId);
  await expect(element).toHaveAttribute("data-mode", /.+/u);
  return await element.evaluate((node) => node.getAttribute("data-mode") ?? "");
}

export interface CursorSnapshot {
  mode: string;
  visible: boolean;
  bypass: string | null;
  state: string | null;
  pressed: boolean;
  /** True while the region has `cursor: none` in effect. */
  nativeHidden: boolean;
  src: string | null;
  hotspotX: string;
  hotspotY: string;
}

export async function readCursor(
  page: Page,
  testId: string,
): Promise<CursorSnapshot> {
  return await cursor(page, testId).evaluate((container) => {
    const layerElement = container.querySelector(".sui-sticker-cursor-layer");
    const visualElement = container.querySelector<HTMLElement>(
      ".sui-sticker-cursor-visual",
    );

    return {
      bypass: layerElement?.getAttribute("data-bypass") ?? null,
      hotspotX:
        visualElement?.style.getPropertyValue(
          "--sui-sticker-cursor-internal-hotspot-x",
        ) ?? "",
      hotspotY:
        visualElement?.style.getPropertyValue(
          "--sui-sticker-cursor-internal-hotspot-y",
        ) ?? "",
      mode: layerElement?.getAttribute("data-mode") ?? "",
      // `cursor: none` is the observable consequence, so read the computed
      // value rather than trusting the attribute alone.
      nativeHidden: getComputedStyle(container).cursor === "none",
      pressed: layerElement?.getAttribute("data-pressed") === "true",
      src: visualElement?.getAttribute("src") ?? null,
      state: layerElement?.getAttribute("data-state") ?? null,
      visible: layerElement?.getAttribute("data-visible") === "true",
    };
  });
}

/** Local coordinates the engine wrote onto the cursor visual. */
export async function cursorPosition(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number }> {
  return await visual(page, testId).evaluate((element) => ({
    x: Number.parseFloat(
      element.style.getPropertyValue("--sui-sticker-cursor-internal-x"),
    ),
    y: Number.parseFloat(
      element.style.getPropertyValue("--sui-sticker-cursor-internal-y"),
    ),
  }));
}

/**
 * The container origin, computed independently of the engine's own maths, so a
 * coordinate assertion is a real cross-check rather than a tautology.
 */
export async function cursorOrigin(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number }> {
  return await cursor(page, testId).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + element.clientLeft - element.scrollLeft,
      y: rect.top + element.clientTop - element.scrollTop,
    };
  });
}

export async function visibleBox(
  page: Page,
  testId: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const locator = cursor(page, testId);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);

  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error(`Cursor container "${testId}" has no layout box`);
  }

  return box;
}

/** Move over an element and let the engine resolve and settle. */
export async function hoverTarget(page: Page, testId: string): Promise<void> {
  const target = page.getByTestId(testId);
  await target.scrollIntoViewIfNeeded();
  await target.hover();
  await page.waitForTimeout(120);
}
