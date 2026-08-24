import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { releasePolicy, repositoryRoot } from "./release-config.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const reportPath = argument("--report");
const tag = argument("--tag");
assert.equal(
  process.argv.includes("--publish"),
  true,
  "explicit --publish is required",
);
assert.ok(
  reportPath && ["canary", "latest"].includes(tag),
  "invalid publish arguments",
);
assert.equal(process.env.GITHUB_ACTIONS, "true", "publication is CI-only");
assert.equal(
  process.env.GITHUB_REPOSITORY,
  releasePolicy.repository,
  "wrong repository",
);
assert.equal(
  process.env.GITHUB_REF,
  "refs/heads/main",
  "publication requires main",
);
assert.equal(
  process.env.SCOUT_UI_RELEASE_CONFIRMATION,
  tag === "canary" ? "publish-canary" : "publish-v0.1",
  "release confirmation does not match the dist-tag",
);

const report = JSON.parse(await readFile(reportPath, "utf8"));
assert.equal(report.distTag, tag, "report tag does not match publish tag");
for (const name of report.publishOrder) {
  const artifact = report.tarballs[name];
  assert.ok(artifact, `missing inspected artifact for ${name}`);
  const file = path.resolve(repositoryRoot, artifact.file);
  const actual = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  assert.equal(
    actual,
    artifact.sha256,
    `${name} tarball changed after inspection`,
  );
  await new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      ["publish", file, "--access", "public", "--tag", tag],
      { cwd: repositoryRoot, stdio: "inherit" },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`npm publish ${name} failed (${signal ?? code})`));
    });
  });
}
