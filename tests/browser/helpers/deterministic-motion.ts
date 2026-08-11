import type { Page } from "@playwright/test";

import { createLinearPointerPath } from "../../../tooling/test/stable-pointer-path.ts";

export async function installDeterministicAnimationClock(
  page: Page,
): Promise<void> {
  await page.addInitScript(() => {
    let currentTime = 0;
    let nextHandle = 1;
    const callbacks = new Map<number, FrameRequestCallback>();

    Object.defineProperty(window, "__scoutUiAdvanceFrame", {
      configurable: false,
      value(milliseconds = 16) {
        currentTime += milliseconds;
        const queued = [...callbacks.entries()];
        callbacks.clear();
        for (const [, callback] of queued) callback(currentTime);
      },
    });

    window.requestAnimationFrame = (callback) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    };
    window.cancelAnimationFrame = (handle) => callbacks.delete(handle);
  });
}

export async function advanceAnimationFrame(
  page: Page,
  milliseconds = 16,
): Promise<void> {
  await page.evaluate((duration) => {
    const target = window as typeof window & {
      __scoutUiAdvanceFrame?: (value: number) => void;
    };
    target.__scoutUiAdvanceFrame?.(duration);
  }, milliseconds);
}

export async function followStablePointerPath(page: Page): Promise<void> {
  const points = createLinearPointerPath(
    { x: 120, y: 120 },
    { x: 420, y: 280 },
    6,
  );

  for (const point of points) {
    await page.mouse.move(point.x, point.y);
  }
}
