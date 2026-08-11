export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "**/.next/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
  ],
  rules: {
    "custom-property-pattern": [
      "^sui-[a-z0-9]+(?:-[a-z0-9]+)*$",
      {
        message: "Scout UI custom properties must use the --sui-* namespace.",
      },
    ],
  },
};
