import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  readFile,
  readdir,
  realpath,
  rm,
  cp,
  mkdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const artifactRoot = path.join(root, ".artifacts", "packed-fixtures");
const tarballDirectory = path.join(artifactRoot, "tarballs");
const consumerDirectory = path.join(artifactRoot, "consumers");

const packageRecords = [
  { directory: "packages/react", name: "@scout-ui/react", slug: "react" },
  {
    directory: "packages/sticker-trail",
    name: "@scout-ui/sticker-trail",
    slug: "sticker-trail",
  },
  {
    directory: "packages/stickers",
    name: "@scout-ui/stickers",
    slug: "stickers",
  },
];

const fixtureRecords = [
  { directory: "fixtures/next-app", key: "next" },
  { directory: "fixtures/react-vite", key: "vite" },
];

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
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

async function runCaptured(command, args, options = {}) {
  let stdout = "";
  let stderr = "";
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve(stdout);
      else
        reject(
          new Error(
            `${command} ${args.join(" ")} failed (${signal ?? code})\n${stderr}`,
          ),
        );
    });
  });
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    else files.push(relative);
  }
  return files.sort();
}

function assertDirective(source, expected, label) {
  const firstStatement = source.trimStart().split("\n", 1)[0]?.trim();
  if (expected)
    assert.match(
      firstStatement ?? "",
      /^(["'])use client\1;?$/,
      `${label} must start with use client`,
    );
  else
    assert.doesNotMatch(
      firstStatement ?? "",
      /^(["'])use client\1;?$/,
      `${label} must stay server-compatible`,
    );
}

async function inspectInstalledPackage(consumer, record) {
  const installed = path.join(
    consumer,
    "node_modules",
    ...record.name.split("/"),
  );
  const resolved = await realpath(installed);
  assert.ok(
    resolved.startsWith(consumer),
    `${record.name} resolved outside isolated consumer`,
  );
  assert.ok(
    !resolved.includes(`${path.sep}packages${path.sep}`),
    `${record.name} resolved to workspace source`,
  );
  const files = await listFiles(installed);
  assert.ok(files.includes("package.json"));
  assert.ok(files.includes("README.md"));
  assert.ok(files.includes("LICENSE"));
  assert.ok(files.some((file) => file.endsWith(".js")));
  assert.ok(files.some((file) => file.endsWith(".js.map")));
  assert.ok(files.some((file) => file.endsWith(".d.ts")));
  assert.ok(files.some((file) => file.endsWith(".d.ts.map")));
  assert.equal(
    files.some(
      (file) =>
        file.startsWith("src/") ||
        file.startsWith("tests/") ||
        file.startsWith("node_modules/"),
    ),
    false,
  );
  if (record.slug !== "stickers") assert.ok(files.includes("dist/styles.css"));

  const manifest = JSON.parse(
    await readFile(path.join(installed, "package.json"), "utf8"),
  );
  assert.equal(manifest.name, record.name);
  const expectedExports = {
    react: [
      ".",
      "./package.json",
      "./sticker",
      "./sticker-trail",
      "./styles.css",
    ],
    "sticker-trail": [".", "./package.json", "./styles.css"],
    stickers: [".", "./package.json"],
  };
  assert.deepEqual(
    Object.keys(manifest.exports).sort(),
    expectedExports[record.slug],
    `${record.name} exports map changed unexpectedly`,
  );
  if (record.slug === "stickers") {
    assert.equal(manifest.dependencies?.react, undefined);
    assert.equal(manifest.peerDependencies?.react, undefined);
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
    assert.deepEqual(Object.keys(manifest.peerDependencies ?? {}), []);
  } else if (record.slug === "sticker-trail") {
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
    assert.deepEqual(Object.keys(manifest.peerDependencies ?? {}).sort(), [
      "react",
    ]);
  } else {
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}).sort(), [
      "@scout-ui/sticker-trail",
    ]);
    assert.deepEqual(Object.keys(manifest.peerDependencies ?? {}).sort(), [
      "react",
      "react-dom",
    ]);
  }

  if (record.slug === "react") {
    assert.ok(files.includes("dist/tokens.generated.js"));
    assert.ok(files.includes("dist/tokens.generated.d.ts"));
    const css = await readFile(
      path.join(installed, "dist", "styles.css"),
      "utf8",
    );
    for (const tokenName of [
      "--sui-paper",
      "--sui-night",
      "--sui-ultraviolet",
      "--sui-success",
      "--sui-font-display",
      "--sui-space-4",
      "--sui-cut-line",
      "--sui-shadow-stuck",
      "--sui-duration-stick",
      "--sui-intensity-rotation",
      "--sui-density-gap",
      "--sui-layer-modal",
    ]) {
      assert.match(css, new RegExp(`${tokenName}:`, "u"));
    }
    assert.doesNotMatch(css, /@font-face|tailwind/iu);
    assert.doesNotMatch(
      css,
      /(?:^|\})\s*(?:\*|body|button|html|input)\s*\{/gmu,
      "public stylesheet contains a global element/reset selector",
    );
    assert.match(css, /@media \(forced-colors: active\)/u);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  }
  return installed;
}

async function assertFixtureImports(fixture) {
  const files = (await listFiles(fixture)).filter((file) =>
    /\.(?:ts|tsx|js|jsx)$/u.test(file),
  );
  for (const file of files) {
    const source = await readFile(path.join(fixture, file), "utf8");
    assert.doesNotMatch(
      source,
      /@scout-ui\/[^"']+\/(?:src|dist)\//u,
      `${file} imports internals`,
    );
    assert.doesNotMatch(
      source,
      /\.\.\/.*packages\//u,
      `${file} imports workspace source`,
    );
  }
}

async function assertSingleReact(consumer) {
  const raw = await runCaptured(
    "corepack",
    ["pnpm", "list", "react", "--depth", "Infinity", "--json"],
    { cwd: consumer },
  );
  const tree = JSON.parse(raw);
  const versions = new Set();
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.from === "react" && typeof node.version === "string")
      versions.add(node.version);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(tree);
  assert.deepEqual(
    [...versions],
    ["19.2.8"],
    "fixture must resolve one React version",
  );
}

async function createConsumer(record, tarballs) {
  const source = path.join(root, record.directory);
  const destination = path.join(consumerDirectory, record.key);
  await cp(source, destination, {
    filter: (sourcePath) =>
      !["node_modules", ".next", "dist"].includes(path.basename(sourcePath)),
    recursive: true,
  });
  await assertFixtureImports(destination);

  const manifestPath = path.join(destination, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.dependencies = {
    ...manifest.dependencies,
    "@scout-ui/react": `file:${tarballs.react}`,
    "@scout-ui/sticker-trail": `file:${tarballs["sticker-trail"]}`,
    "@scout-ui/stickers": `file:${tarballs.stickers}`,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(destination, "pnpm-workspace.yaml"),
    `packages:\n  - "."\noverrides:\n  "@scout-ui/sticker-trail": "file:${tarballs["sticker-trail"]}"\n`,
  );

  await run("corepack", ["pnpm", "install", "--lockfile-only"], {
    cwd: destination,
  });
  await run("corepack", ["pnpm", "install", "--frozen-lockfile"], {
    cwd: destination,
  });
  for (const packageRecord of packageRecords)
    await inspectInstalledPackage(destination, packageRecord);
  await assertSingleReact(destination);
  return destination;
}

async function assertBoundaries(nextConsumer) {
  const reactDirectory = path.join(
    nextConsumer,
    "node_modules",
    "@scout-ui",
    "react",
    "dist",
  );
  const trailDirectory = path.join(
    nextConsumer,
    "node_modules",
    "@scout-ui",
    "sticker-trail",
    "dist",
  );
  assertDirective(
    await readFile(path.join(reactDirectory, "index.js"), "utf8"),
    false,
    "React root",
  );
  assertDirective(
    await readFile(path.join(reactDirectory, "sticker", "index.js"), "utf8"),
    false,
    "Sticker leaf",
  );
  assertDirective(
    await readFile(
      path.join(reactDirectory, "sticker-trail", "index.js"),
      "utf8",
    ),
    true,
    "React trail leaf",
  );
  assertDirective(
    await readFile(path.join(trailDirectory, "index.js"), "utf8"),
    true,
    "Standalone trail root",
  );
}

async function assertServerEvaluation(consumer) {
  const script = `
    if (typeof window !== "undefined") throw new Error("window leaked into server evaluation");
    const root = await import("@scout-ui/react");
    const sticker = await import("@scout-ui/react/sticker");
    const stickers = await import("@scout-ui/stickers");
    if (root.scoutUiReactVersion !== "0.0.0" || sticker.stickerEntryStatus !== "server-compatible" || stickers.stickerPackVersion !== "0.0.0") process.exit(2);
  `;
  await run(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: consumer,
  });
}

async function assertTreeShaking(viteConsumer) {
  const output = await Promise.all(
    (await listFiles(path.join(viteConsumer, "dist-tree-shake")))
      .filter((file) => file.endsWith(".js"))
      .map((file) =>
        readFile(path.join(viteConsumer, "dist-tree-shake", file), "utf8"),
      ),
  );
  const source = output.join("\n");
  assert.match(source, /server-compatible/u);
  assert.doesNotMatch(
    source,
    /0\.0\.0|sticker-trail/u,
    "Sticker-only Vite build retained unused interactive leaves",
  );
}

async function assertNextServerOutput(nextConsumer) {
  const files = (await listFiles(path.join(nextConsumer, ".next"))).filter(
    (file) => /\.(?:js|json)$/u.test(file),
  );
  const relevant = files.filter(
    (file) =>
      file.includes("server-only") ||
      file.includes("server-root") ||
      file.includes("app-paths-manifest"),
  );
  const output = (
    await Promise.all(
      relevant.map((file) =>
        readFile(path.join(nextConsumer, ".next", file), "utf8"),
      ),
    )
  ).join("\n");
  assert.match(output, /server-only/u);
  assert.match(output, /server-root/u);
  assert.doesNotMatch(
    output,
    /client entry ready|scout-ui-react-sticker-trail/u,
    "server root/subpath route pulled the client fixture boundary",
  );
}

export async function preparePackedConsumers() {
  assert.equal(artifactRoot, path.join(root, ".artifacts", "packed-fixtures"));
  await rm(artifactRoot, { force: true, recursive: true });
  await mkdir(tarballDirectory, { recursive: true });
  await mkdir(consumerDirectory, { recursive: true });

  for (const record of packageRecords) {
    await run("corepack", ["pnpm", "--filter", record.name, "build"]);
    await run(
      "corepack",
      ["pnpm", "pack", "--pack-destination", tarballDirectory],
      {
        cwd: path.join(root, record.directory),
      },
    );
  }

  const tarballFiles = await readdir(tarballDirectory);
  const tarballs = Object.fromEntries(
    packageRecords.map((record) => {
      const filename = tarballFiles.find(
        (file) => file === `scout-ui-${record.slug}-0.0.0.tgz`,
      );
      assert.ok(filename, `missing tarball for ${record.name}`);
      return [record.slug, path.join(tarballDirectory, filename)];
    }),
  );

  const consumers = {};
  for (const record of fixtureRecords)
    consumers[record.key] = await createConsumer(record, tarballs);
  await assertBoundaries(consumers.next);
  await assertServerEvaluation(consumers.next);
  await assertServerEvaluation(consumers.vite);
  await run("corepack", ["pnpm", "fixture:typecheck"], { cwd: consumers.next });
  await run("corepack", ["pnpm", "fixture:build"], { cwd: consumers.next });
  await assertNextServerOutput(consumers.next);
  await run("corepack", ["pnpm", "fixture:build"], { cwd: consumers.vite });
  await assertTreeShaking(consumers.vite);

  const manifest = { createdAt: new Date().toISOString(), consumers, tarballs };
  await writeFile(
    path.join(artifactRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await preparePackedConsumers();
}
