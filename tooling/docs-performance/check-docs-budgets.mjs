import { spawn } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolingRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolingRoot, "../..");
const docsRoot = path.join(repositoryRoot, "apps/docs");
const staticRoot = path.join(docsRoot, ".next/static");
const pagefindRoot = path.join(docsRoot, "public/_pagefind");
const budgets = JSON.parse(
  await readFile(path.join(toolingRoot, "budgets.json"), "utf8"),
);
const { routes } = JSON.parse(
  await readFile(path.join(toolingRoot, "routes.json"), "utf8"),
);
const port = 4317;
const origin = `http://127.0.0.1:${String(port)}`;

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Connection refusal is expected while Next starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Docs server did not become ready at ${origin}`);
}

function chunkPath(source) {
  const marker = "/_next/";
  const index = source.indexOf(marker);
  if (index < 0) throw new Error(`Unexpected script source: ${source}`);
  return path.join(
    docsRoot,
    ".next",
    decodeURIComponent(source.slice(index + marker.length)),
  );
}

function scriptSources(html) {
  return [
    ...new Set(
      [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/gu)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
}

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    total += entry.isDirectory()
      ? await directorySize(target)
      : (await stat(target)).size;
  }
  return total;
}

async function findShikiWorker() {
  const chunks = await readdir(path.join(staticRoot, "chunks"));
  const candidates = [];
  for (const name of chunks.filter((entry) => entry.endsWith(".js")).sort()) {
    const target = path.join(staticRoot, "chunks", name);
    const source = await readFile(target, "utf8");
    if (
      source.includes("ShikiError") ||
      source.includes("@shikijs") ||
      source.includes("createHighlighterCore")
    ) {
      candidates.push({ name, rawBytes: Buffer.byteLength(source) });
    }
  }
  if (candidates.length !== 1) {
    throw new Error(
      `Expected one lazy Shiki worker chunk, found ${String(candidates.length)}`,
    );
  }
  return candidates[0];
}

const nextBin = path.join(docsRoot, "node_modules/next/dist/bin/next");
const server = spawn(
  process.execPath,
  [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)],
  {
    cwd: docsRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  },
);

const failures = [];
const measurements = [];
try {
  await waitForServer();
  for (const route of routes) {
    const response = await fetch(`${origin}${route.path}`);
    if (!response.ok) {
      throw new Error(`${route.path} returned ${String(response.status)}`);
    }
    const html = await response.text();
    const sources = scriptSources(html);
    const chunks = await Promise.all(
      sources.map(async (source) => {
        const bytes = await readFile(chunkPath(source));
        return {
          gzipBytes: gzipSync(bytes).byteLength,
          rawBytes: bytes.byteLength,
        };
      }),
    );
    const rawBytes = chunks.reduce((total, chunk) => total + chunk.rawBytes, 0);
    const gzipBytes = chunks.reduce(
      (total, chunk) => total + chunk.gzipBytes,
      0,
    );
    const budget = budgets.routeCategories[route.category];
    const pagefindInitiallyIncluded = sources.some((source) =>
      source.includes("pagefind"),
    );
    const shikiInitiallyIncluded = sources.some((source) =>
      source.includes("shiki"),
    );
    const result =
      rawBytes <= budget.rawBudgetBytes &&
      gzipBytes <= budget.gzipBudgetBytes &&
      !pagefindInitiallyIncluded &&
      !shikiInitiallyIncluded;
    measurements.push({
      budget,
      category: route.category,
      gzipBytes,
      pagefindInitiallyIncluded,
      path: route.path,
      rawBytes,
      result: result ? "PASS" : "FAIL",
      scriptCount: sources.length,
      shikiInitiallyIncluded,
    });
    if (!result) failures.push(route.path);
  }

  const pagefindPackage = JSON.parse(
    await readFile(
      path.join(docsRoot, "node_modules/pagefind/package.json"),
      "utf8",
    ),
  );
  const pagefindIndexBytes = await directorySize(pagefindRoot);
  const pagefindRuntimeBytes = (
    await stat(path.join(pagefindRoot, "pagefind.js"))
  ).size;
  const shikiWorker = await findShikiWorker();
  const lazy = {
    pagefind: {
      indexBytes: pagefindIndexBytes,
      runtimeBytes: pagefindRuntimeBytes,
      version: pagefindPackage.version,
    },
    shikiWorker,
  };
  if (
    pagefindPackage.version !== budgets.pagefind.version ||
    pagefindIndexBytes > budgets.pagefind.indexBudgetBytes ||
    pagefindRuntimeBytes > budgets.pagefind.coreRuntimeBudgetBytes ||
    shikiWorker.rawBytes > budgets.shikiWorker.rawBudgetBytes
  ) {
    failures.push("lazy-assets");
  }

  console.log(JSON.stringify({ lazy, measurements }, null, 2));
} finally {
  server.kill("SIGTERM");
}

if (failures.length > 0) {
  throw new Error(
    `Documentation performance budgets failed: ${failures.join(", ")}`,
  );
}
