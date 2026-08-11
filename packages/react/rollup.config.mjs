import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

export default createLibraryConfig({
  clientEntries: ["src/sticker-trail/index.ts"],
  input: ["src/index.ts", "src/sticker/index.ts", "src/sticker-trail/index.ts"],
  external: [/^@scout-ui\//u, /^react(?:-dom)?(?:\/.*)?$/u],
});
