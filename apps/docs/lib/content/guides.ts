export const guideSlugs = [
  "installation",
  "theming",
  "asset-authoring",
  "ssr-nextjs",
  "motion",
  "accessibility",
  "performance",
  "ai-handoff",
  "contributing",
  "migration",
] as const;

export type GuideSlug = (typeof guideSlugs)[number];
