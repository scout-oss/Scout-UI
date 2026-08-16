export type DocsPackageName = "@scout-ui/react" | "@scout-ui/sticker-trail";
export type ComponentStatus = "alpha" | "beta" | "stable";

export interface RegistryDefinition {
  readonly slug: string;
  readonly name: string;
  readonly packageName: DocsPackageName;
  readonly status: ComponentStatus;
}

export interface ComponentSummaryDefinition extends RegistryDefinition {
  readonly kind: "foundation" | "signature";
  readonly purpose: string;
  readonly capabilities: readonly ("keyboard" | "pointer" | "ssr" | "touch")[];
  readonly accent: "acid" | "cyan" | "orange" | "pink" | "ultraviolet";
}

export interface Registry<T extends RegistryDefinition> {
  readonly entries: readonly T[];
  get(slug: string): T | undefined;
  has(slug: string): boolean;
}

export function createRegistry<const T extends RegistryDefinition>(
  definitions: readonly T[],
): Registry<T> {
  const entries = Object.freeze(
    definitions.map((definition) => Object.freeze({ ...definition }) as T),
  );
  const bySlug = new Map<string, T>();
  for (const definition of entries) {
    if (bySlug.has(definition.slug)) {
      throw new Error(`Duplicate component registry slug: ${definition.slug}`);
    }
    bySlug.set(definition.slug, definition);
  }

  return Object.freeze({
    entries,
    get: (slug: string) => bySlug.get(slug),
    has: (slug: string) => bySlug.has(slug),
  });
}

export const componentCatalog = createRegistry([
  {
    slug: "sticker",
    name: "Sticker",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Place accessible artwork with tactile Scout UI treatment.",
    capabilities: ["ssr", "keyboard"],
    accent: "acid",
  },
  {
    slug: "sticker-button",
    name: "StickerButton",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Give actions and links physical press feedback.",
    capabilities: ["ssr", "keyboard", "touch"],
    accent: "cyan",
  },
  {
    slug: "sticker-badge",
    name: "StickerBadge",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Label, select, and remove with native semantics.",
    capabilities: ["ssr", "keyboard", "touch"],
    accent: "pink",
  },
  {
    slug: "sticker-trail",
    name: "StickerTrail",
    packageName: "@scout-ui/sticker-trail",
    status: "alpha",
    kind: "signature",
    purpose: "Leave a bounded, performant trail inside one intentional region.",
    capabilities: ["pointer", "touch", "ssr"],
    accent: "ultraviolet",
  },
  {
    slug: "sticker-cursor",
    name: "StickerCursor",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Add a safety-first custom pointer enhancement.",
    capabilities: ["pointer", "ssr"],
    accent: "orange",
  },
  {
    slug: "sticker-peel",
    name: "StickerPeel",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Reveal layered content with directional intent.",
    capabilities: ["keyboard", "pointer", "touch", "ssr"],
    accent: "pink",
  },
  {
    slug: "sticker-stack",
    name: "StickerStack",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Navigate a bounded stack without rendering the whole collection.",
    capabilities: ["keyboard", "pointer", "touch", "ssr"],
    accent: "cyan",
  },
  {
    slug: "sticker-navbar",
    name: "StickerNavbar",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Frame a site with accessible ribbon or collage navigation.",
    capabilities: ["keyboard", "touch", "ssr"],
    accent: "acid",
  },
] as const satisfies readonly ComponentSummaryDefinition[]);
