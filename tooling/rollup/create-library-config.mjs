import esbuild from "rollup-plugin-esbuild";

/**
 * Rollup reports native module ids, so on Windows they arrive with backslashes
 * while `clientEntries` are authored with POSIX separators. Comparing them
 * unnormalised silently drops the `"use client"` banner and produces an
 * incorrect RSC boundary, so every comparison goes through this.
 */
function toPosix(id) {
  return id.replaceAll("\\", "/");
}

function isEntry(id, clientEntries) {
  if (typeof id !== "string") {
    return false;
  }

  const normalized = toPosix(id);
  return clientEntries.some((entry) => normalized.endsWith(toPosix(entry)));
}

export function createLibraryConfig({
  input = "src/index.ts",
  external = [],
  clientEntries = [],
} = {}) {
  return {
    input,
    external,
    onwarn(warning, warn) {
      const isClientEntry = isEntry(warning.id, clientEntries);
      const isHandledDirective =
        warning.code === "MODULE_LEVEL_DIRECTIVE" &&
        warning.message.includes("use client");
      const isDirectiveSourcemapNoise =
        warning.code === "SOURCEMAP_ERROR" &&
        warning.message.includes("Can't resolve original location of error");

      if (isClientEntry && (isHandledDirective || isDirectiveSourcemapNoise)) {
        return;
      }

      warn(warning);
    },
    output: {
      dir: "dist",
      entryFileNames: "[name].js",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: true,
      banner(chunk) {
        return isEntry(chunk.facadeModuleId, clientEntries)
          ? '"use client";'
          : "";
      },
    },
    plugins: [
      esbuild({
        target: "es2022",
        tsconfig: "tsconfig.json",
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
  };
}
