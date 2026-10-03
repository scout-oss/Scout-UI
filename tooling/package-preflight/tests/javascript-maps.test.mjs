import assert from "node:assert/strict";
import { test } from "node:test";

import { isJavaScriptMap, validateJavaScriptMap } from "../javascript-maps.mjs";

const mapPath = "dist/sticker/index.js.map";
const paths = new Set(["dist/sticker/index.js", mapPath]);
const sourceMap = (overrides = {}) => ({
  version: 3,
  file: "index.js",
  sources: ["../../src/sticker/index.tsx"],
  sourcesContent: ["export const Sticker = () => null;"],
  names: [],
  mappings: "AAAA",
  ...overrides,
});
const validate = (overrides, inventory = paths) =>
  validateJavaScriptMap(
    JSON.stringify(sourceMap(overrides)),
    mapPath,
    inventory,
  );

test("self-contained map resolves original source without shipping src", () => {
  assert.deepEqual(validate(), {
    maps: 1,
    sources: 1,
    embeddedSources: 1,
    packagedSources: 0,
  });
});

test("pre-fix missing sourcesContent and unpublished src are rejected", () => {
  assert.throws(
    () => validate({ sourcesContent: undefined }),
    /neither embedded nor packaged/u,
  );
  assert.throws(
    () => validate({ sourcesContent: [null] }),
    /neither embedded nor packaged/u,
  );
});

test("actual packaged sources are an alternative to embedded sources", () => {
  const inventory = new Set([...paths, "src/sticker/index.tsx"]);
  assert.equal(
    validate({ sourcesContent: undefined }, inventory).packagedSources,
    1,
  );
  assert.equal(
    validate({ sourcesContent: [null] }, inventory).packagedSources,
    1,
  );
});

test("empty emitted modules and empty source contents are valid", () => {
  assert.equal(
    validate({ sources: [], sourcesContent: [], mappings: "" }).sources,
    0,
  );
  assert.equal(validate({ sourcesContent: [""] }).embeddedSources, 1);
});

test("malformed JSON and invalid map shape are rejected", () => {
  assert.throws(() => validateJavaScriptMap("{", mapPath, paths), SyntaxError);
  for (const patch of [
    { version: 2 },
    { sources: undefined },
    { sources: "src.ts" },
    { sources: [null] },
    { sources: [""] },
    { names: null },
    { mappings: null },
    { sourcesContent: [] },
    { sourcesContent: "source" },
    { sourcesContent: [false] },
  ]) {
    assert.throws(() => validate(patch));
  }
});

test("all source references are checked, including trailing missing sources", () => {
  assert.throws(
    () =>
      validate({
        sources: ["../../src/sticker/index.tsx", "../../src/missing.ts"],
        sourcesContent: ["embedded", null],
      }),
    /neither embedded nor packaged/u,
  );
});

test("absolute, private, URL and escaping source references are rejected even when embedded", () => {
  for (const source of [
    "/Users/person/file.ts",
    "/home/person/file.ts",
    "C:/Users/person/file.ts",
    "C:\\Users\\person\\file.ts",
    "\\\\server\\share\\file.ts",
    "file:///source.ts",
    "https://example.test/source.ts",
    "../../../outside.ts",
    "../../fixtures/test.ts",
    "../../scout-in/src/file.ts",
    "../../src/../tests/file.ts",
    "%2e%2e/%2e%2e/%2e%2e/source.ts",
  ]) {
    assert.throws(() => validate({ sources: [source] }), undefined, source);
  }
});

test("sourceRoot cannot bypass package containment or privacy checks", () => {
  for (const sourceRoot of [
    "/home/person",
    "C:/source",
    "../../../",
    "../../fixtures",
    "https://example.test/",
  ]) {
    assert.throws(() => validate({ sourceRoot, sources: ["source.ts"] }));
  }
  assert.equal(
    validate({ sourceRoot: "../../src/", sources: ["sticker/index.tsx"] })
      .embeddedSources,
    1,
  );
});

test("map file must identify the corresponding packaged generated JS", () => {
  assert.throws(() => validate({ file: "other.js" }), /wrong generated/u);
  assert.throws(() => validate({ file: "../../../outside.js" }), /escapes/u);
  assert.throws(
    () => validate({}, new Set([mapPath])),
    /no packaged generated/u,
  );
});

test("embedded local paths and credential material are rejected", () => {
  for (const content of [
    "// /Users/person/source.ts",
    "// /home/person/source.ts",
    "// C:\\Users\\person\\source.ts",
    "// ../../scout-in/src/app.ts",
    "-----BEGIN PRIVATE KEY-----",
    "ghp_" + "a".repeat(40),
  ]) {
    assert.throws(() => validate({ sourcesContent: [content] }));
  }
});

test("preflight selects exactly the executable JavaScript map family", () => {
  for (const extension of ["js", "mjs", "cjs"]) {
    assert.equal(isJavaScriptMap(`dist/asset-urls.${extension}.map`), true);
  }
  for (const file of [
    "dist/types.d.ts.map",
    "dist/styles.css.map",
    "dist/index.js",
    "dist/index.jsx.map",
  ]) {
    assert.equal(isJavaScriptMap(file), false);
    assert.throws(
      () => validateJavaScriptMap("{}", file, new Set()),
      /not a JavaScript map/u,
    );
  }
});

for (const extension of ["js", "mjs", "cjs"]) {
  test(`${extension} maps receive the same strict target, source and privacy checks`, () => {
    const target = `dist/asset-urls.${extension}`;
    const file = `${target}.map`;
    const inventory = new Set([target, file]);
    const check = (patch = {}, files = inventory) =>
      validateJavaScriptMap(
        JSON.stringify(
          sourceMap({
            file: `asset-urls.${extension}`,
            sources: ["../src/asset-urls.ts"],
            ...patch,
          }),
        ),
        file,
        files,
      );
    assert.equal(check().embeddedSources, 1);
    assert.throws(() => check({}, new Set([file])), /no packaged generated/u);
    assert.throws(() => check({ file: "other.js" }), /wrong generated/u);
    assert.throws(
      () => check({ sourcesContent: [null] }),
      /neither embedded nor packaged/u,
    );
    assert.throws(() => check({ sourcesContent: [] }), /length mismatch/u);
    for (const source of [
      "/Users/person/source.ts",
      "C:/Users/person/source.ts",
      "../../outside.ts",
      "../scout-in/source.ts",
      "../tests/source.ts",
    ]) {
      assert.throws(() => check({ sources: [source] }));
    }
    assert.throws(
      () => check({ sourcesContent: ["ghp_" + "a".repeat(40)] }),
      /credential material/u,
    );
  });
}
