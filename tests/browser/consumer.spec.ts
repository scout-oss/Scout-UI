import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  advanceAnimationFrame,
  followStablePointerPath,
  installDeterministicAnimationClock,
} from "./helpers/deterministic-motion.ts";
import { prepareStableScreenshot } from "./helpers/stable-screenshot.ts";

test("packed Next.js consumer renders and hydrates", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Next.js packed consumer" }),
  ).toBeVisible();
  await expect(page.getByTestId("server-package-values")).toContainText(
    "server-compatible",
  );
  await expect(page.getByTestId("client-entry-value")).toHaveText("0.0.0");

  const activation = page.getByRole("button", { name: "Activations: 0" });
  await activation.click();
  await expect(
    page.getByRole("button", { name: "Activations: 1" }),
  ).toBeVisible();

  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("server-compatible root and subpath render", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/server-root");
  await expect(page.getByTestId("server-root-value")).toHaveText(
    "server-compatible",
  );
  await page.goto("/server-only");
  await expect(page.getByTestId("server-only-value")).toHaveText(
    "server-compatible",
  );
  await diagnostics.expectClean(testInfo);
});

test("packed Vite consumer renders", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  const diagnostics = captureBrowserDiagnostics(page);
  const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(viteURL).toBeTruthy();
  await page.goto(viteURL ?? "about:blank");
  await expect(
    page.getByRole("heading", { name: "Vite packed consumer" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("server-compatible");
  await expect(page.getByTestId("packed-sticker-definition")).toHaveText(
    "wonky-star",
  );
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("project capability is active", async ({ page }, testInfo) => {
  await page.goto("/test-surfaces/pointer");

  const project = testInfo.project.name;
  if (project === "chromium-reduced-motion") {
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
  } else if (project === "chromium-forced-colors") {
    expect(
      await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    ).toBe(true);
  } else if (project === "chromium-coarse-pointer") {
    expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(
      0,
    );
  } else if (project === "webkit-mobile") {
    expect(page.viewportSize()?.width).toBe(390);
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Mobile");
  } else {
    await expect(page.getByTestId("pointer-surface")).toBeVisible();
  }
});

test("deterministic motion helpers control frames and pointer input", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await installDeterministicAnimationClock(page);
  await page.goto("/test-surfaces/pointer");

  await page.evaluate(() => {
    const target = window as typeof window & { __frameTimestamp?: number };
    requestAnimationFrame((timestamp) => {
      target.__frameTimestamp = timestamp;
    });
  });
  await advanceAnimationFrame(page, 24);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __frameTimestamp?: number })
          .__frameTimestamp,
    ),
  ).toBe(24);

  await followStablePointerPath(page);
  await expect(page.getByTestId("pointer-surface")).toBeVisible();
});

test("stable screenshot probe", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/themes");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("screenshot-probe")).toHaveScreenshot(
    "stable-probe.png",
  );
});

test("token canvas renders without accessibility or runtime errors", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/test-surfaces/tokens");
  await expect(page.getByTestId("token-canvas")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Accent palette" }),
  ).toBeVisible();
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("token environment baselines remain functional", async ({
  page,
}, testInfo) => {
  await page.goto("/test-surfaces/tokens");
  const motionProbe = page.getByTestId("motion-probe").locator("span").first();

  if (testInfo.project.name === "chromium-reduced-motion") {
    await expect
      .poll(() =>
        motionProbe.evaluate((element) => ({
          duration: getComputedStyle(element).transitionDuration,
          rotation: getComputedStyle(element).getPropertyValue(
            "--sui-intensity-rotation",
          ),
        })),
      )
      .toEqual({ duration: "0.001s", rotation: "0deg" });
  } else if (testInfo.project.name === "chromium-forced-colors") {
    const button = page.getByRole("button", { name: "Paper focus" });
    await button.focus();
    const styles = await button.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
      };
    });
    expect(styles.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(3);
  }
});

test("plain CSS theming and focus tokens resolve", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/tokens");

  const customTheme = page.getByTestId("consumer-theme");
  expect(
    await customTheme.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(223, 248, 240)");

  for (const name of [
    "Paper focus",
    "Night focus",
    "Ultraviolet focus",
    "Acid focus",
    "Cyan focus",
    "Custom theme focus",
  ]) {
    const button = page.getByRole("button", { name });
    await button.focus();
    await expect(button).toBeFocused();
    const outline = await button.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    );
    expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(3);
  }
});

test("token canvas visual baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/tokens");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("token-canvas")).toHaveScreenshot(
    "token-canvas.png",
  );
});

test("official sticker gallery renders every packed asset", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/test-surfaces/sticker-gallery");
  await expect(page.getByTestId("sticker-gallery")).toBeVisible();
  await expect(page.getByTestId("official-sticker")).toHaveCount(25);
  await expect
    .poll(() =>
      page
        .locator(".gallery-grid img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("official sticker gallery visual baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/sticker-gallery");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("sticker-gallery")).toHaveScreenshot(
    "official-sticker-gallery.png",
  );
});
