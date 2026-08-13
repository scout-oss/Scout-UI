import { expect, type Locator, type Page } from "@playwright/test";

export const STACK_PATH = "/test-surfaces/stack";

export function stack(page: Page, testId: string): Locator {
  return page.getByTestId(testId);
}

export function activeStackCard(page: Page, testId: string): Locator {
  return stack(page, testId).locator(
    '[data-stack-card="true"][data-active="true"]',
  );
}

export async function stackDragProgress(page: Page, testId: string) {
  return Number.parseFloat(
    (await stack(page, testId).getAttribute("data-stack-drag-progress")) ?? "0",
  );
}

export async function dragStack(
  page: Page,
  testId: string,
  options: {
    direction?: "next" | "previous";
    fraction?: number;
    perpendicular?: boolean;
    release?: boolean;
  } = {},
) {
  const {
    direction = "next",
    fraction = 0.48,
    perpendicular = false,
    release = true,
  } = options;
  const root = stack(page, testId);
  const card = activeStackCard(page, testId);
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) return;
  const axis = await root.getAttribute("data-axis");
  const start = {
    x: box.x + box.width * 0.62,
    y: box.y + box.height * 0.46,
  };
  const primary = (axis === "x" ? box.width : box.height) * fraction;
  const sign = direction === "next" ? -1 : 1;
  const delta = perpendicular
    ? axis === "x"
      ? { x: 4, y: primary * sign }
      : { x: primary * sign, y: 4 }
    : axis === "x"
      ? { x: primary * sign, y: 3 }
      : { x: 3, y: primary * sign };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + delta.x * 0.12, start.y + delta.y * 0.12);
  await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 12 });
  if (!release && !perpendicular) {
    await expect
      .poll(async () => await stackDragProgress(page, testId))
      .toBeGreaterThan(0);
  }
  if (release) await page.mouse.up();
}
