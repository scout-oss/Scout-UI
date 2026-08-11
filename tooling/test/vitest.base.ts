import { defineConfig } from "vitest/config";

export const baseVitestConfig = defineConfig({
  test: {
    coverage: {
      reporter: ["text", "json", "html"],
    },
    include: ["**/tests/**/*.test.{ts,tsx}"],
    passWithNoTests: false,
    restoreMocks: true,
  },
});
