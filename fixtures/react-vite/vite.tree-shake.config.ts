import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiTreeShakeProbe",
    },
    outDir: "dist-tree-shake",
    sourcemap: true,
  },
});
