"use strict";

const { expand } = require("brace-expansion");
const picomatch = require("picomatch");

// This module implements only the APIs consumed by the pinned private tools.
// It contains no micromatch/braces source and is never a public package dependency.
const MAX_INPUT_LENGTH = 65536;
const MAX_DEPTH = 64;
const MAX_EXPANSIONS = 1000;

function validate(pattern) {
  if (typeof pattern !== "string")
    throw new TypeError("Expected a glob string");
  if (pattern.length > MAX_INPUT_LENGTH)
    throw new RangeError("Glob exceeds the input length limit");
  if (/\p{Cc}/u.test(pattern))
    throw new TypeError("Control characters are not valid in tooling globs");
  const nesting = [];
  let quote = "";
  for (let i = 0; i < pattern.length; i++) {
    const character = pattern[i];
    if (character === "\\") {
      i++;
      continue;
    }
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "{" || character === "(") {
      nesting.push(character);
      if (nesting.length > MAX_DEPTH)
        throw new RangeError("Glob exceeds the nesting depth limit");
    } else if (
      (character === "}" && nesting.at(-1) === "{") ||
      (character === ")" && nesting.at(-1) === "(")
    )
      nesting.pop();
  }
  return pattern;
}

function patternsOf(patterns) {
  return (Array.isArray(patterns) ? patterns : [patterns]).map(validate);
}

function matcher(patterns, options) {
  const rules = patternsOf(patterns);
  return picomatch(Array.isArray(patterns) ? rules : rules[0], options);
}

function match(list, patterns, options = {}) {
  const values = Array.isArray(list) ? list : [list];
  const rules = patternsOf(patterns).map((pattern) =>
    picomatch(pattern, options, true),
  );
  const accepted = new Map();
  const excluded = new Set();
  const visited = new Set();
  let positiveRules = 0;
  for (const rule of rules) {
    const negative = rule.state.negated || rule.state.negatedExtglob;
    if (!negative) positiveRules++;
    for (const value of values) {
      const result = rule(value, true);
      visited.add(result.output);
      if (negative) {
        if (!result.isMatch) excluded.add(result.output);
      } else if (result.isMatch) {
        accepted.set(result.output, true);
        excluded.delete(result.output);
      }
    }
  }
  const output = [...(positiveRules ? accepted.keys() : visited)].filter(
    (value) => !excluded.has(value),
  );
  if (!output.length && options.failglob)
    throw new Error(
      `No matches found for "${patternsOf(patterns).join(", ")}"`,
    );
  if (!output.length && (options.nonull || options.nullglob))
    return patternsOf(patterns).map((pattern) =>
      options.unescape ? pattern.replace(/\\/gu, "") : pattern,
    );
  return output;
}

function braces(pattern, options = {}) {
  validate(pattern);
  if (options.expand !== true)
    throw new TypeError("Pinned private tools require expanded braces only");
  if (!pattern.includes("{") || !pattern.includes("}")) return [pattern];
  // Preserve quoted literals and escaped characters in fast-glob's keepEscaping
  // mode. Prefixing retains empty alternatives, which its caller filters later.
  const literals = [];
  const protectedPattern = pattern.replace(/"[^"]*"|'[^']*'|\\./gu, (value) => {
    literals.push(value.startsWith("\\") ? value : value.slice(1, -1));
    return `\u0001${literals.length - 1}\u0002`;
  });
  const expanded = expand(`\u0003${protectedPattern}`, {
    max: MAX_EXPANSIONS + 1,
    maxLength: 4000000,
    maxDepth: MAX_DEPTH,
  });
  if (expanded.length > MAX_EXPANSIONS)
    throw new RangeError("Glob exceeds the expansion count limit");
  const restored = expanded.map((item) =>
    item
      .slice(1)
      .replace(/\p{Cc}([0-9]+)\p{Cc}/gu, (_, index) => literals[index]),
  );
  return options.nodupes ? [...new Set(restored)] : restored;
}

match.isMatch = (value, patterns, options) => matcher(patterns, options)(value);
match.matcher = matcher;
match.makeRe = (pattern, options) =>
  picomatch.makeRe(validate(pattern), options);
match.scan = (pattern, options) => {
  const result = picomatch.scan(validate(pattern), options);
  // The pinned fast-glob handles a no-separator scan as an empty parts array.
  if (options?.parts && result.parts.length === 1) result.parts = [];
  return result;
};
match.braces = braces;
module.exports = match;
