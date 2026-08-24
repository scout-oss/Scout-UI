import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { readJson, releasePolicy, repositoryRoot } from "./release-config.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function run(command, args, cwd, env = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal ?? code})`));
    });
  });
}

const reportPath = argument("--report");
assert.ok(reportPath, "--report is required");
const report = await readJson(reportPath);
const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "scout-ui-public-consumers-"),
);
try {
  for (const [key, source] of [
    ["next", "fixtures/next-app"],
    ["vite", "fixtures/react-vite"],
    ["docs", "apps/docs"],
  ]) {
    const consumer = path.join(temporaryRoot, key);
    await cp(path.join(repositoryRoot, source), consumer, {
      filter: (entry) =>
        ![".next", "dist", "node_modules", "public"].includes(
          path.basename(entry),
        ),
      recursive: true,
    });
    const manifestPath = path.join(consumer, "package.json");
    const manifest = await readJson(manifestPath);
    for (const [name, version] of Object.entries(report.versions)) {
      manifest.dependencies[name] = version;
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(
      path.join(consumer, "pnpm-workspace.yaml"),
      'packages:\n  - "."\n',
    );
    await run("corepack", ["pnpm", "install", "--lockfile-only"], consumer);
    await run("corepack", ["pnpm", "install", "--frozen-lockfile"], consumer);
    if (key === "next") {
      await run("corepack", ["pnpm", "fixture:build"], consumer);
      await run("corepack", ["pnpm", "fixture:typecheck"], consumer);
    } else if (key === "vite") {
      await run("corepack", ["pnpm", "fixture:build"], consumer);
    } else {
      await run("corepack", ["pnpm", "build"], consumer, {
        SCOUT_UI_DOCS_ORIGIN: releasePolicy.docsOrigin,
      });
      const pagefind = await readFile(
        path.join(consumer, "public", "_pagefind", "pagefind.js"),
      );
      assert.ok(pagefind.length > 0, "canary docs omitted Pagefind");
    }
  }
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
