import { mergeConfig } from "vitest/config";

import { baseVitestConfig } from "./tooling/test/vitest.base.ts";

export default mergeConfig(baseVitestConfig, {
  test: {
    environment: "node",
  },
});
