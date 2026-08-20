import type {
  ComponentDocDefinition,
  ConfigField,
  JsonPrimitive,
} from "./types";

const blockedKeys = new Set(["__proto__", "constructor", "prototype"]);
const blockedSchemes = /^(?:data|javascript|blob):/iu;

function isBlockedControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return (
    code <= 8 ||
    code === 11 ||
    code === 12 ||
    (code >= 14 && code <= 31) ||
    code === 127
  );
}

function containsControlCharacters(value: string): boolean {
  return Array.from(value).some(isBlockedControlCharacter);
}

function removeControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => !isBlockedControlCharacter(character))
    .join("");
}

export function isBlockedConfigKey(key: string) {
  return blockedKeys.has(key);
}

export function containsBlockedUrlScheme(value: unknown): boolean {
  if (typeof value === "string") return blockedSchemes.test(value.trim());
  if (Array.isArray(value)) return value.some(containsBlockedUrlScheme);
  if (value !== null && typeof value === "object") {
    return Object.values(value).some(containsBlockedUrlScheme);
  }
  return false;
}

function optionValues<C extends object>(field: ConfigField<C>) {
  return "options" in field ? field.options.map((option) => option.value) : [];
}

export function isFieldVisible<C extends object>(
  field: ConfigField<C>,
  config: Readonly<C>,
): boolean {
  const condition = field.visibleWhen;
  if (!condition) return true;
  const current = config[condition.field];
  return Array.isArray(condition.equals)
    ? condition.equals.includes(current)
    : current === condition.equals;
}

export function validateFieldValue<C extends object>(
  field: ConfigField<C>,
  value: unknown,
): boolean {
  switch (field.validation.type) {
    case "boolean":
      return typeof value === "boolean";
    case "finite-number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= field.validation.min &&
        value <= field.validation.max
      );
    case "option":
    case "approved-sticker-id":
      return optionValues(field).includes(value as string | number);
    case "hex-color":
      return typeof value === "string" && /^#[0-9a-f]{6}$/iu.test(value);
    case "short-text":
      return (
        typeof value === "string" &&
        value.length <= field.validation.maxLength &&
        !containsControlCharacters(value)
      );
  }
}

export function normalizeFieldValue<C extends object>(
  field: ConfigField<C>,
  value: unknown,
): JsonPrimitive {
  switch (field.normalization) {
    case "boolean-fallback":
      return typeof value === "boolean" ? value : field.default;
    case "finite-clamp": {
      const numeric =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : Number.NaN;
      if (!Number.isFinite(numeric)) return field.default;
      const clamped = Math.min(field.max, Math.max(field.min, numeric));
      const steps = Math.round((clamped - field.min) / field.step);
      return Number((field.min + steps * field.step).toFixed(6));
    }
    case "option-fallback":
      return optionValues(field).includes(value as string | number)
        ? (value as string | number)
        : field.default;
    case "hex-color-fallback":
      return typeof value === "string" && /^#[0-9a-f]{6}$/iu.test(value)
        ? value.toUpperCase()
        : field.default;
    case "short-text": {
      if (typeof value !== "string") return field.default;
      return removeControlCharacters(value).trim().slice(0, field.maxLength);
    }
  }
}

export interface NormalizationResult<C extends object> {
  readonly config: C;
  readonly changed: boolean;
  readonly unknownKeys: readonly string[];
  readonly invalidKeys: readonly string[];
}

export function normalizeConfig<C extends object>(
  definition: ComponentDocDefinition<C>,
  input: unknown,
): NormalizationResult<C> {
  const source =
    input !== null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const known = new Set(definition.schema.fields.map((field) => field.key));
  const unknownKeys = Object.keys(source).filter(
    (key) => !known.has(key as keyof C & string) || isBlockedConfigKey(key),
  );
  const invalidKeys: string[] = [];
  const output = Object.create(null) as Record<string, JsonPrimitive>;

  for (const field of definition.schema.fields) {
    const raw = Object.hasOwn(source, field.key)
      ? source[field.key]
      : definition.defaults[field.key];
    const normalized = normalizeFieldValue(field, raw);
    output[field.key] = normalized;
    if (Object.hasOwn(source, field.key) && !validateFieldValue(field, raw)) {
      invalidKeys.push(field.key);
    }
  }

  const config = { ...output } as C;
  return {
    config,
    changed: unknownKeys.length > 0 || invalidKeys.length > 0,
    unknownKeys,
    invalidKeys,
  };
}

export function stableCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableCanonicalValue);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => !isBlockedConfigKey(key))
        .sort()
        .map((key) => [key, stableCanonicalValue(record[key])]),
    );
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(stableCanonicalValue(value));
}

export function configsEqual<C extends object>(left: C, right: C): boolean {
  return canonicalStringify(left) === canonicalStringify(right);
}

export function isConfigDirty<C extends object>(
  definition: ComponentDocDefinition<C>,
  config: C,
) {
  return !configsEqual(normalizeConfig(definition, config).config, {
    ...definition.defaults,
  } as C);
}

export function selectedPresetId<C extends object>(
  definition: ComponentDocDefinition<C>,
  config: C,
): string | null {
  const canonical = normalizeConfig(definition, config).config;
  return (
    definition.presets.find((preset) =>
      configsEqual(
        canonical,
        normalizeConfig(definition, preset.config).config,
      ),
    )?.id ?? null
  );
}

export function serializableValues<C extends object>(
  definition: ComponentDocDefinition<C>,
  config: C,
): Record<string, JsonPrimitive> {
  const normalized = normalizeConfig(definition, config).config;
  const values: Record<string, JsonPrimitive> = {};
  for (const field of definition.schema.fields) {
    const value = normalized[field.key] as JsonPrimitive;
    if (
      field.shareable &&
      field.serialization === "non-default" &&
      isFieldVisible(field, normalized) &&
      value !== definition.defaults[field.key] &&
      !containsBlockedUrlScheme(value)
    ) {
      values[field.key] = value;
    }
  }
  return values;
}

export function assertDefinitionIntegrity<C extends object>(
  definition: ComponentDocDefinition<C>,
) {
  const keys = definition.schema.fields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error(`Duplicate schema field in ${definition.slug}`);
  }
  const presetIds = definition.presets.map((preset) => preset.id);
  const presetNames = definition.presets.map((preset) => preset.name);
  if (
    new Set(presetIds).size !== presetIds.length ||
    new Set(presetNames).size !== presetNames.length
  ) {
    throw new Error(`Duplicate preset identity in ${definition.slug}`);
  }
  for (const preset of definition.presets) {
    const result = normalizeConfig(definition, preset.config);
    if (result.changed) {
      throw new Error(`Invalid preset ${preset.id} in ${definition.slug}`);
    }
  }
}
