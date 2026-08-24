import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const releasePolicy = Object.freeze({
  docsOrigin: "https://design.scoutapp.in",
  packages: [
    "@scout-ui/stickers",
    "@scout-ui/sticker-trail",
    "@scout-ui/react",
  ],
  registry: "https://registry.npmjs.org",
  repository: "scout-oss/Scout-UI",
  repositoryUrl: "git+https://github.com/scout-oss/Scout-UI.git",
});

export function isSemver(value) {
  return /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(
    value,
  );
}

export function isPrerelease(value) {
  return isSemver(value) && value.includes("-");
}

export function classifyRegistryResponse(status, body, version) {
  if (status === 404) return { packageExists: false, state: "PACKAGE_ABSENT" };
  if (status < 200 || status >= 300) {
    return { packageExists: undefined, state: "UNKNOWN" };
  }
  const versions = body?.versions ?? {};
  return {
    distTags: body?.["dist-tags"] ?? {},
    packageExists: true,
    provenance:
      version === undefined
        ? undefined
        : Boolean(body?.versions?.[version]?.dist?.attestations),
    state:
      version !== undefined && Object.hasOwn(versions, version)
        ? "VERSION_EXISTS"
        : "VERSION_ABSENT",
  };
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function discoverReleasePackages(root = repositoryRoot) {
  const packagesRoot = path.join(root, "packages");
  const directories = (await readdir(packagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const records = [];
  for (const directory of directories) {
    const manifestPath = path.join(packagesRoot, directory, "package.json");
    const manifest = await readJson(manifestPath);
    records.push({
      directory: `packages/${directory}`,
      manifest,
      manifestPath,
    });
  }
  assert.deepEqual(
    records.map(({ manifest }) => manifest.name).sort(),
    [...releasePolicy.packages].sort(),
    "release tooling requires exactly the three approved public packages",
  );
  return records;
}

export function validateManifest(record) {
  const { directory, manifest } = record;
  assert.equal(manifest.private, undefined, `${manifest.name} is private`);
  assert.ok(isSemver(manifest.version), `${manifest.name} has invalid semver`);
  assert.equal(manifest.license, "MIT", `${manifest.name} license changed`);
  assert.deepEqual(manifest.repository, {
    directory,
    type: "git",
    url: releasePolicy.repositoryUrl,
  });
  assert.equal(manifest.homepage, `${releasePolicy.docsOrigin}/`);
  assert.equal(
    manifest.bugs?.url,
    `https://github.com/${releasePolicy.repository}/issues`,
  );
  assert.deepEqual(manifest.publishConfig, {
    access: "public",
    registry: `${releasePolicy.registry}/`,
  });
  for (const [kind, dependencies] of Object.entries({
    dependencies: manifest.dependencies,
    optionalDependencies: manifest.optionalDependencies,
    peerDependencies: manifest.peerDependencies,
  })) {
    for (const [name, range] of Object.entries(dependencies ?? {})) {
      assert.doesNotMatch(
        range,
        /^(?:file:|link:)|(?:^|\/)\.\.(?:\/|$)|^[A-Za-z]:[\\/]/u,
        `${manifest.name} ${kind}.${name} leaks a local dependency`,
      );
    }
  }
  for (const lifecycle of [
    "preinstall",
    "install",
    "postinstall",
    "prepare",
    "prepublish",
  ]) {
    assert.equal(
      manifest.scripts?.[lifecycle],
      undefined,
      `${manifest.name} has consumer lifecycle script ${lifecycle}`,
    );
  }
}

export function publishOrder(records) {
  const byName = new Map(
    records.map((record) => [record.manifest.name, record]),
  );
  const result = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(name) {
    if (visited.has(name)) return;
    assert.equal(
      visiting.has(name),
      false,
      `release dependency cycle at ${name}`,
    );
    visiting.add(name);
    const dependencies = byName.get(name)?.manifest.dependencies ?? {};
    for (const dependency of releasePolicy.packages) {
      if (Object.hasOwn(dependencies, dependency)) visit(dependency);
    }
    visiting.delete(name);
    visited.add(name);
    result.push(name);
  }
  for (const name of releasePolicy.packages) visit(name);
  return result;
}

export async function queryRegistry(name, version, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(
      `${releasePolicy.registry}/${encodeURIComponent(name)}`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      state: "UNKNOWN",
    };
  }
  let body;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  return {
    ...classifyRegistryResponse(response.status, body, version),
    status: response.status,
  };
}
