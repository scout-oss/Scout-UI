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
