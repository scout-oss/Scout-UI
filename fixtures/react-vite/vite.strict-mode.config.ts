import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Development-mode builds of the standalone package.
 *
 * Two React behaviours exist only in a development build, and both are needed
 * to verify Milestone 6 honestly against a real packed tarball:
 *
 * - Strict Mode performs the setup/cleanup/setup replay;
 * - `<Profiler>` invokes `onRender`, so React commits can actually be counted.
 *
 * Each page asserts that its instrument is live before any conclusion is drawn,
 * so neither can pass vacuously.
 */
export default defineConfig({
  base: "/strict/",
  build: {
    emptyOutDir: false,
    minify: false,
    outDir: "dist/strict",
    rollupOptions: {
      input: {
        "cursor-render-count": resolve(
          import.meta.dirname,
          "cursor-render-count.html",
        ),
        "navbar-render-count": resolve(
          import.meta.dirname,
          "navbar-render-count.html",
        ),
        "peel-render-count": resolve(
          import.meta.dirname,
          "peel-render-count.html",
        ),
        "render-count": resolve(import.meta.dirname, "render-count.html"),
        "stack-render-count": resolve(
          import.meta.dirname,
          "stack-render-count.html",
        ),
        "strict-mode": resolve(import.meta.dirname, "strict-mode.html"),
      },
    },
    sourcemap: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  mode: "development",
  plugins: [react()],
  resolve: {
    conditions: ["development", "browser", "module", "import", "default"],
  },
});
