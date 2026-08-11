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

export default createLibraryConfig({
  input: {
    index: "src/index.ts",
    manifest: "src/manifest.ts",
    ...definitions,
  },
});
