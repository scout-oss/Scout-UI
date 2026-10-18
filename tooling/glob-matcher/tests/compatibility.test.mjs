import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { expand as expandBraces } from "../braces/index.cjs";
import match from "../index.cjs";

const baseline = JSON.parse(
  readFileSync(new URL("./legacy-behavior.json", import.meta.url), "utf8"),
);
const expansionOptions = { expand: true, nodupes: true, keepEscaping: true };

test("legacy brace alternatives, ranges, empties, quotes and escapes", () => {
  for (const { pattern, expected } of baseline.braces)
    assert.deepEqual(
      match.braces(pattern, expansionOptions),
      expected,
      pattern,
    );
});

test("legacy ordered inclusion/exclusion, dotfiles and platform matching", () => {
  for (const { patterns, options, expected } of baseline.matching)
    assert.deepEqual(
      match(baseline.values, patterns, options),
      expected,
      JSON.stringify({ patterns, options }),
    );
});

test("fast-glob compilation and scanning preserve filesystem selection", () => {
  for (const { pattern, options, expected, parts } of baseline.compilation) {
    assert.deepEqual(
      baseline.values.map((value) =>
        match.makeRe(pattern, options).test(value),
      ),
      expected,
      pattern,
    );
    assert.deepEqual(
      match.scan(pattern, { ...options, parts: true }).parts,
      parts,
      pattern,
    );
  }
});

test("Changesets and Stylelint matcher APIs accept single and array patterns", () => {
  assert.equal(match.isMatch("@scout-ui/react", "@scout-ui/*"), true);
  assert.equal(match.isMatch("other", "@scout-ui/*"), false);
  assert.equal(
    match.matcher(["src/**/*.css", "app/**/*.css"])("app/a.css"),
    true,
  );
  assert.deepEqual(match(["a.css"], ["*.js"], { nonull: true }), ["*.js"]);
  assert.throws(
    () => match(["a.css"], ["*.js"], { failglob: true }),
    /No matches/u,
  );
});

// Expected values were compared once against micromatch 4.0.8 and braces 3.0.3.
test("CRA fixture Jest, Tailwind and chokidar APIs keep legacy results", () => {
  assert.equal(match.any, match.isMatch);
  assert.equal(match.some(["src/a.js", "lib/b.ts"], "**/*.js"), true);
  assert.equal(match.some("node_modules/x/index.js", "**/*.ts"), false);
  assert.equal(match.some([".hidden/a.js"], "**/*.js"), false);
  assert.equal(match.some([".hidden/a.js"], "**/*.js", { dot: true }), true);
  assert.equal(match.some(["lib/b.ts"], ["**/*.ts", "!lib/**"]), true);
  assert.equal(match.some(["src/a.js"], ["!**/node_modules/**"]), true);
  assert.equal(match.some([], "**/*"), false);
  assert.equal(
    match.some(
      ["a/b/c.test.js"],
      ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    ),
    true,
  );
  for (const [pattern, expected] of [
    ["/watch/{x,y}/*.js", ["/watch/x/*.js", "/watch/y/*.js"]],
    ["a{1..3}b", ["a1b", "a2b", "a3b"]],
    ["plain/path", ["plain/path"]],
    ["{a,,b}", ["a", "", "b"]],
    ["a/{b,b}/c", ["a/b/c", "a/b/c"]],
  ])
    assert.deepEqual(expandBraces(pattern), expected, pattern);
  assert.throws(
    () => expandBraces("{a,b}", { nodupes: true }),
    /default expansion/u,
  );
});

test("untrusted or accidentally excessive nesting fails before recursive expansion", () => {
  const nested = "{".repeat(65) + "a,b" + "}".repeat(65);
  for (const operation of [
    () => match(["a"], nested),
    () => match.matcher(nested),
    () => match.isMatch("a", nested),
    () => match.some(["a"], nested),
    () => match.makeRe(nested),
    () => match.scan(nested),
    () => match.braces(nested, expansionOptions),
    () => expandBraces(nested),
  ])
    assert.throws(operation, /nesting depth limit/u);
  assert.throws(() => match.makeRe("a".repeat(65537)), /input length limit/u);
  assert.throws(
    () => match.braces("{a,b}".repeat(10), expansionOptions),
    /expansion count limit/u,
  );
  assert.throws(() => match.scan("a\u0001b"), /Control characters/u);
});

test("pinned parent tools actually resolve this private replacement", () => {
  const root = createRequire(new URL("../../../package.json", import.meta.url));
  const stylelint = createRequire(root.resolve("stylelint"));
  const cli = createRequire(root.resolve("@changesets/cli/package.json"));
  const config = createRequire(cli.resolve("@changesets/config"));
  const git = createRequire(cli.resolve("@changesets/git"));
  const glob = createRequire(stylelint.resolve("fast-glob"));
  const expected = realpathSync(new URL("../index.cjs", import.meta.url));
  for (const parent of [stylelint, config, git, glob])
    assert.equal(realpathSync(parent.resolve("micromatch")), expected);
});

test("real Stylelint keeps syntax, standard rules and Scout namespace checks", async () => {
  const root = createRequire(new URL("../../../package.json", import.meta.url));
  const stylelint = (await import(root.resolve("stylelint"))).default;
  const result = await stylelint.lint({
    code: ":root { --other-color: red; color: not-a-color; }",
    codeFilename: new URL(
      "../../../packages/react/src/negative-security-probe.css",
      import.meta.url,
    ).pathname,
    configFile: new URL("../../../stylelint.config.mjs", import.meta.url)
      .pathname,
  });
  assert.equal(result.errored, true);
  assert.ok(
    result.results[0].warnings.some(
      (warning) => warning.rule === "custom-property-pattern",
    ),
  );
  assert.ok(
    result.results[0].warnings.some(
      (warning) =>
        warning.rule === "color-no-invalid-hex" ||
        warning.rule === "declaration-property-value-no-unknown",
    ),
  );
});

test("real fast-glob expands braces and preserves file and exclusion selection", async () => {
  const root = createRequire(new URL("../../../package.json", import.meta.url));
  const stylelint = createRequire(root.resolve("stylelint"));
  const glob = stylelint("fast-glob");
  const directory = await mkdtemp(
    path.join(tmpdir(), "scout-glob-regression-"),
  );
  try {
    for (const file of [
      "src/a/a.css",
      "src/a/a.scss",
      "src/b/b.css",
      "src/b/b.txt",
      "node_modules/ignored.css",
    ]) {
      const destination = path.join(directory, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, "fixture");
    }
    assert.deepEqual(
      (await glob("src/{a,b}/*.{css,scss}", { cwd: directory })).sort(),
      ["src/a/a.css", "src/a/a.scss", "src/b/b.css"],
    );
    assert.deepEqual(
      glob.sync(["**/*.css", "!**/node_modules/**"], { cwd: directory }).sort(),
      ["src/a/a.css", "src/b/b.css"],
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
