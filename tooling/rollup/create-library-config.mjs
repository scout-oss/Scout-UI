import esbuild from "rollup-plugin-esbuild";

export function createLibraryConfig({
  input = "src/index.ts",
  external = [],
} = {}) {
  return {
    input,
    external,
    output: {
      dir: "dist",
      entryFileNames: "[name].js",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: true,
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
