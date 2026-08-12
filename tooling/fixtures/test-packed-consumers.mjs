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

/**
 * On Windows the toolchain entry points are `.cmd` shims, which `spawn` cannot
 * resolve without a shell. An absolute path — the Node binary — is a real
 * executable and must bypass the shell, because routing it through cmd.exe
 * would mangle multi-line `--eval` scripts.
 */
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

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, shellArgs(command, args), {
      cwd: options.cwd ?? root,
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

async function runCaptured(command, args, options = {}) {
  let stdout = "";
  let stderr = "";
  return await new Promise((resolve, reject) => {
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
      "./sticker-badge",
      "./sticker-button",
      "./sticker-trail",
      "./styles.css",
    ],
    "sticker-trail": [".", "./package.json", "./styles.css"],
    stickers: [
      ".",
      "./assets/*.png",
      "./assets/*.svg",
      "./assets/*.webp",
      "./definitions/*",
      "./manifest",
      "./manifest.json",
      "./package.json",
    ],
  };
  assert.deepEqual(
    Object.keys(manifest.exports).sort(),
    expectedExports[record.slug],
    `${record.name} exports map changed unexpectedly`,
  );
  if (record.slug === "stickers") {
    assert.equal(manifest.dependencies?.react, undefined);
    assert.equal(manifest.peerDependencies?.react, undefined);
    assert.equal(manifest.optionalDependencies?.react, undefined);
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
    assert.deepEqual(Object.keys(manifest.peerDependencies ?? {}), []);
    assert.deepEqual(Object.keys(manifest.optionalDependencies ?? {}), []);
    assert.ok(files.includes("ART_DIRECTION.md"));
    assert.ok(files.includes("CONTRIBUTING_ASSETS.md"));
    assert.ok(files.includes("assets/manifest.json"));
    assert.equal(
      files.filter(
        (file) => file.startsWith("assets/") && file.endsWith(".svg"),
      ).length,
      25,
    );
    assert.equal(
      files.filter(
        (file) => file.startsWith("dist/definitions/") && file.endsWith(".js"),
      ).length,
      25,
    );
    const assetManifest = JSON.parse(
      await readFile(path.join(installed, "assets", "manifest.json"), "utf8"),
    );
    assert.equal(assetManifest.artworkLicense, "CC0-1.0");
    assert.equal(assetManifest.stickers.length, 25);
    assert.equal(
      new Set(assetManifest.stickers.map(({ checksum }) => checksum)).size,
      25,
    );
  } else if (record.slug === "sticker-trail") {
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
    assert.deepEqual(Object.keys(manifest.peerDependencies ?? {}).sort(), [
      "react",
    ]);
    assert.equal(
      manifest.dependencies?.["@scout-ui/react"],
      undefined,
      "the standalone package must never depend on the broad package",
    );
    assert.equal(manifest.dependencies?.["@scout-ui/stickers"], undefined);
    for (const emitted of [
      "dist/StickerTrail.js",
      "dist/StickerTrail.d.ts",
      "dist/engine.js",
      "dist/geometry.js",
      "dist/pool.js",
      "dist/presets.js",
      "dist/sequence.js",
      "dist/types.d.ts",
      "dist/useStickerTrail.js",
      "dist/useStickerTrail.d.ts",
    ]) {
      assert.ok(files.includes(emitted), `missing ${emitted} in tarball`);
    }
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
      !["node_modules", ".next"].includes(path.basename(sourcePath)) &&
      !path.basename(sourcePath).startsWith("dist"),
    recursive: true,
  });
  await assertFixtureImports(destination);

  // Backslashes are an escape sequence inside double-quoted YAML and would
  // corrupt the generated workspace file on Windows.
  const specifier = (tarball) => `file:${tarball.replaceAll("\\", "/")}`;

  const manifestPath = path.join(destination, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.dependencies = {
    ...manifest.dependencies,
    "@scout-ui/react": specifier(tarballs.react),
    "@scout-ui/sticker-trail": specifier(tarballs["sticker-trail"]),
    "@scout-ui/stickers": specifier(tarballs.stickers),
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(destination, "pnpm-workspace.yaml"),
    `packages:\n  - "."\noverrides:\n  "@scout-ui/sticker-trail": "${specifier(tarballs["sticker-trail"])}"\n`,
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

function normalizeCss(source) {
  return source.replace(/\r\n/gu, "\n").trim();
}

function stripLayerOrderStatement(source) {
  return source.replace(/^@layer\s+[^;{]+;\s*/mu, "").trim();
}

/**
 * Decision C: Trail rules are authored once, in the standalone package, and
 * composed into the broad stylesheet at build time. These assertions verify
 * the whole contract against the installed tarballs.
 */
async function assertStylesheetComposition(consumer) {
  const trailCss = normalizeCss(
    await readFile(
      path.join(
        consumer,
        "node_modules",
        "@scout-ui",
        "sticker-trail",
        "dist",
        "styles.css",
      ),
      "utf8",
    ),
  );
  const reactCss = normalizeCss(
    await readFile(
      path.join(
        consumer,
        "node_modules",
        "@scout-ui",
        "react",
        "dist",
        "styles.css",
      ),
      "utf8",
    ),
  );

  // 1. The standalone stylesheet stands on its own: it declares the cascade
  //    layer order itself and never depends on the broad token layer.
  assert.match(
    trailCss,
    /^@layer scout-ui\.tokens, scout-ui\.base, scout-ui\.components, scout-ui\.utilities;/mu,
    "standalone Trail CSS must establish the cascade layer order itself",
  );
  assert.match(trailCss, /\.sui-trail-layer\s*\{/u);
  assert.match(trailCss, /\.sui-trail-item\s*\{/u);
  assert.match(
    trailCss,
    /z-index:\s*var\(--sui-trail-layer,\s*60\)/u,
    "standalone Trail CSS must supply token fallbacks",
  );
  assert.doesNotMatch(
    trailCss,
    /--sui-paper|--sui-ink:/u,
    "standalone Trail CSS must not carry the broad token layer",
  );

  // 2. The broad stylesheet contains the Trail rules.
  const trailBody = stripLayerOrderStatement(trailCss);
  assert.ok(trailBody.length > 0, "Trail stylesheet produced no rules");
  assert.ok(
    reactCss.includes(trailBody),
    "broad React CSS must contain the authored Trail rules verbatim",
  );

  // 3. Exactly once — byte-for-byte, not merely "a trail selector appears".
  assert.equal(
    reactCss.split(trailBody).length - 1,
    1,
    "broad React CSS must contain the Trail rules exactly once",
  );
  assert.equal(
    [...reactCss.matchAll(/\.sui-trail-item\[data-active="true"\]/gu)].length,
    1,
    "duplicate Trail rules detected in the broad stylesheet",
  );

  // 4. The broad stylesheet keeps its own layers and order statement.
  assert.match(
    reactCss,
    /^@layer scout-ui\.tokens, scout-ui\.base, scout-ui\.components, scout-ui\.utilities;/mu,
  );
  assert.equal(
    [...reactCss.matchAll(/^@layer scout-ui\.tokens,/gmu)].length,
    1,
    "composition must not repeat the cascade layer order statement",
  );
  assert.match(reactCss, /--sui-paper:/u);
  assert.match(reactCss, /\.sui-sticker-button/u);

  // 5. The composed section is marked so its single source is discoverable.
  assert.match(reactCss, /Scout UI composed section, authored once in/u);
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
      path.join(reactDirectory, "sticker-badge", "index.js"),
      "utf8",
    ),
    false,
    "StickerBadge leaf",
  );
  assertDirective(
    await readFile(
      path.join(reactDirectory, "sticker-button", "index.js"),
      "utf8",
    ),
    false,
    "StickerButton leaf",
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

  // Preserved modules: the client entry must not have been flattened, and the
  // engine must remain a separate module below the boundary.
  for (const file of [
    "StickerTrail.js",
    "engine.js",
    "geometry.js",
    "pool.js",
    "presets.js",
    "sequence.js",
    "useStickerTrail.js",
  ]) {
    await readFile(path.join(trailDirectory, file), "utf8");
  }

  const trailRoot = await readFile(
    path.join(trailDirectory, "index.js"),
    "utf8",
  );
  assert.match(
    trailRoot,
    /from ["']\.\/StickerTrail\.js["']/u,
    "standalone root must re-export preserved leaf modules rather than inline them",
  );
  assert.doesNotMatch(
    trailRoot,
    /createStickerTrailEngine|planSegmentSpawns/u,
    "standalone root must not inline the engine into the client entry",
  );

  const reactTrailLeaf = await readFile(
    path.join(reactDirectory, "sticker-trail", "index.js"),
    "utf8",
  );
  assert.match(
    reactTrailLeaf,
    /from ["']@scout-ui\/sticker-trail["']/u,
    "the React trail leaf must re-export the standalone package, not copy it",
  );
}

async function assertServerEvaluation(consumer) {
  const script = `
    const { readFile } = await import("node:fs/promises");
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    if (typeof window !== "undefined") throw new Error("window leaked into server evaluation");
    const root = await import("@scout-ui/react");
    const sticker = await import("@scout-ui/react/sticker");
    const badge = await import("@scout-ui/react/sticker-badge");
    const button = await import("@scout-ui/react/sticker-button");
    const reactTrail = await import("@scout-ui/react/sticker-trail");
    const standaloneTrail = await import("@scout-ui/sticker-trail");
    const stickers = await import("@scout-ui/stickers");
    const star = await import("@scout-ui/stickers/definitions/wonky-star");
    if (root.scoutUiReactVersion !== "0.0.0" || typeof sticker.Sticker !== "function" || typeof badge.StickerBadge !== "function" || typeof button.StickerButton !== "function" || stickers.stickerPackVersion !== "0.0.0" || stickers.stickerDefinitions.length !== 25 || star.wonkyStar.id !== "wonky-star") process.exit(2);

    // Trail is importable on a server from every documented path, and the
    // milestone-2 sentinel is gone from all of them.
    for (const module of [root, reactTrail, standaloneTrail]) {
      if (typeof module.StickerTrail !== "function") process.exit(5);
      if (typeof module.useStickerTrail !== "function") process.exit(6);
      if ("stickerTrailVersion" in module) process.exit(7);
    }

    // Server rendering emits a deterministic inert pool with no image source.
    const trailMarkup = renderToStaticMarkup(createElement(standaloneTrail.StickerTrail, { stickers: [star.wonkyStar], maxActive: 9, seed: "ssr" }));
    const slotCount = trailMarkup.split("data-sui-trail-slot").length - 1;
    if (slotCount !== 9) process.exit(8);
    if (trailMarkup.includes("src=")) process.exit(9);
    if (!trailMarkup.includes('aria-hidden="true"')) process.exit(10);
    // Identical props must produce identical markup, or hydration would break.
    const repeat = renderToStaticMarkup(createElement(standaloneTrail.StickerTrail, { stickers: [star.wonkyStar], maxActive: 9, seed: "ssr" }));
    if (repeat !== trailMarkup) process.exit(11);
    // A clamped request still yields a stable, bounded pool.
    const clamped = renderToStaticMarkup(createElement(standaloneTrail.StickerTrail, { stickers: [star.wonkyStar], maxActive: 100000 }));
    if (clamped.split("data-sui-trail-slot").length - 1 !== 48) process.exit(12);

    const markup = renderToStaticMarkup(createElement(sticker.Sticker, { source: star.wonkyStar }));
    if (!markup.includes('data-outline="none"') || !markup.startsWith("<link") && !markup.startsWith("<span")) process.exit(4);
    const asset = await readFile(new URL(star.wonkyStar.src));
    if (!asset.toString("utf8").startsWith("<svg")) process.exit(3);
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
  assert.match(source, /sui-sticker/u);
  assert.doesNotMatch(
    source,
    /scoutUiReactVersion|sticker-trail|sui-sticker-button|sui-sticker-badge/u,
    "Sticker-only Vite build retained unused package leaves",
  );

  const stickerFiles = await listFiles(
    path.join(viteConsumer, "dist-sticker-tree-shake"),
  );
  const stickerOutput = (
    await Promise.all(
      stickerFiles
        .filter((file) => file.endsWith(".js"))
        .map((file) =>
          readFile(
            path.join(viteConsumer, "dist-sticker-tree-shake", file),
            "utf8",
          ),
        ),
    )
  ).join("\n");
  assert.match(stickerOutput, /0\.0\.0/u);
  assert.match(stickerOutput, /wonky-star/u);
  assert.doesNotMatch(
    stickerOutput,
    /sparkle-pop|radial-burst|officialStickerPack/u,
    "single definition build retained the full sticker manifest",
  );
  const emittedSvgCount = stickerFiles.filter((file) =>
    file.endsWith(".svg"),
  ).length;
  const inlinedSvgCount =
    stickerOutput.match(/data:image\/svg\+xml/gu)?.length ?? 0;
  assert.equal(
    emittedSvgCount + inlinedSvgCount,
    1,
    "single definition build must contain exactly one emitted or inlined SVG",
  );
}

/**
 * The standalone consumer page is built into its own output directory, so its
 * bundle can be inspected in isolation: a standalone install must never need
 * @scout-ui/react or @scout-ui/stickers.
 */
async function assertStandaloneIndependence(viteConsumer) {
  const directory = path.join(viteConsumer, "dist", "standalone");
  const files = await listFiles(directory);
  assert.ok(
    files.some((file) => file.endsWith("standalone-trail.html")),
    "standalone consumer page was not built",
  );

  const scripts = files.filter((file) => file.endsWith(".js"));
  assert.ok(scripts.length > 0, "standalone bundle emitted no JavaScript");
  const source = (
    await Promise.all(
      scripts.map((file) => readFile(path.join(directory, file), "utf8")),
    )
  ).join("\n");

  assert.match(
    source,
    /sui-trail/u,
    "standalone bundle lost the Trail runtime",
  );
  assert.doesNotMatch(
    source,
    /sui-sticker-button|sui-sticker-badge|scoutUiReactVersion|officialStickerPack/u,
    "standalone bundle pulled in the broad React package or the sticker pack",
  );

  const stylesheets = files.filter((file) => file.endsWith(".css"));
  assert.ok(stylesheets.length > 0, "standalone page emitted no stylesheet");
  const css = (
    await Promise.all(
      stylesheets.map((file) => readFile(path.join(directory, file), "utf8")),
    )
  ).join("\n");

  assert.match(
    css,
    /\.sui-trail-item/u,
    "standalone page must carry the Trail stylesheet on its own",
  );
  assert.doesNotMatch(
    css,
    /--sui-paper:|\.sui-sticker-button/u,
    "standalone page must not require the broad stylesheet",
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

  // One dependency-ordered build. Building each package in isolation is not
  // safe: @scout-ui/react resolves the standalone package's declarations and
  // composes its stylesheet, so the trail package must be built first.
  await run("corepack", ["pnpm", "build"]);

  for (const record of packageRecords) {
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
  await assertStylesheetComposition(consumers.next);
  await assertServerEvaluation(consumers.next);
  await assertServerEvaluation(consumers.vite);
  // Build first: the committed `next-env.d.ts` references generated route
  // types, so a typecheck of a clean copy only resolves after Next has emitted
  // them. Typechecking afterwards still validates the packed public API.
  await run("corepack", ["pnpm", "fixture:build"], { cwd: consumers.next });
  await run("corepack", ["pnpm", "fixture:typecheck"], { cwd: consumers.next });
  await assertNextServerOutput(consumers.next);
  await run("corepack", ["pnpm", "fixture:build"], { cwd: consumers.vite });
  await assertTreeShaking(consumers.vite);
  await assertStandaloneIndependence(consumers.vite);

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
