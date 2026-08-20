import { expect, test, type Page } from "@playwright/test";

function desktopOnly(projectName: string) {
  test.skip(projectName !== "chromium-desktop");
}

async function openCode(page: Page, path: string) {
  await page.goto(path);
  const output = page.locator(".sui-docs-code-output");
  await expect(output).toBeVisible();
  await output.scrollIntoViewIfNeeded();
  await expect(output).toHaveAttribute("data-code-highlight", "settled");
  await page.evaluate(() => document.fonts.ready);
  return output;
}

async function prepareVisualCapture(
  page: Page,
  preserveTransientState = false,
) {
  await page.addStyleTag({
    content: `
      body > .sui-sticker-navbar,
      .sui-docs-skip-link { display: none !important; }
      .sui-docs-code-line[data-visual-emphasis="true"] {
        border-inline-start-color: var(--sui-ultraviolet) !important;
        background: var(--sui-acid) !important;
        outline: 1px dashed var(--sui-ink) !important;
        animation: none !important;
      }
    `,
  });
  if (preserveTransientState) {
    await page
      .locator('.sui-docs-code-line[data-emphasized="true"]')
      .evaluateAll((lines) => {
        for (const line of lines)
          line.setAttribute("data-visual-emphasis", "true");
      });
  }
  if (!preserveTransientState) await page.waitForTimeout(950);
}

async function expectCodeShot(
  page: Page,
  name: string,
  preserveTransientState = false,
) {
  await prepareVisualCapture(page, preserveTransientState);
  await expect(page.locator(".sui-docs-code-output")).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
  });
}

test.describe("M14 deterministic Copy Code visuals", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    desktopOnly(testInfo.project.name);
  });

  test("01 Sticker default", async ({ page }) => {
    await openCode(page, "/playground/sticker");
    await expectCodeShot(page, "copy-code-01-sticker-default.png");
  });

  test("02 Sticker custom", async ({ page }) => {
    await openCode(page, "/playground/sticker");
    await page.getByRole("button", { name: "Loud", exact: true }).click();
    await expectCodeShot(page, "copy-code-02-sticker-custom.png");
  });

  test("03 StickerBadge select", async ({ page }) => {
    await openCode(page, "/playground/sticker-badge");
    await page.getByRole("button", { name: "Selected", exact: true }).click();
    await expectCodeShot(page, "copy-code-03-badge-select.png");
  });

  test("04 StickerButton anchor", async ({ page }) => {
    await openCode(page, "/playground/sticker-button");
    await page
      .getByRole("button", { name: "Editorial link", exact: true })
      .click();
    await expectCodeShot(page, "copy-code-04-button-anchor.png");
  });

  test("05 StickerTrail standalone", async ({ page }) => {
    await openCode(page, "/playground/sticker-trail");
    await expectCodeShot(page, "copy-code-05-trail.png");
  });

  test("06 StickerCursor", async ({ page }) => {
    await openCode(page, "/playground/sticker-cursor");
    await expectCodeShot(page, "copy-code-06-cursor.png");
  });

  test("07 StickerPeel", async ({ page }) => {
    await openCode(page, "/playground/sticker-peel");
    await expectCodeShot(page, "copy-code-07-peel.png");
  });

  test("08 StickerStack", async ({ page }) => {
    await openCode(page, "/playground/sticker-stack");
    await expectCodeShot(page, "copy-code-08-stack.png");
  });

  test("09 StickerNavbar", async ({ page }) => {
    await openCode(page, "/playground/sticker-navbar");
    await expectCodeShot(page, "copy-code-09-navbar.png");
  });

  test("10 component-page compact mode", async ({ page }) => {
    await openCode(page, "/components/sticker");
    await expectCodeShot(page, "copy-code-10-component-page.png");
  });

  test("11 preset source", async ({ page }) => {
    await openCode(page, "/playground/sticker-peel");
    await page.getByRole("button", { name: "Revealed", exact: true }).click();
    await expectCodeShot(page, "copy-code-11-preset.png");
  });

  test("12 changed-field emphasis", async ({ page }) => {
    await openCode(page, "/playground/sticker-button");
    await page.getByRole("textbox", { name: "Label" }).fill("Launch Scout UI");
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-emphasis",
      "line",
    );
    await expectCodeShot(page, "copy-code-12-changed-emphasis.png", true);
  });

  test("13 copied success", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await openCode(page, "/playground/sticker");
    await page.getByRole("button", { name: "Copy Code" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expectCodeShot(page, "copy-code-13-copied.png");
  });

  test("14 manual clipboard fallback", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await openCode(page, "/playground/sticker-badge");
    await page.getByRole("button", { name: "Copy Code" }).click();
    await expect(
      page.getByLabel("Copy the selected code manually."),
    ).toBeFocused();
    await expectCodeShot(page, "copy-code-14-manual-fallback.png");
  });

  test("15 immediate plain source", async ({ page }) => {
    await page.addInitScript(() => {
      class NeverVisibleObserver {
        disconnect() {}
        observe() {}
        takeRecords() {
          return [];
        }
        unobserve() {}
      }
      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: NeverVisibleObserver,
      });
    });
    await page.goto("/playground/sticker");
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "plain",
    );
    await expectCodeShot(page, "copy-code-15-plain.png");
  });

  test("16 highlighted settled source", async ({ page }) => {
    await openCode(page, "/playground/sticker");
    await expectCodeShot(page, "copy-code-16-highlighted.png");
  });

  test("17 mobile 390", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await openCode(page, "/playground/sticker-navbar");
    await expectCodeShot(page, "copy-code-17-mobile-390.png");
  });

  test("18 mobile 320", async ({ page }) => {
    await page.setViewportSize({ height: 720, width: 320 });
    await openCode(page, "/playground/sticker-stack");
    await expectCodeShot(page, "copy-code-18-mobile-320.png");
  });

  test("19 reduced effects emphasis", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openCode(page, "/playground/sticker");
    await page.getByRole("slider", { name: "Rotation" }).fill("8");
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-emphasis",
      "line",
    );
    await expectCodeShot(page, "copy-code-19-reduced-effects.png", true);
  });

  test("20 forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await openCode(page, "/playground/sticker-button");
    await expectCodeShot(page, "copy-code-20-forced-colors.png");
  });

  test("21 200 percent reflow", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 640 });
    await openCode(page, "/playground/sticker-peel");
    await expectCodeShot(page, "copy-code-21-200-percent-reflow.png");
  });

  test("22 preview failure isolation", async ({ page }) => {
    await openCode(page, "/test-surfaces/preview-error");
    await expect(page.locator('[data-preview-error="true"]')).toBeVisible();
    await prepareVisualCapture(page);
    await expect(page.locator(".sui-docs-playground-session")).toHaveScreenshot(
      "copy-code-22-preview-error.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});
