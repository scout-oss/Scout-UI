import { expect, test, type Page } from "@playwright/test";

function desktopOnly(projectName: string) {
  test.skip(projectName !== "chromium-desktop");
}

async function prepare(page: Page, preserveTransientState = false) {
  await page.addStyleTag({
    content: `
      body > .sui-sticker-navbar,
      .sui-docs-skip-link { display: none !important; }
      .sui-docs-prompt-line[data-visual-emphasis="true"] {
        color: var(--sui-ink) !important;
        border-inline-start-color: var(--sui-ultraviolet) !important;
        background: var(--sui-acid) !important;
        outline: 1px dashed var(--sui-paper-raised) !important;
        animation: none !important;
      }
    `,
  });
  if (preserveTransientState) {
    await page
      .locator('.sui-docs-prompt-line[data-emphasized="true"]')
      .evaluateAll((lines) => {
        for (const line of lines)
          line.setAttribute("data-visual-emphasis", "true");
      });
  } else {
    await page.waitForTimeout(950);
  }
  await page.evaluate(async () => document.fonts.ready);
}

async function openPrompt(page: Page, path: string) {
  await page.goto(path);
  const trigger = page.getByRole("button", { name: "Copy AI Prompt" });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function promptShot(
  page: Page,
  name: string,
  preserveTransientState = false,
) {
  await prepare(page, preserveTransientState);
  await expect(page.getByRole("dialog")).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
  });
}

