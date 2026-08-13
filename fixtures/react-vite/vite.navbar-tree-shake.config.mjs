import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/navbar-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiNavbarTreeShakeProbe",
    },
    outDir: "dist-navbar-tree-shake",
    sourcemap: true,
  },
});
