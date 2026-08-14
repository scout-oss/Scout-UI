/**
 * Make declaration maps self-contained without shipping the editable source
 * tree. TypeScript's declaration-only emit records relative source paths but
 * does not populate sourcesContent, even when inlineSources is enabled.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , directoryArgument] = process.argv;

if (directoryArgument === undefined) {
  throw new Error(
    "Usage: embed-declaration-sources.mjs <declaration-directory>",
  );
}

const directory = path.resolve(directoryArgument);

async function declarationMaps(current) {
  const entries = await readdir(current, { withFileTypes: true });
  const maps = [];
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) {
      maps.push(...(await declarationMaps(target)));
    } else if (entry.name.endsWith(".d.ts.map")) {
      maps.push(target);
    }
  }
  return maps.sort();
}

for (const mapFile of await declarationMaps(directory)) {
  const sourceMap = JSON.parse(await readFile(mapFile, "utf8"));
  const sourceRoot = sourceMap.sourceRoot ?? "";
  sourceMap.sourcesContent = await Promise.all(
    sourceMap.sources.map(async (source) => {
      if (path.isAbsolute(source) || path.isAbsolute(sourceRoot)) {
        throw new Error(`${mapFile} contains an absolute declaration source`);
      }
      const sourceFile = path.resolve(
        path.dirname(mapFile),
        sourceRoot,
        source,
      );
      return (await readFile(sourceFile, "utf8")).replace(/\r\n/gu, "\n");
    }),
  );
  await writeFile(mapFile, JSON.stringify(sourceMap), "utf8");
}
