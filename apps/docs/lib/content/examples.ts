import type { ComponentSlug } from "../registry";

export const exampleSlugs = [
  "sticker-trail-hero",
  "custom-cursor-canvas",
  "campaign-navbar",
  "peel-product-detail",
  "sticker-mood-board",
  "stacked-stories",
] as const;

export type ExampleSlug = (typeof exampleSlugs)[number];

export interface ExampleDefinition {
  readonly slug: ExampleSlug;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly component: ComponentSlug;
  readonly packageName: "@scout-ui/react" | "@scout-ui/sticker-trail";
  readonly accessibility: string;
  readonly adaptation: string;
  readonly searchTerms: readonly string[];
}

export const examples = [
  {
    slug: "sticker-trail-hero",
    title: "A bounded StickerTrail hero",
    shortTitle: "Trail hero",
    description:
      "Add one finite pointer flourish to a campaign message while the underlying content remains ordinary and selectable.",
    component: "sticker-trail",
    packageName: "@scout-ui/sticker-trail",
    accessibility:
      "The trail is decorative; the heading, copy, and native link carry the complete meaning.",
    adaptation:
      "Reduced motion and coarse pointers keep the authored resting composition without a movement loop.",
    searchTerms: ["cursor trail", "hero", "maxActive", "bounded motion"],
  },
  {
    slug: "custom-cursor-canvas",
    title: "A custom-cursor product canvas",
    shortTitle: "Cursor canvas",
    description:
      "Scope a safety-first custom cursor to one visual comparison canvas and restore the native cursor everywhere else.",
    component: "sticker-cursor",
    packageName: "@scout-ui/react",
    accessibility:
      "Keyboard focus and native controls remain unchanged; cursor artwork is supplemental and pointer-transparent.",
    adaptation:
      "The native cursor wins for reduced motion, coarse pointers, editable regions, load failure, and leave.",
    searchTerms: [
      "custom cursor",
      "hotspot",
      "native bypass",
      "product canvas",
    ],
  },
  {
    slug: "campaign-navbar",
    title: "A campaign StickerNavbar",
    shortTitle: "Campaign navbar",
    description:
      "Give a short campaign site a memorable ribbon navigation without changing anchors, landmarks, or mobile access.",
    component: "sticker-navbar",
    packageName: "@scout-ui/react",
    accessibility:
      "The example uses a named navigation landmark, anchors, current-page state, and Radix-managed mobile focus.",
    adaptation:
      "Decoration crops on small screens and the complete link set moves into the accessible menu.",
    searchTerms: ["playful navbar", "campaign", "ribbon", "mobile menu"],
  },
  {
    slug: "peel-product-detail",
    title: "A peel-to-reveal product detail",
    shortTitle: "Peel detail",
    description:
      "Reveal optional material information with a named button while keeping both layers mounted and size-stable.",
    component: "sticker-peel",
    packageName: "@scout-ui/react",
    accessibility:
      "Tap, click, Enter, and Space provide the complete disclosure path; dragging remains optional.",
    adaptation:
      "Reduced motion performs an immediate semantic swap and touch never depends on precise corner dragging.",
    searchTerms: ["peel interaction", "reveal", "disclosure", "product detail"],
  },
  {
    slug: "sticker-mood-board",
    title: "A selectable sticker mood board",
    shortTitle: "Mood board",
    description:
      "Compose Sticker and StickerBadge into a clear category picker where selection remains textual and pressed-state driven.",
    component: "sticker-badge",
    packageName: "@scout-ui/react",
    accessibility:
      "Each choice is a native button with aria-pressed and a visible selection mark beyond color.",
    adaptation:
      "The board wraps in document order and remains fully usable without hover or drag.",
    searchTerms: ["sticker badge", "mood", "category", "aria-pressed"],
  },
  {
    slug: "stacked-stories",
    title: "Stacked testimonial and story cards",
    shortTitle: "Stacked stories",
    description:
      "Browse three attributed studio notes in a bounded stack with ordinary previous and next controls.",
    component: "sticker-stack",
    packageName: "@scout-ui/react",
    accessibility:
      "Only the active story is exposed; buttons remain available even when swipe and arrow-key enhancements are enabled.",
    adaptation:
      "Reduced motion reorders directly, while mobile keeps one readable card and bounded depth hints.",
    searchTerms: [
      "stacked cards",
      "stories",
      "testimonials",
      "carousel alternative",
    ],
  },
] as const satisfies readonly ExampleDefinition[];

export function getExample(slug: string): ExampleDefinition | undefined {
  return examples.find((example) => example.slug === slug);
}
