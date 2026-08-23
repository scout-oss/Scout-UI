import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";

import {
  classifyRegistryResponse,
  discoverReleasePackages,
  isPrerelease,
  isSemver,
  publishOrder,
  queryRegistry,
  validateManifest,
} from "../release-config.mjs";
import { validateReleaseText } from "../release-notes.mjs";

test("clean builds generate route and package declarations deterministically", async () => {
  const docs = JSON.parse(
    await readFile(path.join(process.cwd(), "apps/docs/package.json"), "utf8"),
  );
  assert.match(docs.scripts.typecheck, /^next typegen && /u);

  for (const directory of ["react", "sticker-trail", "stickers"]) {
    const manifest = JSON.parse(
      await readFile(
        path.join(process.cwd(), "packages", directory, "package.json"),
        "utf8",
      ),
    );
    assert.match(manifest.scripts.build, /--emitDeclarationOnly/u);
    assert.match(manifest.scripts.build, /--composite false/u);
    assert.match(manifest.scripts.build, /--incremental false/u);
  }
});

test("semver and prerelease policy rejects malformed versions", () => {
  assert.equal(isSemver("0.1.0"), true);
  assert.equal(isPrerelease("0.1.0-canary.12"), true);
  assert.equal(isPrerelease("0.1.0"), false);
  assert.equal(isSemver("v0.1"), false);
  assert.equal(isSemver("0.1.0 canary"), false);
});

test("registry results distinguish absence, existence, and failure", () => {
  assert.equal(
    classifyRegistryResponse(404, {}, "0.1.0").state,
    "PACKAGE_ABSENT",
  );
  assert.equal(
    classifyRegistryResponse(200, { versions: { "0.1.0": {} } }, "0.1.0").state,
    "VERSION_EXISTS",
  );
  assert.equal(
    classifyRegistryResponse(200, { versions: {} }, "0.1.0").state,
    "VERSION_ABSENT",
  );
  assert.equal(classifyRegistryResponse(503, {}, "0.1.0").state, "UNKNOWN");
});

test("registry network failure and an existing version remain distinct", async () => {
  const networkFailure = await queryRegistry(
    "@scout-ui/react",
    "0.1.0",
    async () => {
      throw new Error("simulated registry timeout");
    },
  );
  assert.equal(networkFailure.state, "UNKNOWN");
  assert.match(networkFailure.error, /simulated registry timeout/u);

  const existing = await queryRegistry(
    "@scout-ui/react",
    "0.1.0",
    async () => ({
      json: async () => ({ versions: { "0.1.0": {} } }),
      status: 200,
    }),
  );
  assert.equal(existing.state, "VERSION_EXISTS");
});

test("package discovery refuses an unexpected fourth public package", async (t) => {
  const { mkdtemp, mkdir, rm, writeFile } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const root = await mkdtemp(path.join(os.tmpdir(), "scout-ui-release-test-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  for (const name of ["react", "sticker-trail", "stickers", "unexpected"]) {
    const directory = path.join(root, "packages", name);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, "package.json"),
      `${JSON.stringify({ name: `@scout-ui/${name}` })}\n`,
    );
  }
  await assert.rejects(
    discoverReleasePackages(root),
    /exactly the three approved public packages/u,
  );
});

test("publish order follows public dependency edges", () => {
  const records = [
    {
      manifest: {
        name: "@scout-ui/react",
        dependencies: { "@scout-ui/sticker-trail": "0.1.0" },
      },
    },
    { manifest: { name: "@scout-ui/stickers" } },
    { manifest: { name: "@scout-ui/sticker-trail" } },
  ];
  assert.deepEqual(publishOrder(records), [
    "@scout-ui/stickers",
    "@scout-ui/sticker-trail",
    "@scout-ui/react",
  ]);
});

test("manifest validation rejects private, wrong-repository, and local dependencies", () => {
  const base = {
    directory: "packages/react",
    manifest: {
      bugs: { url: "https://github.com/scout-oss/Scout-UI/issues" },
      dependencies: {},
      homepage: "https://design.scoutapp.in/",
      license: "MIT",
      name: "@scout-ui/react",
      publishConfig: {
        access: "public",
        registry: "https://registry.npmjs.org/",
      },
      repository: {
        directory: "packages/react",
        type: "git",
        url: "git+https://github.com/scout-oss/Scout-UI.git",
      },
      version: "0.1.0",
    },
  };
  assert.doesNotThrow(() => validateManifest(base));
  assert.throws(() =>
    validateManifest({
      ...base,
      manifest: { ...base.manifest, private: true },
    }),
  );
  assert.throws(() =>
    validateManifest({
      ...base,
      manifest: {
        ...base.manifest,
        repository: {
          ...base.manifest.repository,
          url: "git+https://github.com/example/fork.git",
        },
      },
    }),
  );
  assert.throws(() =>
    validateManifest({
      ...base,
      manifest: { ...base.manifest, dependencies: { x: "file:../x" } },
    }),
  );
});

test("release-note validation rejects placeholders, private paths, and false publication claims", () => {
  assert.doesNotThrow(() =>
    validateReleaseText(
      "Prepare the first public Scout UI v0.1 release.",
      "note",
    ),
  );
  assert.throws(() =>
    validateReleaseText("TODO publish this later with more detail", "note"),
  );
  assert.throws(() =>
    validateReleaseText(
      "Read /Users/person/private/release-notes for this package",
      "note",
    ),
  );
  assert.throws(() =>
    validateReleaseText(
      "Scout UI is already published on npm for everyone",
      "note",
    ),
  );
});
