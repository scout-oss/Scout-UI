import {
  componentDefinitions,
  componentSlugs,
} from "./component-registry/definitions";
import {
  assertDefinitionIntegrity,
  configsEqual,
  isConfigDirty,
  isFieldVisible,
  normalizeConfig,
  selectedPresetId,
  serializableValues,
  validateFieldValue,
} from "./component-registry/schema";
import type {
  AnyComponentDocDefinition,
  ComponentConfigMap,
  ComponentDocDefinition,
  ComponentSlug,
  ConfigField,
  ConfigPreset,
  ConfigSchema,
  ControlGroup,
  DocsPackageName,
} from "./component-registry/types";

export type {
  AnyComponentDocDefinition,
  ComponentConfigMap,
  ComponentDocDefinition,
  ComponentSlug,
  ConfigField,
  ConfigPreset,
  ConfigSchema,
  ControlGroup,
  DocsPackageName,
};
export type ComponentSummaryDefinition = AnyComponentDocDefinition;
export type ComponentStatus = AnyComponentDocDefinition["status"];
export {
  componentDefinitions,
  componentSlugs,
  configsEqual,
  isConfigDirty,
  isFieldVisible,
  normalizeConfig,
  selectedPresetId,
  serializableValues,
  validateFieldValue,
};

export interface RegistryDefinition {
  readonly slug: string;
  readonly name: string;
  readonly packageName: DocsPackageName;
  readonly status: ComponentStatus;
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
    definitions.map((definition) => Object.freeze(definition)),
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

export function isComponentSlug(value: string): value is ComponentSlug {
  return componentSlugs.includes(value as ComponentSlug);
}

export function getComponentDefinition<S extends ComponentSlug>(
  slug: S,
): ComponentDocDefinition<ComponentConfigMap[S]>;
export function getComponentDefinition(
  slug: string,
): AnyComponentDocDefinition | undefined;
export function getComponentDefinition(
  slug: string,
): AnyComponentDocDefinition | undefined {
  return isComponentSlug(slug) ? componentDefinitions[slug] : undefined;
}

export const componentCatalog = createRegistry<AnyComponentDocDefinition>([
  componentDefinitions.sticker,
  componentDefinitions["sticker-button"],
  componentDefinitions["sticker-badge"],
  componentDefinitions["sticker-trail"],
  componentDefinitions["sticker-cursor"],
  componentDefinitions["sticker-peel"],
  componentDefinitions["sticker-stack"],
  componentDefinitions["sticker-navbar"],
]);

for (const definition of componentCatalog.entries) {
  assertDefinitionIntegrity(
    definition as unknown as ComponentDocDefinition<
      Record<string, string | number | boolean | null>
    >,
  );
}
