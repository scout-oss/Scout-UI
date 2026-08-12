/**
 * Compose one published stylesheet from a base sheet plus authored parts.
 *
 * Trail rules are authored exactly once, in the standalone package. The broad
 * React package includes those same rules through this step so a broad consumer
 * needs a single CSS import and the two packages cannot drift.
 *
 * Usage:
 *   node compose-stylesheet.mjs <base.css> <destination.css> <part.css>...
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [, , baseArgument, destinationArgument, ...partArguments] = process.argv;

if (baseArgument === undefined || destinationArgument === undefined) {
  throw new Error(
    "Usage: compose-stylesheet.mjs <base> <destination> <part>...",
  );
}

if (partArguments.length === 0) {
  throw new Error("compose-stylesheet.mjs requires at least one part");
}

/** Normalise line endings so output is byte-identical across platforms. */
async function readSheet(path) {
  const source = await readFile(resolve(path), "utf8");
  return source.replace(/\r\n/gu, "\n");
}

/**
 * Drop a part's cascade-layer order statement. The base sheet already
 * establishes the order; repeating it would be redundant noise in the emitted
 * bundle and would make "appears exactly once" assertions ambiguous.
 */
function stripLayerOrderStatement(source) {
  return source.replace(/^@layer\s+[^;{]+;\s*/mu, "");
}

const base = await readSheet(baseArgument);
const sections = [base.trimEnd()];

for (const part of partArguments) {
  const name = part.replaceAll("\\", "/");
  const body = stripLayerOrderStatement(await readSheet(part)).trim();

  if (body.length === 0) {
    throw new Error(`compose-stylesheet.mjs: ${part} produced no rules`);
  }

  sections.push(
    `/* --- Scout UI composed section, authored once in ${name} --- */`,
    body,
  );
}

const destination = resolve(destinationArgument);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${sections.join("\n\n")}\n`, "utf8");
