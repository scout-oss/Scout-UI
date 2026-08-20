import { expect, test, type Page, type TestInfo } from "@playwright/test";

const visualExpect = expect.configure({ timeout: 20_000 });

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop");
}

async function settle(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.evaluate(() => {
    const codeOutput = document.querySelector(".sui-docs-code-output");
    if (!codeOutput) return;

    const handoff = document.createElement("div");
    handoff.className = "sui-docs-playground-handoff";
    handoff.innerHTML = `
      <div>
        <span>Next desk · M14</span>
        <strong>Generated React code</strong>
        <p>The schema is ready; final code generation is intentionally not active yet.</p>
      </div>
      <div>
        <span>Next desk · M15</span>
        <strong>AI implementation prompt</strong>
        <p>Prompt metadata is present; final prompt generation remains intentionally deferred.</p>
      </div>
    `;
    codeOutput.replaceWith(handoff);
  });
  await page.waitForTimeout(280);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      .sui-sticker-navbar {
        --sui-navbar-internal-progress: 0 !important;
        position: relative !important;
        inset-block-start: auto !important;
      }
      .sui-sticker-navbar-progress {
        transform: scaleX(0) !important;
      }
      /* Reconstruct the frozen M13 handoff cards replaced by M14's Code desk. */
      .sui-docs-playground-handoff {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: var(--sui-space-5) !important;
        margin-block-start: var(--sui-space-8) !important;
      }
      .sui-docs-playground-handoff > div {
        display: grid !important;
        gap: var(--sui-space-2) !important;
        padding: var(--sui-space-5) !important;
        border: 2px dashed var(--sui-ink) !important;
        background: var(--sui-paper-muted) !important;
      }
      .sui-docs-playground-handoff span {
        font-family: var(--sui-font-mono) !important;
        font-size: 0.72rem !important;
        text-transform: uppercase !important;
      }
      .sui-docs-playground-handoff p {
        margin: 0 !important;
        color: var(--sui-ink-muted) !important;
      }
      @media (max-width: 47.99rem) {
        .sui-docs-playground-handoff {
          grid-template-columns: 1fr !important;
        }
      }
    `,
  });
}

async function fullPage(page: Page, name: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await settle(page);
  await visualExpect(page).toHaveScreenshot(name, { fullPage: true });
}

async function desktop(page: Page, route: string) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
}

test.describe("Scout UI M13 playground review baselines", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript(() => {
      window.localStorage.removeItem("scout-ui-docs:reduced-effects");
    });
  });

  test("Playground index desktop", async ({ page }) => {
    await desktop(page, "/playground");
    await fullPage(page, "playground-index-desktop.png");
  });

  test("Sticker default desktop", async ({ page }) => {
    await desktop(page, "/playground/sticker");
    await fullPage(page, "playground-sticker-default.png");
  });

  test("Sticker customized desktop", async ({ page }) => {
    await desktop(page, "/playground/sticker");
    await page.getByRole("radio", { name: "XL" }).first().check();
    await page.getByRole("slider", { name: "Rotation" }).first().fill("10");
    await fullPage(page, "playground-sticker-customized.png");
  });

  for (const [slug, filename] of [
    ["sticker-badge", "playground-sticker-badge.png"],
    ["sticker-button", "playground-sticker-button.png"],
    ["sticker-trail", "playground-sticker-trail.png"],
    ["sticker-cursor", "playground-sticker-cursor.png"],
    ["sticker-peel", "playground-sticker-peel.png"],
    ["sticker-stack", "playground-sticker-stack.png"],
    ["sticker-navbar", "playground-sticker-navbar.png"],
  ] as const) {
    test(`${slug} playground`, async ({ page }) => {
      await desktop(page, `/playground/${slug}`);
      await fullPage(page, filename);
    });
  }

  test("Component page desktop control rail", async ({ page }) => {
    await desktop(page, "/components/sticker");
    await fullPage(page, "playground-component-page-control-rail.png");
  });

  test("Preset selected", async ({ page }) => {
    await desktop(page, "/playground/sticker-stack");
    await page
      .getByRole("button", { name: "Interactive", exact: true })
      .first()
      .click();
    await fullPage(page, "playground-preset-selected.png");
  });

  test("Custom dirty state", async ({ page }) => {
    await desktop(page, "/playground/sticker-button");
    await page
      .getByRole("textbox", { name: "Label" })
      .first()
      .fill("A truly custom action");
    await fullPage(page, "playground-custom-dirty.png");
  });

  test("Share copied state", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await desktop(page, "/playground/sticker-peel");
    await page
      .getByRole("button", { name: "Revealed", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Share", exact: true })
      .first()
      .click();
    await expect(
      page.locator('[data-share-status="copied"]').first(),
    ).toContainText("copied");
    await fullPage(page, "playground-share-copied.png");
  });

  test("Invalid link notice", async ({ page }) => {
    await desktop(page, "/playground/sticker?v=1&cfg=%%%");
    await fullPage(page, "playground-invalid-link.png");
  });

  test("Future version notice", async ({ page }) => {
    await desktop(page, "/playground/sticker?v=2&cfg=x");
    await fullPage(page, "playground-future-version.png");
  });

  test("Mobile playground closed", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/playground/sticker");
    await fullPage(page, "playground-mobile-closed.png");
  });

  test("Mobile Customize sheet open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/playground/sticker");
    await page
      .getByRole("button", { name: /customize/iu })
      .first()
      .click();
    await settle(page);
    await visualExpect(page).toHaveScreenshot(
      "playground-mobile-sheet-open.png",
    );
  });

  test("Mobile dependent controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/playground/sticker-button");
    await page
      .getByRole("button", { name: /customize/iu })
      .first()
      .click();
    await settle(page);
    await visualExpect(page).toHaveScreenshot(
      "playground-mobile-dependent-fields.png",
    );
  });

  test("320px control sheet", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/playground/sticker");
    await page
      .getByRole("button", { name: /customize/iu })
      .first()
      .click();
    await settle(page);
    await visualExpect(page).toHaveScreenshot(
      "playground-320-control-sheet.png",
    );
  });

  test("Reduced effects playground", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("scout-ui-docs:reduced-effects", "reduced");
    });
    await desktop(page, "/playground/sticker-trail");
    await fullPage(page, "playground-reduced-effects.png");
  });

  test("Forced colors controls", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await desktop(page, "/playground/sticker-badge");
    await fullPage(page, "playground-forced-colors.png");
  });

  test("200 percent equivalent reflow", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 500 });
    await page.goto("/playground/sticker-stack");
    await fullPage(page, "playground-200-percent-reflow.png");
  });

  test("Preview error retains controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator('[data-preview-error="true"]')).toBeVisible();
    await fullPage(page, "playground-preview-error.png");
  });
});
