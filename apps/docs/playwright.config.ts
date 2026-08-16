import { defineConfig, devices } from "@playwright/test";

import { basePlaywrightConfig } from "../../tooling/test/playwright.base.ts";

const baseURL = process.env.SCOUT_UI_DOCS_URL ?? "http://127.0.0.1:4312";

export default defineConfig(basePlaywrightConfig, {
  outputDir: "../../.artifacts/playwright/docs-test-results",
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
    {
      name: "chromium-tablet",
      use: {
        ...devices["Desktop Chrome"],
        hasTouch: true,
        viewport: { height: 1024, width: 820 },
      },
    },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
    {
      name: "chromium-reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "chromium-coarse-pointer",
      use: {
        ...devices["Pixel 5"],
        hasTouch: true,
        isMobile: true,
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: "chromium-forced-colors",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { forcedColors: "active" },
      },
    },
  ],
  testDir: "../../tests/browser",
  testMatch: ["docs-*.spec.ts"],
  use: {
    ...basePlaywrightConfig.use,
    baseURL,
  },
});
