import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

export default createLibraryConfig({
  clientEntries: ["src/sticker-trail/index.ts"],
  input: [
    "src/index.ts",
    "src/sticker/index.tsx",
    "src/sticker-badge/index.tsx",
    "src/sticker-button/index.tsx",
    "src/sticker-trail/index.ts",
  ],
  external: [/^@scout-ui\//u, /^react(?:-dom)?(?:\/.*)?$/u],
});
