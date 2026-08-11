import type { PlaywrightTestConfig } from "@playwright/test";

export const basePlaywrightConfig = {
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: ".artifacts/playwright/test-results",
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
  testDir: "tests/browser",
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  ...(process.env.CI ? { workers: 1 } : {}),
} satisfies PlaywrightTestConfig;
