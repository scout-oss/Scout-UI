import { expect, type Locator, type Page } from "@playwright/test";

export const PEEL_PATH = "/test-surfaces/peel";

export function peel(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

export function peelToggle(page: Page, testId: string): Locator {
  return peel(page, testId).getByTestId("peel-toggle");
}

export async function peelProgress(
  page: Page,
  testId: string,
): Promise<number> {
  return await peel(page, testId).evaluate((element) =>
    Number.parseFloat(
      getComputedStyle(element).getPropertyValue("--sui-peel-progress"),
    ),
  );
}

export async function dragPeel(
  page: Page,
  testId: string,
  fraction = 0.72,
  release = true,
): Promise<void> {
  const root = peel(page, testId);
  const toggle = peelToggle(page, testId);
  await toggle.scrollIntoViewIfNeeded();
  const rootBox = await root.boundingBox();
  const toggleBox = await toggle.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  if (rootBox === null || toggleBox === null) return;

  const origin = await root.getAttribute("data-origin");
  const direction = {
    "bottom-left": { x: 1, y: -1 },
    "bottom-right": { x: -1, y: -1 },
    "top-left": { x: 1, y: 1 },
    "top-right": { x: -1, y: 1 },
  }[origin ?? "top-right"] ?? { x: -1, y: 1 };
  const start = {
    x: toggleBox.x + toggleBox.width / 2,
    y: toggleBox.y + toggleBox.height / 2,
  };
  const distance = Math.hypot(rootBox.width, rootBox.height) * 0.62 * fraction;
  const axis = distance / Math.SQRT2;
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  // Establish directional intent while the pointer is still inside the 44px
  // grip. Once the component captures it, the remaining path may cross the
  // full surface even when the fixture is unusually wide.
  await page.mouse.move(start.x + direction.x * 8, start.y + direction.y * 8);
  await page.mouse.move(
    start.x + direction.x * axis,
    start.y + direction.y * axis,
    { steps: 11 },
  );
  await page.waitForTimeout(40);
  if (release) await page.mouse.up();
}
