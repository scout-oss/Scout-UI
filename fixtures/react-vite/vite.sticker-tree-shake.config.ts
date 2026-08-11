import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/sticker-tree-shake.ts"),
      formats: ["es"],
      name: "ScoutUiStickerTreeShakeProbe",
    },
    outDir: "dist-sticker-tree-shake",
    sourcemap: true,
  },
});
