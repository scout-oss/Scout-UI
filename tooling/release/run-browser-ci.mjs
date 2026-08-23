import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const mode = process.argv[2];
assert.ok(
  ["interaction", "visual"].includes(mode),
  "expected interaction or visual",
);

function isDocsSpec(name) {
  return /^(?:copy-code|docs-|playground-|prompt-)/u.test(name);
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal ?? code})`));
    });
  });
}

const files = (await readdir(path.join(root, "tests", "browser")))
  .filter((name) => name.endsWith(".spec.ts"))
  .sort();
const selected = files.filter((name) =>
  mode === "visual"
    ? name.includes("-visual.spec.ts")
    : !name.includes("-visual.spec.ts"),
);
const fixture = selected.filter((name) => !isDocsSpec(name));
const docs = selected.filter(isDocsSpec);

if (mode === "visual") {
  const platformDirectory = path.join(
    root,
    "tests",
    "browser",
    "__screenshots__",
    process.platform,
  );
  const hasBaseline = await readdir(platformDirectory)
    .then(() => true)
    .catch(() => false);
  if (!hasBaseline) {
    await run("corepack", ["pnpm", "test:visual"]);
    throw new Error(
      `Generated genuine ${process.platform} candidate baselines. Review and commit them before Visual / required can pass.`,
    );
  }
}

if (fixture.length > 0) {
  await run("node", [
    "tooling/fixtures/run-browser-harness.mjs",
    ...fixture.map((name) => `tests/browser/${name}`),
    "--workers=1",
  ]);
}
if (docs.length > 0) {
  await run("node", [
    "apps/docs/tests/browser/run-docs-browser.mjs",
    ...docs.map((name) => `tests/browser/${name}`),
    "--workers=1",
  ]);
}
