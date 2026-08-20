import { componentCatalog } from "../registry";
import type {
  ComponentDocDefinition,
  ComponentSlug,
  JsonPrimitive,
} from "../component-registry/types";
import {
  defaultCodegenContext,
  generateCodeForDefinition,
} from "./generate-code";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;

export const codegenComponentSlugs = Object.freeze([
  "sticker",
  "sticker-button",
  "sticker-badge",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const satisfies readonly ComponentSlug[]);

export const representativeCodegenConfigs = Object.freeze({
  sticker: { interactive: true, material: "photo", rotation: 7, size: "xl" },
  "sticker-badge": { mode: "select", selected: true, shape: "stamp" },
  "sticker-button": { element: "anchor", leading: false, tone: "cyan" },
  "sticker-trail": { maxActive: 18, sequence: "random", spacing: 66 },
  "sticker-cursor": { clickFeedback: "none", hideNative: "never", tilt: 3 },
  "sticker-peel": { drag: false, open: true, origin: "bottom-left" },
  "sticker-stack": { axis: "y", drag: true, index: 2, keyboard: true },
  "sticker-navbar": {
    activeId: "examples",
    showScrollProgress: true,
    variant: "collage",
  },
} as const satisfies Record<ComponentSlug, Record<string, JsonPrimitive>>);

export interface CanonicalGeneratedSample {
  readonly id: string;
  readonly kind: "custom" | "default" | "preset";
  readonly slug: ComponentSlug;
  readonly source: string;
}

function runtimeDefinition(slug: ComponentSlug): RuntimeDefinition {
  const definition = componentCatalog.get(slug);
  if (!definition) throw new Error(`Missing component definition: ${slug}`);
  return definition as unknown as RuntimeDefinition;
}

function generate(
  slug: ComponentSlug,
  values: Record<string, JsonPrimitive> = {},
) {
  const definition = runtimeDefinition(slug);
  return generateCodeForDefinition(
    definition,
    { ...definition.defaults, ...values },
    defaultCodegenContext,
  ).source;
}

export function canonicalGeneratedSamples(): readonly CanonicalGeneratedSample[] {
  return codegenComponentSlugs.flatMap((slug) => {
    const definition = runtimeDefinition(slug);
    return [
      {
        id: `${slug}/default`,
        kind: "default" as const,
        slug,
        source: generate(slug),
      },
      ...definition.presets.map((preset) => ({
        id: `${slug}/preset/${preset.id}`,
        kind: "preset" as const,
        slug,
        source: generate(slug, preset.config as RuntimeConfig),
      })),
      {
        id: `${slug}/custom`,
        kind: "custom" as const,
        slug,
        source: generate(slug, representativeCodegenConfigs[slug]),
      },
    ];
  });
}
