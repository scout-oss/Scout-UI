import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

export default createLibraryConfig({
  clientEntries: ["src/index.ts"],
  external: [/^react(?:\/.*)?$/u],
  // Keep the M11 tarball contract deterministic after a clean build. This is
  // a type-only public module, but its empty ESM companion is part of the
  // frozen package-content snapshot.
  input: ["src/index.ts", "src/types.ts"],
});
