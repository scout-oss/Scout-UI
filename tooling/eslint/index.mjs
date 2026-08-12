import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importX from "eslint-plugin-import-x";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { scoutUiPlugin } from "./no-state-in-pointer-handler.mjs";

// `URL.pathname` yields "/C:/..." on Windows, which the TypeScript project
// service rejects. `fileURLToPath` produces a real absolute path everywhere.
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

const ignoredPaths = [
  "**/.next/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/dist/**",
  "**/node_modules/**",
  "**/playwright-report/**",
  "**/test-results/**",
  "**/*.test-d.tsx",
];

export default tseslint.config(
  { ignores: ignoredPaths },
  js.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "apps/*/tests/*.test.ts",
            "packages/*/tests/*.test.ts",
            "playwright.config.ts",
          ],
        },
        tsconfigRootDir: repositoryRoot,
      },
    },
    plugins: {
      "import-x": importX,
      "jsx-a11y": jsxA11y,
      react,
      "react-hooks": reactHooks,
      "scout-ui": scoutUiPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "import-x/no-duplicates": "error",
      "react/prop-types": "off",
      // Scout UI's central performance invariant: no React state update per
      // pointer movement. See SCOUT_UI_ENGINEERING_SPEC.md section 31.
      "scout-ui/no-state-in-pointer-handler": "error",
    },
  },
  {
    files: ["**/*.config.{ts,js,mjs}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);
