import { readdirSync } from "node:fs";

import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

const definitions = Object.fromEntries(
  readdirSync("src/definitions")
    .filter((file) => file.endsWith(".ts"))
    .map((file) => [
      `definitions/${file.replace(/\.ts$/u, "")}`,
      `src/definitions/${file}`,
    ]),
);

const config = createLibraryConfig({
  input: {
    index: "src/index.ts",
    manifest: "src/manifest.ts",
    // Preserve the frozen M11 tarball inventory on clean builds even though
    // the authored module contains TypeScript types only.
    types: "src/types.ts",
    ...definitions,
  },
});

// CRA 5's SVGR rule matches .js issuers but not native .mjs issuers.
// Only this private URL module uses .mjs; every public export stays unchanged.
config.output.entryFileNames = (chunk) =>
  chunk.name === "asset-urls" ? "asset-urls.mjs" : "[name].js";

export default config;
