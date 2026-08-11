import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

export default createLibraryConfig({
  external: [/^@scout-ui\//u, /^react(?:-dom)?(?:\/.*)?$/u],
});
