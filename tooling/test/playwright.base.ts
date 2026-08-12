import type { PlaywrightTestConfig } from "@playwright/test";

export const basePlaywrightConfig = {
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: ".artifacts/playwright/test-results",
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  // Screenshot baselines are scoped by operating system. Font rasterisation
  // and text metrics differ enough between platforms that one shared baseline
  // cannot be correct everywhere: the same page renders at a different height
  // on Windows than on the platform the original baselines came from. Each
  // platform therefore owns a complete set, and a platform with no set yet
  // generates one on first run rather than failing against foreign pixels.
  //
  // Baselines inherited from the project's original environment are preserved
  // under `__screenshots__/_original-platform/`. That directory is deliberately
  // not a value `process.platform` can produce, because the platform that
  // produced them is not recorded anywhere in this repository and must not be
  // guessed. See tests/browser/README.md.
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}-{projectName}{ext}",
  testDir: "tests/browser",
  // Pointer-driven scenarios step through many real frames, and the matrix
  // shares two fixture servers. This raises the budget only; no assertion or
  // expect-level timeout is relaxed.
  timeout: 90_000,
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  ...(process.env.CI ? { workers: 1 } : {}),
} satisfies PlaywrightTestConfig;
