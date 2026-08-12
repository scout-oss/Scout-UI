import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Builds the standalone-only page into its own isolated output directory so
 * nothing can be shared with the broad-package bundle. That isolation is what
 * makes "the standalone path never pulls in @scout-ui/react" verifiable.
 */
export default defineConfig({
  // The page is served from its own subdirectory, so asset URLs must be
  // resolved against it rather than against the preview root.
  base: "/standalone/",
  build: {
    emptyOutDir: false,
    outDir: "dist/standalone",
    rollupOptions: {
      input: resolve(import.meta.dirname, "standalone-trail.html"),
    },
    sourcemap: true,
  },
  plugins: [react()],
});
