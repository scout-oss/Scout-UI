import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/stack-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiStackTreeShakeProbe",
    },
    outDir: "dist-stack-tree-shake",
    sourcemap: true,
  },
});
