import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

import ts from "typescript";

import { preparePackedConsumers } from "../fixtures/test-packed-consumers.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const artifactDirectory = path.join(root, ".artifacts", "package-preflight");
const snapshotDirectory = path.join(
  root,
  "tooling",
  "package-preflight",
  "snapshots",
);
const contentSnapshotPath = path.join(
  snapshotDirectory,
  "tarball-contents.json",
);
const apiSnapshotPath = path.join(snapshotDirectory, "public-api.json");
const budgetSnapshotPath = path.join(snapshotDirectory, "size-budgets.json");
const update = process.argv.includes("--update");
const baselineCommit = "30abbc3d58eefa12266efd772c8d207eed80e419";

const records = [
  {
    key: "react",
    name: "@scout-ui/react",
    purpose: "Eight React components, shared tokens, and broad CSS",
    sourceDirectory: "packages/react",
  },
  {
    key: "sticker-trail",
    name: "@scout-ui/sticker-trail",
    purpose: "Standalone bounded StickerTrail component and hook",
    sourceDirectory: "packages/sticker-trail",
  },
  {
    key: "stickers",
    name: "@scout-ui/stickers",
    purpose: "React-free definitions, manifest, metadata, and assets",
    sourceDirectory: "packages/stickers",
  },
];

const componentFixtureReview = {
  Sticker: [
    "fixtures/next-app/app/page.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerBadge: [
    "fixtures/next-app/app/page.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerButton: [
    "fixtures/next-app/app/page.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerCursor: [
    "fixtures/next-app/app/test-surfaces/cursor/cursor-surfaces.tsx",
    "fixtures/react-vite/src/cursor-render-count.tsx",
  ],
  StickerNavbar: [
    "fixtures/next-app/app/test-surfaces/navbar/navbar-surfaces.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerPeel: [
    "fixtures/next-app/app/test-surfaces/peel/peel-surfaces.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerStack: [
    "fixtures/next-app/app/test-surfaces/stack/stack-surfaces.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
  StickerTrail: [
    "fixtures/next-app/app/test-surfaces/trail/trail-surfaces.tsx",
    "fixtures/react-vite/src/App.tsx",
  ],
};

const expectedClientEntries = new Map([
  [".", false],
  ["./sticker", false],
  ["./sticker-badge", false],
  ["./sticker-button", false],
  ["./sticker-cursor", true],
  ["./sticker-navbar", true],
  ["./sticker-peel", true],
  ["./sticker-stack", true],
  ["./sticker-trail", true],
]);

function toPosix(value) {
  return value.replaceAll("\\", "/");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, stableJson(value));
}

function needsShell(command) {
  return process.platform === "win32" && !path.isAbsolute(command);
}

function shellArgs(command, args) {
  return needsShell(command)
    ? args.map((argument) =>
        /\s/u.test(argument) ? `"${argument}"` : argument,
      )
    : args;
}

