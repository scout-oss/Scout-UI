import { componentCatalog } from "../registry";
import type {
  ComponentDocDefinition,
  ComponentSlug,
  JsonPrimitive,
  PromptContext,
} from "../component-registry/types";
import { representativeCodegenConfigs } from "../codegen/canonical-samples";
import {
  defaultPromptContextForDefinition,
  generatePromptForDefinition,
} from "./generate-prompt";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;

export const promptComponentSlugs = Object.freeze([
  "sticker",
  "sticker-button",
  "sticker-badge",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const satisfies readonly ComponentSlug[]);

export interface CanonicalPromptSample {
  readonly detail: "concise" | "detailed";
  readonly id: string;
  readonly kind: "custom" | "default" | "preset";
  readonly slug: ComponentSlug;
  readonly text: string;
}

function runtimeDefinition(slug: ComponentSlug): RuntimeDefinition {
  const definition = componentCatalog.get(slug);
  if (!definition) throw new Error(`Missing component definition: ${slug}`);
  return definition as unknown as RuntimeDefinition;
}

function contextFor(
  definition: RuntimeDefinition,
  detail: PromptContext["detail"],
): PromptContext {
  return { ...defaultPromptContextForDefinition(definition), detail };
}

function generate(
  definition: RuntimeDefinition,
  values: Readonly<RuntimeConfig>,
  detail: PromptContext["detail"],
) {
  return generatePromptForDefinition(
    definition,
    { ...definition.defaults, ...values },
    contextFor(definition, detail),
  ).text;
}

export function canonicalPromptSamples(): readonly CanonicalPromptSample[] {
  return promptComponentSlugs.flatMap((slug) => {
    const definition = runtimeDefinition(slug);
    const defaultAndPresets = (["detailed", "concise"] as const).flatMap(
      (detail) => [
        {
          detail,
          id: `${slug}/default/${detail}`,
          kind: "default" as const,
          slug,
          text: generate(definition, {}, detail),
        },
        ...definition.presets.map((preset) => ({
          detail,
          id: `${slug}/preset/${preset.id}/${detail}`,
          kind: "preset" as const,
          slug,
          text: generate(definition, preset.config, detail),
        })),
      ],
    );
    return [
      ...defaultAndPresets,
      {
        detail: "detailed" as const,
        id: `${slug}/custom/detailed`,
        kind: "custom" as const,
        slug,
        text: generate(
          definition,
          representativeCodegenConfigs[slug],
          "detailed",
        ),
      },
    ];
  });
}
