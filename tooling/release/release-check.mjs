import assert from "node:assert/strict";

import {
  discoverReleasePackages,
  publishOrder,
  queryRegistry,
  readJson,
  releasePolicy,
  validateManifest,
} from "./release-config.mjs";

const liveRegistry = process.argv.includes("--live-registry");
const records = await discoverReleasePackages();
for (const record of records) validateManifest(record);
assert.deepEqual(publishOrder(records), releasePolicy.packages);
const changesets = await readJson(
  new URL("../../.changeset/config.json", import.meta.url),
);
assert.deepEqual(
  changesets.privatePackages,
  { tag: false, version: false },
  "private workspaces must never enter the release version plan",
);

const result = {
  packages: records.map(({ directory, manifest }) => ({
    directory,
    name: manifest.name,
    version: manifest.version,
  })),
  publishOrder: publishOrder(records),
  registry: {},
};
if (liveRegistry) {
  for (const { manifest } of records) {
    result.registry[manifest.name] = await queryRegistry(
      manifest.name,
      manifest.version,
    );
    assert.notEqual(
      result.registry[manifest.name].state,
      "UNKNOWN",
      `${manifest.name} registry state is unknown`,
    );
  }
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
