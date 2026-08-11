import esbuild from "rollup-plugin-esbuild";

export function createLibraryConfig({
  input = "src/index.ts",
  external = [],
  clientEntries = [],
} = {}) {
  return {
    input,
    external,
    onwarn(warning, warn) {
      const isClientEntry =
        warning.id && clientEntries.some((entry) => warning.id.endsWith(entry));
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
        if (
          chunk.facadeModuleId &&
          clientEntries.some((entry) => chunk.facadeModuleId.endsWith(entry))
        ) {
          return '"use client";';
        }

        return "";
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
