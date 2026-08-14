import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/trail-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiBroadTrailTreeShakeProbe",
    },
    outDir: "dist-trail-tree-shake",
    sourcemap: true,
  },
});
