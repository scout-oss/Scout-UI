import { defineConfig, devices } from "@playwright/test";

import { basePlaywrightConfig } from "../../tooling/test/playwright.base.ts";

/**
 * Kinetic design-exploration suite. Deliberately separate from the frozen
 * v0.1 release suites: its own test directory (so neither the fixture nor the
 * docs config can pick it up) and its own screenshot folder, so new design
 * baselines never replace qualification evidence until they are approved.
 *
 * Run after `pnpm --filter @scout-ui/docs build`:
 *   pnpm exec playwright test --config apps/docs/playwright.kinetic.config.ts
 */
const port = 4313;
const baseURL =
  process.env.SCOUT_UI_KINETIC_URL ?? `http://127.0.0.1:${String(port)}`;

export default defineConfig(basePlaywrightConfig, {
  outputDir: "../../.artifacts/playwright/kinetic-test-results",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}-{projectName}{ext}",
  testDir: "../../tests/browser-kinetic",
  workers: 1,
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
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
  use: { ...basePlaywrightConfig.use, baseURL },
  ...(process.env.SCOUT_UI_KINETIC_URL
    ? {}
    : {
        webServer: {
          command: `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${String(port)}`,
          cwd: ".",
          reuseExistingServer: false,
          url: baseURL,
        },
      }),
});