test.describe("M15 Copy AI Prompt visuals", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    desktopOnly(testInfo.project.name);
  });

  test("01 trigger beside Copy Code", async ({ page }) => {
    await page.goto("/playground/sticker");
    const output = page.locator(".sui-docs-code-output");
    await output.scrollIntoViewIfNeeded();
    await prepare(page);
    await expect(output.locator(":scope > header")).toHaveScreenshot(
      "copy-ai-prompt-01-trigger.png",
      { animations: "disabled", caret: "hide" },
    );
  });

  test("02 Sticker detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker");
    await promptShot(page, "copy-ai-prompt-02-sticker-detailed.png");
  });

  test("03 Badge detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-badge");
    await promptShot(page, "copy-ai-prompt-03-badge.png");
  });

  test("04 Button detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-button");
    await promptShot(page, "copy-ai-prompt-04-button.png");
  });

  test("05 Trail detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-trail");
    await promptShot(page, "copy-ai-prompt-05-trail.png");
  });

  test("06 Cursor detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-cursor");
    await promptShot(page, "copy-ai-prompt-06-cursor.png");
  });

  test("07 Peel detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-peel");
    await promptShot(page, "copy-ai-prompt-07-peel.png");
  });

  test("08 Stack detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-stack");
    await promptShot(page, "copy-ai-prompt-08-stack.png");
  });

  test("09 Navbar detailed", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-navbar");
    await promptShot(page, "copy-ai-prompt-09-navbar.png");
  });

  test("10 concise mode", async ({ page }) => {
    const dialog = await openPrompt(page, "/playground/sticker-trail");
    await dialog.getByRole("radio", { name: "Concise" }).check();
    await promptShot(page, "copy-ai-prompt-10-concise.png");
  });

  test("11 detailed mode", async ({ page }) => {
    await openPrompt(page, "/playground/sticker-trail");
    await promptShot(page, "copy-ai-prompt-11-detailed.png");
  });

  test("12 custom configuration summary", async ({ page }) => {
    await page.goto("/playground/sticker");
    await page.getByRole("button", { name: "Loud", exact: true }).click();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await promptShot(page, "copy-ai-prompt-12-custom-summary.png");
  });

  test("13 location and project context", async ({ page }) => {
    const dialog = await openPrompt(page, "/playground/sticker-button");
    await dialog.getByLabel("Target framework").selectOption("next-app-router");
    await dialog.getByLabel("Target location").fill("Hero section");
    await dialog
      .getByLabel(/Project context/)
      .fill("Keep the existing CTA and typography unchanged.");
    await promptShot(page, "copy-ai-prompt-13-location-context.png");
  });

  test("14 preserve layout selected", async ({ page }) => {
    const dialog = await openPrompt(page, "/playground/sticker-peel");
    await expect(dialog.getByLabel("Preserve existing layout")).toBeChecked();
    await dialog
      .getByLabel("Preserve existing layout")
      .scrollIntoViewIfNeeded();
    await promptShot(page, "copy-ai-prompt-14-preserve-layout.png");
  });

  test("15 bundled asset strategy", async ({ page }) => {
    const dialog = await openPrompt(page, "/playground/sticker-cursor");
    await dialog.getByLabel("Asset strategy").selectOption("bundled");
    await dialog.getByLabel("Asset strategy").scrollIntoViewIfNeeded();
    await promptShot(page, "copy-ai-prompt-15-bundled-assets.png");
  });

  test("16 unknown framework", async ({ page }) => {
    const dialog = await openPrompt(page, "/playground/sticker-navbar");
    await dialog.getByLabel("Target framework").selectOption("unknown");
    await dialog.getByLabel("Target framework").scrollIntoViewIfNeeded();
    await promptShot(page, "copy-ai-prompt-16-unknown-framework.png");
  });

  test("17 changed fragment emphasis", async ({ page }) => {
    await page.goto("/playground/sticker");
    await page.getByRole("slider", { name: "Rotation" }).fill("8");
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect(
      page.locator('.sui-docs-prompt-line[data-emphasized="true"]'),
    ).toBeVisible();
    await page
      .locator('.sui-docs-prompt-line[data-emphasized="true"]')
      .scrollIntoViewIfNeeded();
    await promptShot(page, "copy-ai-prompt-17-changed-emphasis.png", true);
  });

  test("18 copied success", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await openPrompt(page, "/playground/sticker");
    await page.getByRole("button", { name: "Copy Prompt" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await promptShot(page, "copy-ai-prompt-18-copied.png");
  });

  test("19 clipboard fallback", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await openPrompt(page, "/playground/sticker-badge");
    await page.getByRole("button", { name: "Copy Prompt" }).click();
    await expect(
      page.getByLabel(
        "Clipboard unavailable. Copy the selected prompt manually.",
      ),
    ).toBeFocused();
    await promptShot(page, "copy-ai-prompt-19-clipboard-fallback.png");
  });

  test("20 component page", async ({ page }) => {
    await openPrompt(page, "/components/sticker-stack");
    await promptShot(page, "copy-ai-prompt-20-component-page.png");
  });

  test("21 mobile 390", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await openPrompt(page, "/playground/sticker-navbar");
    await promptShot(page, "copy-ai-prompt-21-mobile-390.png");
  });

  test("22 mobile 320", async ({ page }) => {
    await page.setViewportSize({ height: 720, width: 320 });
    await openPrompt(page, "/playground/sticker-stack");
    await promptShot(page, "copy-ai-prompt-22-mobile-320.png");
  });

  test("23 reduced effects", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/playground/sticker");
    await page.getByRole("slider", { name: "Rotation" }).fill("8");
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await page
      .locator('.sui-docs-prompt-line[data-emphasized="true"]')
      .scrollIntoViewIfNeeded();
    await promptShot(page, "copy-ai-prompt-23-reduced-effects.png", true);
  });

  test("24 forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await openPrompt(page, "/playground/sticker-button");
    await promptShot(page, "copy-ai-prompt-24-forced-colors.png");
  });

  test("25 200 percent reflow", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 640 });
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await openPrompt(page, "/playground/sticker-peel");
    await promptShot(page, "copy-ai-prompt-25-200-percent-reflow.png");
  });

  test("26 preview error isolation", async ({ page }) => {
    await openPrompt(page, "/test-surfaces/preview-error");
    await promptShot(page, "copy-ai-prompt-26-preview-error.png");
  });
});
