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

const visualProjects = [
  "chromium-desktop",
  "chromium-reduced-motion",
  "chromium-coarse-pointer",
  "chromium-forced-colors",
];
const visualProjectArguments = visualProjects.flatMap((project) => [
  "--project",
  project,
]);
const consumerVisualPattern = [
  "stable screenshot probe",
  "token canvas visual baseline",
  "official sticker gallery visual baseline",
  "primitive gallery visual baseline",
].join("|");

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

const failures = [];
async function runSelected(command, args) {
  try {
    await run(command, args);
  } catch (error) {
    if (mode !== "visual") throw error;
    failures.push(error);
  }
}

const commonArguments =
  mode === "visual"
    ? [...visualProjectArguments, "--workers=1"]
    : ["--ignore-snapshots", "--workers=1"];

if (fixture.length > 0) {
  await runSelected("node", [
    "tooling/fixtures/run-browser-harness.mjs",
    ...fixture.map((name) => `tests/browser/${name}`),
    ...commonArguments,
  ]);
}
if (mode === "visual") {
  // Four historical screenshot contracts live alongside the consumer's
  // behavioral assertions. Keep their established snapshot paths without
  // rerunning that entire behavioral file in the Visual workflow.
  await runSelected("node", [
    "tooling/fixtures/run-browser-harness.mjs",
    "tests/browser/consumer.spec.ts",
    "--project",
    "chromium-desktop",
    "--grep",
    consumerVisualPattern,
    "--workers=1",
  ]);
}
if (docs.length > 0) {
  await runSelected("node", [
    "apps/docs/tests/browser/run-docs-browser.mjs",
    ...docs.map((name) => `tests/browser/${name}`),
    ...commonArguments,
  ]);
}

if (failures.length > 0) {
  throw new AggregateError(
    failures,
    `Visual contracts failed. Genuine ${process.platform} candidates, diffs, and traces are available for artifact review.`,
  );
}
