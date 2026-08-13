import { expect, type Locator, type Page } from "@playwright/test";

export const NAVBAR_PATH = "/test-surfaces/navbar";
export const NAVBAR_COLLAGE_PATH = `${NAVBAR_PATH}/collage`;
export const NAVBAR_CUSTOM_PATH = `${NAVBAR_PATH}/custom`;
export const NAVBAR_CUSTOM_RIBBON_PATH = `${NAVBAR_PATH}/custom-ribbon`;
export const NAVBAR_INVALID_PATH = `${NAVBAR_PATH}/invalid`;
export const NAVBAR_INACTIVE_PATH = `${NAVBAR_PATH}/inactive`;
export const NAVBAR_LONG_PATH = `${NAVBAR_PATH}/long`;
export const NAVBAR_NIGHT_PATH = `${NAVBAR_PATH}/night`;
export const NAVBAR_REDUCED_PATH = `${NAVBAR_PATH}/reduced`;
export const NAVBAR_SHORT_PATH = `${NAVBAR_PATH}/short`;
export const NAVBAR_STATIC_PATH = `${NAVBAR_PATH}/static`;

export function navbar(page: Page): Locator {
  return page.getByTestId("navbar-primary");
}

export function desktopNavbarNav(page: Page): Locator {
  return navbar(page).locator('[data-navbar-nav="desktop"]');
}

export function navbarItem(
  page: Page,
  id: string,
  scope: "desktop" | "mobile" = "desktop",
): Locator {
  const root =
    scope === "desktop"
      ? desktopNavbarNav(page)
      : page.locator('[data-navbar-nav="mobile"]');
  return root.locator(`[data-navbar-item="${id}"]`);
}

export function navbarMenuTrigger(page: Page): Locator {
  return navbar(page).locator('[data-navbar-menu-trigger="true"]');
}

export function navbarDialog(page: Page): Locator {
  return page.locator('[data-navbar-content="true"]');
}

export function navbarOverlay(page: Page): Locator {
  return page.locator('[data-navbar-overlay="true"]');
}

export function navbarClose(page: Page): Locator {
  return navbarDialog(page).locator('[data-navbar-close="true"]');
}

export function navbarProgress(page: Page): Locator {
  return navbar(page).locator('[data-navbar-progress="true"]');
}

export async function openNavbarMenu(page: Page): Promise<Locator> {
  const trigger = navbarMenuTrigger(page);
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = navbarDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function readNavbarProgress(page: Page): Promise<number> {
  return await navbarProgress(page).evaluate((element: HTMLElement) => {
    const declared = element.style.transform;
    const match = /scaleX\(([-+\d.eE]+)\)/u.exec(declared);
    if (match?.[1] !== undefined) return Number.parseFloat(match[1]);

    const computed = getComputedStyle(element).transform;
    if (computed === "none") return 0;
    const matrix = new DOMMatrixReadOnly(computed);
    return matrix.a;
  });
}

export async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

export async function expectTargetClearsNavbar(page: Page, target: Locator) {
  await expect(target).toBeInViewport();
  const [headerBox, targetBox] = await Promise.all([
    navbar(page).boundingBox(),
    target.boundingBox(),
  ]);
  expect(headerBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (headerBox === null || targetBox === null) return;
  expect(targetBox.y).toBeGreaterThanOrEqual(headerBox.height - 2);
}
