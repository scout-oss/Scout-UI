import type {
  CodegenContext,
  ComponentConfigMap,
  ComponentDocDefinition,
  ComponentSlug,
  ConfigField,
  PromptContext,
} from "../lib/component-registry/types";
import { componentDefinitions } from "../lib/component-registry/definitions";

const sticker = componentDefinitions.sticker;
const exactSticker: ComponentDocDefinition<ComponentConfigMap["sticker"]> =
  sticker;
void exactSticker;

const slugs: Record<ComponentSlug, true> = {
  sticker: true,
  "sticker-badge": true,
  "sticker-button": true,
  "sticker-trail": true,
  "sticker-cursor": true,
  "sticker-peel": true,
  "sticker-stack": true,
  "sticker-navbar": true,
};
void slugs;

const stickerField: ConfigField<ComponentConfigMap["sticker"]> =
  sticker.schema.fields[0]!;
void stickerField;

const wrongKey: ConfigField<ComponentConfigMap["sticker"]> = {
  ...sticker.schema.fields[0]!,
  // @ts-expect-error schema keys stay exact for each component config.
  key: "loading",
};
void wrongKey;

// @ts-expect-error defaults must match the exact config shape.
const incomplete: ComponentConfigMap["sticker-peel"] = { open: false };
void incomplete;

// @ts-expect-error the registry must never collapse exact configs to any.
const badSize: ComponentConfigMap["sticker-stack"]["visibleCount"] = "three";
void badSize;

const codegenContext: CodegenContext = { framework: "react" };
const stickerSource = sticker.generateCode(sticker.defaults, codegenContext);
void stickerSource;

// @ts-expect-error M14 intentionally exposes no invented framework variants.
const invalidCodegenContext: CodegenContext = { framework: "next" };
void invalidCodegenContext;

const promptContext: PromptContext = {
  framework: "next-app-router",
  targetLocation: "Existing hero action",
  assetStrategy: "bundled",
  preserveLayout: true,
  detail: "detailed",
  projectContext: "Keep the current typography and analytics behavior.",
};
const stickerPrompt = sticker.generatePrompt(sticker.defaults, promptContext);
void stickerPrompt.sections;
void stickerPrompt.text;

// @ts-expect-error prompt generation accepts only documented framework values.
const invalidPromptContext: PromptContext = { framework: "next" };
void invalidPromptContext;

sticker.generateCode(
  // @ts-expect-error each definition accepts only its exact component config.
  componentDefinitions["sticker-button"].defaults,
  codegenContext,
);
