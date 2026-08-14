import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/standalone-trail-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiStandaloneTrailTreeShakeProbe",
    },
    outDir: "dist-standalone-trail-tree-shake",
    sourcemap: true,
  },
});
