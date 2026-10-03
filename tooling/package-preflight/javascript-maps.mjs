import assert from "node:assert/strict";
import path from "node:path";

function safeReference(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(
    !value.includes("\\") && !value.includes("\0"),
    `${label} is not a portable path`,
  );
  assert.doesNotMatch(
    value,
    /^(?:\/|[a-z][a-z\d+.-]*:)/iu,
    `${label} must be relative, not an absolute path or URL`,
  );
  assert.doesNotMatch(
    value,
    /%[a-f\d]{2}/iu,
    `${label} must not hide encoded paths`,
  );
  assert.doesNotMatch(
    value,
    /(?:^|\/)(?:Users|home|scout-in|scout-pk-version|\.git|\.env(?:\.[^/]*)?|node_modules|apps|fixtures|tests?|tooling)(?:\/|$)/iu,
    `${label} references a local or repository-private path`,
  );
  return value;
}

function packagePath(directory, reference, label) {
  const resolved = path.posix.normalize(path.posix.join(directory, reference));
  assert.ok(
    resolved !== ".." &&
      !resolved.startsWith("../") &&
      !path.posix.isAbsolute(resolved),
    `${label} escapes the package`,
  );
  safeReference(resolved, label);
  return resolved;
}

/** Validate a JS map against the inventory of its actual installed tarball. */
export function validateJavaScriptMap(
  raw,
  mapPath,
  packagedPaths,
  label = mapPath,
) {
  const map = JSON.parse(raw);
  assert.ok(
    map !== null && typeof map === "object" && !Array.isArray(map),
    `${label} must be an object`,
  );
  assert.equal(map.version, 3, `${label} has an invalid map version`);
  assert.ok(Array.isArray(map.sources), `${label} must declare sources`);
  assert.equal(typeof map.mappings, "string", `${label} must declare mappings`);
  assert.ok(Array.isArray(map.names), `${label} must declare names`);
  const directory = path.posix.dirname(mapPath);
  const generated = mapPath.slice(0, -4);
  assert.ok(
    packagedPaths.has(generated),
    `${label} has no packaged generated JavaScript`,
  );
  if (map.file !== undefined) {
    assert.equal(
      packagePath(directory, safeReference(map.file, `${label} file`), label),
      generated,
      `${label} points to the wrong generated JavaScript file`,
    );
  }
  const sourceRoot = safeReference(map.sourceRoot ?? "", `${label} sourceRoot`);
  const sourceDirectory = packagePath(
    directory,
    sourceRoot,
    `${label} sourceRoot`,
  );
  if (map.sourcesContent !== undefined) {
    assert.ok(
      Array.isArray(map.sourcesContent),
      `${label} sourcesContent must be an array`,
    );
    assert.equal(
      map.sourcesContent.length,
      map.sources.length,
      `${label} sourcesContent length mismatch`,
    );
  }
  let embeddedSources = 0;
  let packagedSources = 0;
  for (const [index, source] of map.sources.entries()) {
    safeReference(source, `${label} source`);
    assert.notEqual(source, "", `${label} has an empty source path`);
    const target = packagePath(sourceDirectory, source, `${label} source`);
    const content = map.sourcesContent?.[index];
    assert.ok(
      content === undefined || content === null || typeof content === "string",
      `${label} has invalid embedded source content`,
    );
    if (typeof content === "string") {
      assert.doesNotMatch(
        content,
        /\/(?:Users|home)\/|[a-z]:[\\/]Users[\\/]|scout-pk-version|(?:\.\.\/)+scout-in/iu,
        `${label} embeds local or unrelated repository paths`,
      );
      assert.doesNotMatch(
        content,
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[a-z\d]{30,}|github_pat_[a-z\d_]{40,}|npm_[a-z\d]{30,})/iu,
        `${label} embeds credential material`,
      );
      embeddedSources++;
    } else {
      assert.ok(
        packagedPaths.has(target),
        `${label} source ${source} is neither embedded nor packaged`,
      );
      packagedSources++;
    }
  }
  return {
    maps: 1,
    sources: map.sources.length,
    embeddedSources,
    packagedSources,
  };
}
