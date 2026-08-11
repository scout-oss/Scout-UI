import { defineConfig } from "@playwright/test";

import { basePlaywrightConfig } from "./tooling/test/playwright.base.ts";

export default defineConfig(basePlaywrightConfig);
