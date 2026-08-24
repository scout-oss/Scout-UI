import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  discoverReleasePackages,
  isPrerelease,
  publishOrder,
  readJson,
  releasePolicy,
  repositoryRoot,
  validateManifest,
} from "./release-config.mjs";
import { validateReleaseText } from "./release-notes.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const mode = argument("--mode", "stable");
assert.ok(
  ["stable", "canary", "production"].includes(mode),
  `invalid mode ${mode}`,
);
const expectedVersion = argument("--expected-version");
const identifier = argument("--identifier", "m18");
assert.match(identifier, /^[0-9A-Za-z.-]+$/u, "invalid canary identifier");

function needsShell(command) {
  return process.platform === "win32" && !path.isAbsolute(command);
}

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: needsShell(command),
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(" ")} failed (${signal ?? code})`),
        );
    });
  });
}

async function hashFile(file) {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

async function copyRepository(destination) {
  const ignored = new Set([
    ".artifacts",
    ".git",
    ".next",
    ".turbo",
    "coverage",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
  ]);
  await cp(repositoryRoot, destination, {
    filter: (source) => !ignored.has(path.basename(source)),
    recursive: true,
  });
}

async function buildDocsFromTarballs(root, tarballs) {
  const consumer = path.join(root, ".artifacts", "release-docs-consumer");
  await cp(path.join(root, "apps", "docs"), consumer, {
    filter: (source) =>
      ![".next", "node_modules", "public"].includes(path.basename(source)),
    recursive: true,
  });
  const manifestPath = path.join(consumer, "package.json");
  const manifest = await readJson(manifestPath);
  for (const [name, tarball] of Object.entries(tarballs)) {
    manifest.dependencies[name] = `file:${tarball.replaceAll("\\", "/")}`;
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(consumer, "pnpm-workspace.yaml"),
    `packages:\n  - "."\noverrides:\n${Object.entries(tarballs)
      .map(
        ([name, tarball]) =>
          `  "${name}": "file:${tarball.replaceAll("\\", "/")}"`,
      )
      .join("\n")}\n`,
  );
  await run("corepack", ["pnpm", "install", "--lockfile-only"], {
    cwd: consumer,
  });
  await run("corepack", ["pnpm", "install", "--frozen-lockfile"], {
    cwd: consumer,
  });
  await run("corepack", ["pnpm", "build"], {
    cwd: consumer,
    env: { SCOUT_UI_DOCS_ORIGIN: releasePolicy.docsOrigin },
  });
  await stat(path.join(consumer, "public", "_pagefind", "pagefind.js"));
}

const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "scout-ui-m18-release-"),
);
const workspace = path.join(temporaryRoot, "repository");
const outputDirectory = path.join(
  repositoryRoot,
  ".artifacts",
  "release",
  mode,
);

try {
  await copyRepository(workspace);
  await run("corepack", ["pnpm", "install", "--frozen-lockfile"], {
    cwd: workspace,
  });

  if (mode === "stable") {
    await run("corepack", ["pnpm", "exec", "changeset", "version"], {
      cwd: workspace,
    });
  } else if (mode === "canary") {
    await run(
      "corepack",
      [
        "pnpm",
        "exec",
        "changeset",
        "version",
        "--snapshot",
        `canary-${identifier}`,
        "--snapshot-prerelease-template",
        "{tag}-{datetime}",
      ],
      { cwd: workspace },
    );
  }

  if (mode !== "production") {
    await run("corepack", ["pnpm", "install", "--lockfile-only"], {
      cwd: workspace,
    });
    await run("corepack", ["pnpm", "install", "--frozen-lockfile"], {
      cwd: workspace,
    });
  }

  const records = await discoverReleasePackages(workspace);
  for (const record of records) validateManifest(record);
  const versions = Object.fromEntries(
    records.map(({ manifest }) => [manifest.name, manifest.version]),
  );
  assert.equal(
    new Set(Object.values(versions)).size,
    1,
    "initial release versions diverged",
  );
  for (const version of Object.values(versions)) {
    if (mode === "stable") assert.equal(version, "0.1.0");
    if (mode === "canary") assert.equal(isPrerelease(version), true);
    if (mode === "production") {
      assert.equal(version, expectedVersion, "production version mismatch");
      assert.equal(
        isPrerelease(version),
        false,
        "production version is a prerelease",
      );
    }
  }

  const changelogs = {};
  for (const { directory, manifest } of records) {
    const changelogPath = path.join(workspace, directory, "CHANGELOG.md");
    const text = await readFile(changelogPath, "utf8").catch(() => "");
    if (mode !== "production")
      validateReleaseText(text, `${manifest.name} changelog`);
    changelogs[manifest.name] = text.split("\n").slice(0, 10).join("\n");
  }

  await run("corepack", ["pnpm", "build"], { cwd: workspace });
  await run("corepack", ["pnpm", "test:packages"], { cwd: workspace });
  await run("corepack", ["pnpm", "--filter", "@scout-ui/docs", "build"], {
    cwd: workspace,
    env: { SCOUT_UI_DOCS_ORIGIN: releasePolicy.docsOrigin },
  });
  await run("corepack", ["pnpm", "test:docs-budgets"], { cwd: workspace });

  const packedManifest = await readJson(
    path.join(workspace, ".artifacts", "packed-fixtures", "manifest.json"),
  );
  const tarballs = {};
  const sourceTarballs = {};
  for (const { manifest } of records) {
    const slug = manifest.name.slice("@scout-ui/".length);
    const key = slug === "sticker-trail" ? "sticker-trail" : slug;
    const source = path.join(workspace, packedManifest.tarballs[key]);
    sourceTarballs[manifest.name] = source;
  }
  await buildDocsFromTarballs(workspace, sourceTarballs);

  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(path.join(outputDirectory, "tarballs"), { recursive: true });
  for (const [name, source] of Object.entries(sourceTarballs)) {
    const filename = path.basename(source);
    const destination = path.join(outputDirectory, "tarballs", filename);
    await cp(source, destination);
    const details = await stat(destination);
    tarballs[name] = {
      bytes: details.size,
      file: path.relative(repositoryRoot, destination).replaceAll("\\", "/"),
      sha256: await hashFile(destination),
    };
  }

  const installedReactManifest = await readJson(
    path.join(
      workspace,
      packedManifest.consumers.next,
      "node_modules",
      "@scout-ui",
      "react",
      "package.json",
    ),
  );
  const report = {
    changelogs,
    distTag:
      mode === "canary" ? "canary" : mode === "production" ? "latest" : "none",
    docsCanaryTargetBuild: true,
    docsOrigin: releasePolicy.docsOrigin,
    internalDependencyRanges: {
      "@scout-ui/react -> @scout-ui/sticker-trail":
        installedReactManifest.dependencies["@scout-ui/sticker-trail"],
    },
    mode,
    noPublicationPerformed: true,
    npmTrustedPublishing: {
      auth: "GitHub Actions OIDC",
      expectedAutomaticProvenance: true,
      npmMinimum: "11.5.1",
      nodeMinimum: "22.14.0",
    },
    packagePreflight: await readJson(
      path.join(workspace, ".artifacts", "package-preflight", "report.json"),
    ),
    publishOrder: publishOrder(records),
    repository: releasePolicy.repository,
    tarballs,
    versions,
  };
  await writeFile(
    path.join(outputDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
