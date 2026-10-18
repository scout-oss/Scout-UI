import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as pagefind from "pagefind";

const docsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const server = path.join(docsRoot, ".next/server");
const outputPath = path.join(docsRoot, "public/_pagefind");

async function htmlFiles(directory) {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// Next writes prerendered App Router HTML to server/app. With a deployment
// adapter (NEXT_ADAPTER_PATH, set by Vercel) it uses a route-cache key instead:
// server/route-cache/APP_PAGE/<sha256 of the source route>/$/<pathname>.html.
// Both layouts map to the same site-relative path, which Pagefind turns into
// the result URL exactly as `pagefind --site .next/server/app` did. `next start`
// also writes runtime cache entries to route-cache, so a build that produced
// server/app HTML is indexed from server/app alone.
const pages = new Map();
for (const file of await htmlFiles(path.join(server, "app")))
  pages.set(path.relative(path.join(server, "app"), file), file);
if (pages.size === 0)
  for (const file of await htmlFiles(
    path.join(server, "route-cache/APP_PAGE"),
  )) {
    const [, sourcePath] = file.split(`${path.sep}$${path.sep}`);
    if (!sourcePath) throw new Error(`Unrecognized route-cache file: ${file}`);
    pages.set(sourcePath, file);
  }
if (pages.size === 0)
  throw new Error("No prerendered HTML found in .next/server");

const { index, errors } = await pagefind.createIndex({ forceLanguage: "en" });
try {
  if (errors.length) throw new Error(errors.join("\n"));
  for (const [sourcePath, file] of [...pages].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const response = await index.addHTMLFile({
      sourcePath: sourcePath.split(path.sep).join("/"),
      content: await readFile(file, "utf8"),
    });
    if (response.errors.length)
      throw new Error(`${sourcePath}: ${response.errors.join("\n")}`);
  }
  await rm(outputPath, { recursive: true, force: true });
  const written = await index.writeFiles({ outputPath });
  if (written.errors.length) throw new Error(written.errors.join("\n"));
  console.log(
    `Pagefind indexed ${String(pages.size)} prerendered HTML files into public/_pagefind`,
  );
} finally {
  await pagefind.close();
}