async function runCaptured(command, args, options = {}) {
  let stdout = "";
  let stderr = "";
  const result = await new Promise((resolve, reject) => {
    const child = spawn(command, shellArgs(command, args), {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      shell: needsShell(command),
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      resolve({ code, signal, stderr, stdout }),
    );
  });
  if (options.allowFailure !== true && result.code !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.signal ?? result.code})\n${stderr}`,
    );
  }
  return result;
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    } else {
      const details = await stat(path.join(directory, entry.name));
      files.push({ bytes: details.size, path: relative });
    }
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function categoryFor(file) {
  if (file.endsWith(".d.ts")) return "declarationBytes";
  if (file.endsWith(".map")) return "mapBytes";
  if (file.endsWith(".js")) return "jsBytes";
  if (file.endsWith(".css")) return "cssBytes";
  if (/\.(?:png|svg|webp)$/u.test(file)) return "assetBytes";
  return "otherBytes";
}

function summarizeFiles(files, packedBytes) {
  const metrics = {
    assetBytes: 0,
    cssBytes: 0,
    declarationBytes: 0,
    fileCount: files.length,
    jsBytes: 0,
    mapBytes: 0,
    otherBytes: 0,
    packedBytes,
    unpackedBytes: 0,
  };
  for (const file of files) {
    metrics[categoryFor(file.path)] += file.bytes;
    metrics.unpackedBytes += file.bytes;
  }
  return metrics;
}

function firstStatement(source) {
  return source.trimStart().split("\n", 1)[0]?.trim() ?? "";
}

function assertDirective(source, expected, label) {
  const directive = /^(?:"use client"|'use client');?$/u;
  if (expected) {
    assert.match(firstStatement(source), directive, `${label} lost use client`);
  } else {
    assert.doesNotMatch(
      firstStatement(source),
      directive,
      `${label} unexpectedly became a client boundary`,
    );
  }
}

function patternMatcher(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/gu, "\\$&")
    .replaceAll("*", "[^/]+");
  return new RegExp(`^${escaped}$`, "u");
}

function wildcardCapture(pattern) {
  const [before, after] = pattern.split("*");
  assert.notEqual(after, undefined, `pattern ${pattern} has no wildcard`);
  const escape = (value) => value.replace(/[.+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`^${escape(before)}([^/]+)${escape(after)}$`, "u");
}

function targetsForExport(entry) {
  if (typeof entry === "string") return [entry];
  return Object.values(entry);
}

function collectTypeExports(source, file) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const names = new Set();
  for (const statement of sourceFile.statements) {
    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      names.add(statement.name.text);
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (statement.isTypeOnly || element.isTypeOnly) {
          names.add(element.name.text);
        }
      }
    }
  }
  return [...names].sort();
}

function publicSpecifier(packageName, exportPath) {
  return exportPath === "."
    ? packageName
    : `${packageName}${exportPath.slice(1)}`;
}

function isAbsoluteLeak(source) {
  return (
    source.includes(root) ||
    source.includes("/Users/") ||
    /[A-Za-z]:[\\/]Users[\\/]/u.test(source) ||
    source.includes("scout-pk-version")
  );
}

async function assertMaps(installed, files, name) {
  const paths = new Set(files.map((file) => file.path));
  for (const file of files) {
    if (file.path.endsWith(".js")) {
      assert.ok(
        paths.has(`${file.path}.map`),
        `${name} JavaScript entry ${file.path} has no source map`,
      );
    }
    if (file.path.endsWith(".d.ts")) {
      assert.ok(
        paths.has(`${file.path}.map`),
        `${name} declaration ${file.path} has no declaration map`,
      );
    }
    if (!file.path.endsWith(".map")) continue;
    const raw = await readFile(path.join(installed, file.path), "utf8");
    const map = JSON.parse(raw);
    assert.equal(
      map.version,
      3,
      `${name} ${file.path} has an invalid map version`,
    );
    assert.equal(
      isAbsoluteLeak(raw),
      false,
      `${name} ${file.path} leaks an absolute machine/repository path`,
    );
    for (const source of map.sources ?? []) {
      assert.equal(
        path.isAbsolute(source) || /^[A-Za-z]:[\\/]/u.test(source),
        false,
        `${name} ${file.path} contains absolute source ${source}`,
      );
    }
    if (file.path.endsWith(".d.ts.map") && (map.sources?.length ?? 0) > 0) {
      assert.equal(
        map.sourcesContent?.length,
        map.sources.length,
        `${name} ${file.path} must embed declaration sources for consumers`,
      );
    }
  }
}

function assertSafeFileNames(files, name) {
  const forbidden = [
    /(?:^|\/)\.env(?:\.|$)/u,
    /\.(?:key|pem)$/iu,
    /(?:^|\/)id_rsa[^/]*$/iu,
    /(?:^|\/)(?:credentials|secret|token)(?:[._-][^/]*)?$/iu,
  ];
  for (const file of files) {
    assert.equal(
      forbidden.some((pattern) => pattern.test(file.path)),
      false,
      `${name} tarball contains sensitive-looking file ${file.path}`,
    );
    assert.doesNotMatch(
      file.path,
      /(?:^|\/)(?:tests?|coverage|playwright-report|test-results|__screenshots__)(?:\/|$)/u,
      `${name} tarball contains repository test artifact ${file.path}`,
    );
    assert.doesNotMatch(
      file.path,
      /(?:^|\/)(?:source|scripts|\.github)(?:\/|$)/u,
      `${name} tarball contains repository-only source/tooling ${file.path}`,
    );
  }
}

async function emittedBareImports(installed, files) {
  const imports = new Set();
  const pattern = /(?:\bfrom\s*|\bimport\s*\()\s*["']([^"']+)["']/gu;
  for (const file of files.filter((entry) => entry.path.endsWith(".js"))) {
    const source = await readFile(path.join(installed, file.path), "utf8");
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (
        specifier !== undefined &&
        !specifier.startsWith(".") &&
        !specifier.startsWith("/") &&
        !specifier.startsWith("node:")
      ) {
        imports.add(specifier);
      }
    }
  }
  return [...imports].sort();
}

function dependencyName(specifier) {
  if (specifier.startsWith("@"))
    return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/", 1)[0];
}

function assertDependencyClosure(imports, manifest) {
  const allowed = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  for (const specifier of imports) {
    const dependency = dependencyName(specifier);
    assert.ok(
      allowed.has(dependency),
      `${manifest.name} emits bare import ${specifier}, but ${dependency} is not a dependency or peer`,
    );
  }
}

async function validateExportTargets(installed, files, manifest) {
  const paths = new Set(files.map((file) => file.path));
  for (const [exportPath, entry] of Object.entries(manifest.exports)) {
    const targets = targetsForExport(entry);
    if (typeof entry === "object" && exportPath !== "./package.json") {
      assert.ok(
        typeof entry.import === "string" || typeof entry.types === "string",
        `${manifest.name} ${exportPath} has no import/types condition`,
      );
      if (typeof entry.import === "string") {
        assert.equal(
          typeof entry.types,
          "string",
          `${manifest.name} ${exportPath} needs a types target beside import`,
        );
      }
    }
    for (const target of targets) {
      assert.ok(
        target.startsWith("./"),
        `${manifest.name} ${exportPath} target ${target} must be package-relative`,
      );
      assert.doesNotMatch(
        target,
        /(?:^|\/)\.\.(?:\/|$)|(?:^|\/)src(?:\/|$)/u,
        `${manifest.name} ${exportPath} exposes source or escapes package root`,
      );
      const normalized = target.slice(2);
      if (normalized.includes("*")) {
        assert.ok(
          files.some((file) => patternMatcher(normalized).test(file.path)),
          `${manifest.name} ${exportPath} wildcard target ${target} matches no packed file`,
        );
      } else {
        assert.ok(
          paths.has(normalized),
          `${manifest.name} ${exportPath} target ${target} is absent from tarball`,
        );
      }
    }
  }
}

async function buildApiEntry(installed, packageName, exportPath, entry, files) {
  if (typeof entry === "string") {
    const classification = entry.endsWith(".css")
      ? "css"
      : /\.(?:json|png|svg|webp)$/u.test(entry)
        ? "asset-or-metadata"
        : "metadata";
    return { classification, target: entry };
  }
  if (typeof entry.import !== "string") {
    return { classification: "metadata", target: entry.types };
  }
  const importTarget = entry.import.slice(2);
  if (importTarget.includes("*")) {
    const matcher = patternMatcher(importTarget);
    const capture = wildcardCapture(importTarget);
    const members = files
      .filter((file) => matcher.test(file.path))
      .map((file) => file.path.match(capture)?.[1])
      .filter((member) => member !== undefined)
      .sort();
    return {
      classification: "javascript-pattern",
      importTarget: entry.import,
      members,
      typesTarget: entry.types,
    };
  }
  const module = await import(
    pathToFileURL(path.join(installed, importTarget)).href
  );
  const typesTarget = entry.types.slice(2);
  const typeSource = await readFile(path.join(installed, typesTarget), "utf8");
  return {
    classification: "javascript",
    importTarget: entry.import,
    runtimeExports: Object.keys(module).sort(),
    specifier: publicSpecifier(packageName, exportPath),
    typeExports: collectTypeExports(typeSource, typesTarget),
    typesTarget: entry.types,
  };
}

async function inspectPackage(record, packedManifest) {
  const installed = path.join(
    packedManifest.consumers.next,
    "node_modules",
    ...record.name.split("/"),
  );
  const manifest = await readJson(path.join(installed, "package.json"));
  const files = await listFiles(installed);
  const packedBytes = (await stat(packedManifest.tarballs[record.key])).size;
  const metrics = summarizeFiles(files, packedBytes);

  assert.equal(manifest.name, record.name);
  assert.equal(manifest.type, "module", `${record.name} must remain ESM-only`);
  assert.equal(
    manifest.private,
    true,
    `${record.name} release protection changed`,
  );
  assert.equal(
    manifest.main,
    undefined,
    `${record.name} gained a CommonJS main`,
  );
  assert.equal(
    manifest.module,
    undefined,
    `${record.name} must use exports, not module`,
  );
  assertSafeFileNames(files, record.name);
  await validateExportTargets(installed, files, manifest);
  await assertMaps(installed, files, record.name);

  const allText = (
    await Promise.all(
      files
        .filter((file) => /\.(?:css|d\.ts|js|json|md|map)$/u.test(file.path))
        .map((file) => readFile(path.join(installed, file.path), "utf8")),
    )
  ).join("\n");
  assert.equal(
    isAbsoluteLeak(allText),
    false,
    `${record.name} tarball leaks a local machine/repository path`,
  );
  const runtimeText = (
    await Promise.all(
      files
        .filter((file) => /\.(?:css|js|json|map)$/u.test(file.path))
        .map((file) => readFile(path.join(installed, file.path), "utf8")),
    )
  ).join("\n");
  assert.doesNotMatch(
    runtimeText,
    /(?:\.\.\/)+scout-in|scout-in\/(?:app|src|public)/u,
    `${record.name} tarball contains Scout product source references`,
  );

  const lifecycleScripts = [
    "install",
    "postinstall",
    "postpack",
    "postpublish",
    "preinstall",
    "prepack",
    "prepare",
    "prepublish",
  ];
  for (const script of lifecycleScripts) {
    assert.equal(
      manifest.scripts?.[script],
      undefined,
      `${record.name} ships consumer lifecycle script ${script}`,
    );
  }

  const bareImports = await emittedBareImports(installed, files);
  assertDependencyClosure(bareImports, manifest);

  const exportInventory = {};
  for (const [exportPath, entry] of Object.entries(manifest.exports)) {
    exportInventory[exportPath] = await buildApiEntry(
      installed,
      record.name,
      exportPath,
      entry,
      files,
    );
  }

  return {
    bareImports,
    exportInventory,
    files,
    installed,
    manifest,
    metrics,
    topFiles: [...files]
      .sort((left, right) => right.bytes - left.bytes)
      .slice(0, 10),
  };
}

async function assertPackageGraph(inspections) {
  const packageDirectories = await readdir(path.join(root, "packages"), {
    withFileTypes: true,
  });
  const publicNames = [];
  for (const directory of packageDirectories.filter((entry) =>
    entry.isDirectory(),
  )) {
    const manifest = await readJson(
      path.join(root, "packages", directory.name, "package.json"),
    );
    publicNames.push(manifest.name);
  }
  assert.deepEqual(
    publicNames.sort(),
    records.map((record) => record.name).sort(),
    "packages/ must contain exactly the three approved public packages",
  );

  const react = inspections.react.manifest;
  assert.deepEqual(Object.keys(react.dependencies ?? {}).sort(), [
    "@radix-ui/react-dialog",
    "@scout-ui/sticker-trail",
  ]);
  assert.deepEqual(Object.keys(react.peerDependencies ?? {}).sort(), [
    "react",
    "react-dom",
  ]);
  assert.equal(react.peerDependencies.react, "^19.0.0");
  assert.equal(react.peerDependencies["react-dom"], "^19.0.0");
  assert.equal(react.dependencies["@radix-ui/react-dialog"], "1.1.23");
  assert.equal(react.dependencies["@scout-ui/sticker-trail"], "0.0.0");
  assert.equal(react.dependencies["@scout-ui/stickers"], undefined);

  const trail = inspections["sticker-trail"].manifest;
  assert.deepEqual(Object.keys(trail.dependencies ?? {}), []);
  assert.deepEqual(Object.keys(trail.peerDependencies ?? {}), ["react"]);
  assert.equal(trail.peerDependencies.react, "^19.0.0");
  assert.equal(trail.dependencies?.["@scout-ui/stickers"], undefined);

  const stickers = inspections.stickers.manifest;
  assert.deepEqual(Object.keys(stickers.dependencies ?? {}), []);
  assert.deepEqual(Object.keys(stickers.peerDependencies ?? {}), []);
  assert.deepEqual(Object.keys(stickers.optionalDependencies ?? {}), []);

  const stickerSources = (
    await Promise.all(
      (await listFiles(path.join(root, "packages", "stickers")))
        .filter((file) => /\.(?:js|mjs|ts|tsx|json)$/u.test(file.path))
        .map((file) =>
          readFile(path.join(root, "packages", "stickers", file.path), "utf8"),
        ),
    )
  ).join("\n");
  assert.doesNotMatch(
    stickerSources,
    /\bfrom\s+["']react(?:-dom)?(?:\/[^"']*)?["']|\brequire\(["']react/u,
    "@scout-ui/stickers source contains React code",
  );

  const reactOutput = (
    await Promise.all(
      inspections.react.files
        .filter((file) => file.path.endsWith(".js"))
        .map((file) =>
          readFile(path.join(inspections.react.installed, file.path), "utf8"),
        ),
    )
  ).join("\n");
  assert.doesNotMatch(
    reactOutput,
    /officialStickerPack|stickerDefinitions|scout-ui-official-v0-1|wonky-star/u,
    "@scout-ui/react embeds the official sticker pack",
  );
  const trailOutput = (
    await Promise.all(
      inspections["sticker-trail"].files
        .filter((file) => file.path.endsWith(".js"))
        .map((file) =>
          readFile(
            path.join(inspections["sticker-trail"].installed, file.path),
            "utf8",
          ),
        ),
    )
  ).join("\n");
  assert.doesNotMatch(
    trailOutput,
    /officialStickerPack|stickerDefinitions|scout-ui-official-v0-1|wonky-star/u,
    "@scout-ui/sticker-trail embeds the official sticker pack",
  );
}

async function assertReactBoundaries(inspections) {
  const react = inspections.react;
  for (const [exportPath, expected] of expectedClientEntries) {
    const target = react.manifest.exports[exportPath].import.slice(2);
    const source = await readFile(path.join(react.installed, target), "utf8");
    assertDirective(source, expected, `@scout-ui/react${exportPath.slice(1)}`);
  }
  const trailTarget =
    inspections["sticker-trail"].manifest.exports["."].import.slice(2);
  assertDirective(
    await readFile(
      path.join(inspections["sticker-trail"].installed, trailTarget),
      "utf8",
    ),
    true,
    "@scout-ui/sticker-trail",
  );
  const sourceRoot = await readFile(
    path.join(root, "packages/react/src/index.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    sourceRoot,
    /export\s+\*/u,
    "React root must use explicit exports",
  );
  assert.match(
    sourceRoot,
    /export \{ StickerTrail, useStickerTrail \} from "\.\/sticker-trail\/index\.js";/u,
    "React root lost explicit Trail values",
  );
}

async function assertReadmes(inspections) {
  const requirements = {
    react: [
      "npm install @scout-ui/react react react-dom",
      'import "@scout-ui/react/styles.css"',
      "@scout-ui/react/sticker-navbar",
    ],
    "sticker-trail": [
      "npm install @scout-ui/sticker-trail react",
      'import "@scout-ui/sticker-trail/styles.css"',
    ],
    stickers: [
      "npm install @scout-ui/stickers",
      "@scout-ui/stickers/definitions/wonky-star",
      "@scout-ui/stickers/assets/wonky-star.svg",
    ],
  };
  for (const record of records) {
    const readme = await readFile(
      path.join(root, record.sourceDirectory, "README.md"),
      "utf8",
    );
    for (const expected of requirements[record.key]) {
      assert.ok(
        readme.includes(expected),
        `${record.name} README is missing canonical example: ${expected}`,
      );
    }
    assert.doesNotMatch(
      readme,
      /(?:\.\.\/)+packages\/|@scout-ui\/[^"'\s]+\/(?:src|dist)\//u,
      `${record.name} README refers to repository-private paths`,
    );
    for (const match of readme.matchAll(
      /@scout-ui\/[a-z-]+(?:\/[a-z0-9*.-]+)*/gu,
    )) {
      const specifier = match[0];
      const packageRecord = records.find(
        (candidate) =>
          specifier === candidate.name ||
          specifier.startsWith(`${candidate.name}/`),
      );
      assert.ok(
        packageRecord,
        `${record.name} README uses unknown package ${specifier}`,
      );
      const suffix = specifier.slice(packageRecord.name.length);
      const exportPath = suffix === "" ? "." : `.${suffix}`;
      const exports = inspections[packageRecord.key].manifest.exports;
      assert.ok(
        Object.keys(exports).some((candidate) =>
          candidate.includes("*")
            ? patternMatcher(candidate).test(exportPath)
            : candidate === exportPath,
        ),
        `${record.name} README uses unsupported import ${specifier}`,
      );
    }
  }
}

async function assertFixtureReview() {
  for (const [component, files] of Object.entries(componentFixtureReview)) {
    for (const file of files) {
      const source = await readFile(path.join(root, file), "utf8");
      assert.ok(
        source.includes(component),
        `${component} fixture review path ${file} no longer exercises the component`,
      );
      assert.match(
        source,
        /@scout-ui\/react/u,
        `${component} fixture ${file} must use a public React package import`,
      );
    }
  }
}

async function assertBrowserMatrix() {
  const config = await readFile(
    path.join(root, "playwright.config.ts"),
    "utf8",
  );
  for (const marker of [
    "chromium-desktop",
    "firefox-desktop",
    "webkit-desktop",
    "chromium-reduced-motion",
    "chromium-coarse-pointer",
    "chromium-forced-colors",
    "webkit-mobile",
  ]) {
    assert.ok(config.includes(marker), `browser support matrix lost ${marker}`);
  }
}

async function assertUnsupportedDeepImports(consumer) {
  const script = `
    const blocked = [
      "@scout-ui/react/dist/index.js",
      "@scout-ui/react/src/index.ts",
      "@scout-ui/sticker-trail/dist/engine.js",
      "@scout-ui/stickers/src/types.ts",
    ];
    for (const specifier of blocked) {
      try {
        await import(specifier);
        throw new Error(specifier + " unexpectedly resolved");
      } catch (error) {
        if (error.message.endsWith("unexpectedly resolved")) throw error;
        if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error;
      }
    }
  `;
  await runCaptured(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      cwd: consumer,
    },
  );
}

async function assertMissingPeerFailure(packedManifest) {
  const directory = path.join(artifactDirectory, "missing-peer");
  await rm(directory, { force: true, recursive: true });
  await mkdir(directory, { recursive: true });
  const tarball = toPosix(packedManifest.tarballs["sticker-trail"]);
  await writeJson(path.join(directory, "package.json"), {
    dependencies: { "@scout-ui/sticker-trail": `file:${tarball}` },
    name: "scout-ui-missing-peer-proof",
    private: true,
    version: "0.0.0",
  });
  await writeFile(
    path.join(directory, "pnpm-workspace.yaml"),
    'packages:\n  - "."\nautoInstallPeers: false\nstrictPeerDependencies: true\n',
  );
  const result = await runCaptured(
    "corepack",
    ["pnpm", "install", "--offline"],
    { allowFailure: true, cwd: directory },
  );
  assert.notEqual(
    result.code,
    0,
    "missing React peer unexpectedly installed cleanly",
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /peer dependenc|ERR_PNPM_PEER_DEP_ISSUES/iu,
    "missing-peer install failed for an unrelated reason",
  );
}

async function assertStickersAgreement(inspection) {
  const manifest = await readJson(
    path.join(inspection.installed, "assets/manifest.json"),
  );
  const ids = manifest.stickers.map((sticker) => sticker.id).sort();
  const assetIds = inspection.files
    .filter((file) => /^assets\/[^/]+\.(?:png|svg|webp)$/u.test(file.path))
    .map((file) => path.basename(file.path, path.extname(file.path)))
    .sort();
  const definitionIds = inspection.files
    .filter((file) => /^dist\/definitions\/[^/]+\.js$/u.test(file.path))
    .map((file) => path.basename(file.path, ".js"))
    .sort();
  assert.deepEqual(
    assetIds,
    ids,
    "stickers tarball assets do not match manifest IDs",
  );
  assert.deepEqual(
    definitionIds,
    ids,
    "stickers tarball definitions do not match manifest IDs",
  );
  assert.equal(manifest.artworkLicense, "CC0-1.0");
  assert.ok(inspection.files.some((file) => file.path === "LICENSE-ASSETS.md"));
  assert.ok(inspection.files.some((file) => file.path === "ATTRIBUTION.md"));
}

function contentSnapshot(inspections) {
  return {
    packages: Object.fromEntries(
      records.map((record) => [
        record.name,
        inspections[record.key].files.map((file) => file.path),
      ]),
    ),
    schemaVersion: 1,
  };
}

function apiSnapshot(inspections) {
  return {
    baseline: {
      commit: baselineCommit,
      milestone: 11,
      release: "v0.1-alpha",
    },
    components: Object.keys(componentFixtureReview),
    packages: Object.fromEntries(
      records.map((record) => [
        record.name,
        {
          exportPaths: inspections[record.key].exportInventory,
          purpose: record.purpose,
        },
      ]),
    ),
    policy: {
      deepImports: "Only package.json exports are supported.",
      postFreeze:
        "Public API change requires authoritative specification update, Changeset, and intentional public-api snapshot update.",
      trailBoundary:
        "@scout-ui/react explicitly re-exports Trail values and Trail-specific types; generic structural types remain owned independently by each package.",
    },
    schemaVersion: 1,
  };
}

function headroom(value, ratio = 0.08, minimum = 512) {
  return Math.max(Math.ceil(value * ratio), minimum);
}

function sizeSnapshot(inspections, bundleProbes) {
  return {
    baseline: {
      commit: baselineCommit,
      milestone: 11,
      note: "Regression baselines for local packed artifacts and isolated Vite probes; not universal application sizes.",
    },
    bundleProbes: Object.fromEntries(
      Object.entries(bundleProbes).map(([name, metrics]) => [
        name,
        {
          baseline: metrics,
          budget: {
            gzipBytes: metrics.gzipBytes + headroom(metrics.gzipBytes),
            rawBytes: metrics.rawBytes + headroom(metrics.rawBytes),
          },
        },
      ]),
    ),
    methodology: {
      bundle:
        "Vite ESM library probes from tarball-installed packages; raw and deterministic gzip bytes measured separately.",
      package:
        "pnpm pack tarball bytes plus byte totals from the actual isolated installed tarball contents.",
    },
    packages: Object.fromEntries(
      records.map((record) => {
        const metrics = inspections[record.key].metrics;
        return [
          record.name,
          {
            baseline: metrics,
            budget: {
              packedBytes:
                metrics.packedBytes + headroom(metrics.packedBytes, 0.08, 2048),
              unpackedBytes:
                metrics.unpackedBytes +
                headroom(metrics.unpackedBytes, 0.08, 4096),
            },
            largestFiles: inspections[record.key].topFiles,
          },
        ];
      }),
    ),
    schemaVersion: 1,
  };
}

async function compareOrUpdate(file, value, label) {
  if (update) {
    await writeJson(file, value);
    return;
  }
  const expected = await readJson(file);
  assert.deepEqual(
    value,
    expected,
    `${label} changed. Review the diff, then run pnpm test:packages:update intentionally.`,
  );
}

async function assertBudgets(inspections, bundleProbes) {
  const snapshot = await readJson(budgetSnapshotPath);
  for (const record of records) {
    const actual = inspections[record.key].metrics;
    const budget = snapshot.packages[record.name].budget;
    for (const metric of ["packedBytes", "unpackedBytes"]) {
      assert.ok(
        actual[metric] <= budget[metric],
        `${record.name} ${metric} ${actual[metric]} B exceeds budget ${budget[metric]} B`,
      );
    }
  }
  for (const [name, actual] of Object.entries(bundleProbes)) {
    const budget = snapshot.bundleProbes[name].budget;
    for (const metric of ["rawBytes", "gzipBytes"]) {
      assert.ok(
        actual[metric] <= budget[metric],
        `${name} ${metric} ${actual[metric]} B exceeds budget ${budget[metric]} B`,
      );
    }
  }
}

async function main() {
  await rm(artifactDirectory, { force: true, recursive: true });
  await mkdir(artifactDirectory, { recursive: true });
  const packedManifest = await preparePackedConsumers();
  const inspections = {};
  for (const record of records) {
    inspections[record.key] = await inspectPackage(record, packedManifest);
  }

  await assertPackageGraph(inspections);
  await assertReactBoundaries(inspections);
  await assertReadmes(inspections);
  await assertFixtureReview();
  await assertBrowserMatrix();
  await assertUnsupportedDeepImports(packedManifest.consumers.next);
  await assertMissingPeerFailure(packedManifest);
  await assertStickersAgreement(inspections.stickers);

  const contents = contentSnapshot(inspections);
  const api = apiSnapshot(inspections);
  const sizes = sizeSnapshot(inspections, packedManifest.bundleProbes);
  await compareOrUpdate(
    contentSnapshotPath,
    contents,
    "Tarball content snapshot",
  );
  await compareOrUpdate(apiSnapshotPath, api, "v0.1 alpha public API snapshot");
  if (update) await writeJson(budgetSnapshotPath, sizes);
  await assertBudgets(inspections, packedManifest.bundleProbes);

  const report = {
    apiSnapshot: toPosix(path.relative(root, apiSnapshotPath)),
    baselineCommit,
    browserSupport: {
      chromium: true,
      coarsePointer: true,
      firefox: true,
      forcedColors: true,
      reducedMotion: true,
      webkitSafariRepresentation: true,
    },
    bundleProbes: packedManifest.bundleProbes,
    fixtureReview: componentFixtureReview,
    packages: Object.fromEntries(
      records.map((record) => {
        const inspection = inspections[record.key];
        return [
          record.name,
          {
            bareRuntimeImports: inspection.bareImports,
            dependencies: inspection.manifest.dependencies ?? {},
            exportCount: Object.keys(inspection.manifest.exports).length,
            fileCount: inspection.metrics.fileCount,
            metrics: inspection.metrics,
            peerDependencies: inspection.manifest.peerDependencies ?? {},
            private: inspection.manifest.private,
            purpose: record.purpose,
            topFiles: inspection.topFiles,
            version: inspection.manifest.version,
          },
        ];
      }),
    ),
    schemaVersion: 1,
    snapshots: {
      api: toPosix(path.relative(root, apiSnapshotPath)),
      contents: toPosix(path.relative(root, contentSnapshotPath)),
      sizes: toPosix(path.relative(root, budgetSnapshotPath)),
    },
  };
  await writeJson(path.join(artifactDirectory, "report.json"), report);
  process.stdout.write(
    `Scout UI package preflight PASS (${update ? "snapshots updated" : "snapshots verified"})\n`,
  );
}

await main();
