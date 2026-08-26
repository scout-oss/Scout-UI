import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { repositoryRoot } from "./release-config.mjs";

const workflowDirectory = path.join(repositoryRoot, ".github", "workflows");
const files = (await readdir(workflowDirectory))
  .filter((file) => /\.ya?ml$/u.test(file))
  .sort();
assert.ok(files.length >= 7, "M18 workflow inventory is incomplete");

const allowedIdToken = new Set(["publish.yml"]);
const allowedContentsWrite = new Set(["release-pr.yml"]);
for (const file of files) {
  const source = await readFile(path.join(workflowDirectory, file), "utf8");
  assert.doesNotMatch(
    source,
    /pull_request_target/u,
    `${file} uses pull_request_target`,
  );
  assert.doesNotMatch(source, /write-all/u, `${file} uses write-all`);
  assert.doesNotMatch(
    source,
    /\b(?:NPM_TOKEN|NODE_AUTH_TOKEN)\b/u,
    `${file} uses an npm token`,
  );
  assert.doesNotMatch(
    source,
    /uses:\s*[^\s@]+@(?:main|master|latest|v\d+)\b/u,
    `${file} has a floating action`,
  );
  for (const match of source.matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/gu)) {
    if (match[1].startsWith("./")) continue;
    assert.match(
      match[2],
      /^[a-f0-9]{40}$/u,
      `${file} action ${match[1]} is not SHA-pinned`,
    );
  }
  if (/id-token:\s*write/u.test(source)) {
    assert.ok(
      allowedIdToken.has(file),
      `${file} has unjustified id-token write`,
    );
  }
  if (/contents:\s*write/u.test(source)) {
    assert.ok(
      allowedContentsWrite.has(file),
      `${file} has unjustified contents write`,
    );
  }
}

const canary = await readFile(
  path.join(workflowDirectory, "canary.yml"),
  "utf8",
);
assert.match(canary, /workflow_dispatch/u);
assert.match(canary, /prepare-canary/u);
assert.doesNotMatch(canary, /npm publish/u);
assert.doesNotMatch(canary, /id-token:\s*write/u);

const publish = await readFile(
  path.join(workflowDirectory, "publish.yml"),
  "utf8",
);
assert.match(publish, /workflow_dispatch/u);
assert.match(publish, /environment:\s*npm-release/u);
assert.match(publish, /publish-canary/u);
assert.match(publish, /publish-v0\.1/u);
assert.match(publish, /--tag\s+canary/u);
assert.match(publish, /--tag\s+latest/u);

const releasePr = await readFile(
  path.join(workflowDirectory, "release-pr.yml"),
  "utf8",
);
assert.match(
  releasePr,
  /github-token:\s*\$\{\{\s*secrets\.RELEASE_PR_TOKEN\s*\}\}/u,
  "release PR must use the repository-scoped release PR credential",
);
assert.doesNotMatch(
  releasePr,
  /secrets\.GITHUB_TOKEN/u,
  "release PR must not fall back to the policy-restricted GITHUB_TOKEN",
);

const docsProduction = await readFile(
  path.join(workflowDirectory, "docs-production.yml"),
  "utf8",
);
for (const requiredCheck of [
  "CI / required",
  "Browser / required",
  "Visual / required",
  "Security / required",
]) {
  assert.match(
    docsProduction,
    new RegExp(requiredCheck.replace("/", "\\/"), "u"),
    `docs production does not require ${requiredCheck}`,
  );
}
assert.match(docsProduction, /workflow_run\.head_sha/u);
assert.match(docsProduction, /environment:\s*docs-production/u);

for (const file of files.filter((name) => name !== "publish.yml")) {
  const source = await readFile(path.join(workflowDirectory, file), "utf8");
  assert.doesNotMatch(
    source,
    /npm publish[^\n]*--tag\s+latest/u,
    `${file} can publish latest`,
  );
}

process.stdout.write(`Workflow policy PASS (${files.length} workflows)\n`);
