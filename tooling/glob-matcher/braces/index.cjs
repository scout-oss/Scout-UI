"use strict";

const { braces } = require("../index.cjs");

// chokidar 3 calls only braces.expand(path) for watched glob directories.
// Expansion shares the parent adapter's input, depth and count limits.
function expand(pattern, options) {
  if (options !== undefined)
    throw new TypeError("The private CRA fixture requires default expansion");
  return braces(pattern, { expand: true });
}

module.exports = { expand };
