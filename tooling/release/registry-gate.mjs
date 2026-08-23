import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { queryRegistry } from "./release-config.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const reportPath = argument("--report");
const phase = argument("--phase");
const tag = argument("--tag");
const baselinePath = argument("--baseline");
assert.ok(
  reportPath && ["before", "after"].includes(phase),
  "invalid registry gate arguments",
);
assert.ok(["canary", "latest"].includes(tag), "invalid dist-tag");
const release = JSON.parse(await readFile(reportPath, "utf8"));
const states = {};
for (const [name, version] of Object.entries(release.versions)) {
  const state = await queryRegistry(name, version);
  assert.notEqual(state.state, "UNKNOWN", `${name} registry state is unknown`);
  if (phase === "before") {
    assert.notEqual(
      state.state,
      "VERSION_EXISTS",
      `${name}@${version} already exists`,
    );
  } else {
    assert.equal(
      state.state,
      "VERSION_EXISTS",
      `${name}@${version} is not public`,
    );
    assert.equal(
      state.distTags?.[tag],
      version,
      `${name} ${tag} tag is incorrect`,
    );
    assert.equal(
      state.provenance,
      true,
      `${name}@${version} has no registry provenance attestation`,
    );
  }
  states[name] = state;
}
if (phase === "before" && baselinePath) {
  await writeFile(baselinePath, `${JSON.stringify(states, null, 2)}\n`);
}
if (phase === "after" && tag === "canary" && baselinePath) {
  const before = JSON.parse(await readFile(baselinePath, "utf8"));
  for (const name of Object.keys(states)) {
    assert.equal(
      states[name].distTags?.latest,
      before[name]?.distTags?.latest,
      `${name} latest changed during canary publication`,
    );
  }
}
process.stdout.write(`${JSON.stringify(states, null, 2)}\n`);
