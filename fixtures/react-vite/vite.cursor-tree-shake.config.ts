import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/cursor-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiCursorTreeShakeProbe",
    },
    outDir: "dist-cursor-tree-shake",
    sourcemap: true,
  },
});
