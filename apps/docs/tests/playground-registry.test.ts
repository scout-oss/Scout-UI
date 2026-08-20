import { describe, expect, it } from "vitest";

import {
  canonicalStringify,
  configsEqual,
  isConfigDirty,
  isFieldVisible,
  normalizeConfig,
  selectedPresetId,
  serializableValues,
  validateFieldValue,
} from "../lib/component-registry/schema";
import type {
  ColorControlField,
  ComponentDocDefinition,
  ComponentSlug,
  JsonPrimitive,
} from "../lib/component-registry/types";
import {
  applyMigrations,
  canonicalPayload,
  createShareUrl,
  decodeBase64Url,
  decodePlaygroundConfig,
  encodeBase64Url,
  MAX_SHARE_URL_BYTES,
} from "../lib/component-registry/url-state";
import { componentCatalog } from "../lib/registry";

const expectedSlugs = [
  "sticker",
  "sticker-button",
  "sticker-badge",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const;

type RuntimeConfig = Record<string, JsonPrimitive>;

function requireDefinition(
  slug: ComponentSlug,
): ComponentDocDefinition<RuntimeConfig> {
  const definition = componentCatalog.get(slug);
  if (!definition) throw new Error(`Missing registry definition for ${slug}`);
  return definition as unknown as ComponentDocDefinition<RuntimeConfig>;
}

function queryFor(url: string) {
  const parsed = new URL(url, "https://scout-ui.test");
  const cfg = parsed.searchParams.get("cfg");
  const version = parsed.searchParams.get("v");
  return {
    ...(cfg ? { cfg } : {}),
    ...(version ? { v: version } : {}),
  };
}

function payloadUrl(
  slug: ComponentSlug,
  values: Record<string, unknown>,
  version = 1,
) {
  const payload = JSON.stringify({
    component: slug,
    schemaVersion: version,
    values,
  });
  return { cfg: encodeBase64Url(payload), v: String(version) };
}

describe("M13 typed component registry", () => {
  it("contains exactly eight complete definitions in deterministic order", () => {
    expect(
      componentCatalog.entries.map((definition) => definition.slug),
    ).toEqual(expectedSlugs);
    expect(componentCatalog.entries).toHaveLength(8);
    for (const slug of expectedSlugs) {
      const definition = requireDefinition(slug);
      expect(componentCatalog.get(slug)).toBeDefined();
      expect(definition.schemaVersion).toBe(1);
      expect(definition.schema.fields.length).toBeGreaterThan(4);
      expect(definition.presets.length).toBeGreaterThanOrEqual(2);
      expect(typeof definition.generateCode).toBe("function");
      expect("generatePrompt" in definition).toBe(false);
    }
  });

  it("gives every field validation, normalization, sharing, code and prompt metadata", () => {
    const kinds = new Set<string>();
    for (const definition of componentCatalog.entries) {
      for (const field of definition.schema.fields) {
        kinds.add(field.kind);
        expect(field.key).not.toBe("");
        expect(field.label).not.toBe("");
        expect(field.description).not.toBe("");
        expect(field.validation.type).not.toBe("");
        expect(field.normalization).not.toBe("");
        expect(["non-default", "never"]).toContain(field.serialization);
        expect(typeof field.shareable).toBe("boolean");
        expect(typeof field.codegen.omitWhenDefault).toBe("boolean");
        expect(field.prompt.description).not.toBe("");
        if (["select", "segmented", "sticker"].includes(field.kind)) {
          expect("options" in field && Array.isArray(field.options)).toBe(true);
        }
      }
    }
    expect(kinds).toEqual(
      new Set([
        "boolean",
        "number",
        "range",
        "select",
        "segmented",
        "sticker",
        "text",
      ]),
    );
  });

  it("supports the generic color field without inventing a production prop", () => {
    type Fixture = { accent: string };
    const colorField: ColorControlField<Fixture> = {
      key: "accent",
      label: "Accent",
      description: "Test-only styling-contract fixture.",
      group: "Appearance",
      default: "#7C2CFF",
      kind: "color",
      validation: { type: "hex-color" },
      normalization: "hex-color-fallback",
      shareable: true,
      serialization: "non-default",
      codegen: { prop: null, omitWhenDefault: true },
      prompt: { description: "Changes an approved CSS customization point." },
    };
    expect(validateFieldValue(colorField, "#61DBE8")).toBe(true);
    expect(validateFieldValue(colorField, "red")).toBe(false);
  });

  it("keeps definitions, defaults, schemas and presets immutable", () => {
    for (const definition of componentCatalog.entries) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.defaults)).toBe(true);
      expect(Object.isFrozen(definition.schema)).toBe(true);
      expect(Object.isFrozen(definition.schema.fields)).toBe(true);
      expect(Object.isFrozen(definition.presets)).toBe(true);
      for (const preset of definition.presets)
        expect(Object.isFrozen(preset.config)).toBe(true);
    }
  });

  it("normalizes invalid numeric, enum, sticker and text input through one path", () => {
    const trail = requireDefinition("sticker-trail");
    const normalizedTrail = normalizeConfig(trail, {
      ...trail.defaults,
      lifetime: Number.POSITIVE_INFINITY,
      maxActive: 999,
      preset: "not-real",
      stickerId: "private-sticker",
    });
    expect(normalizedTrail.config.lifetime).toBe(trail.defaults.lifetime);
    expect(normalizedTrail.config.maxActive).toBe(48);
    expect(normalizedTrail.config.preset).toBe(trail.defaults.preset);
    expect(normalizedTrail.config.stickerId).toBe(trail.defaults.stickerId);
    expect(normalizedTrail.invalidKeys).toEqual(
      expect.arrayContaining(["lifetime", "maxActive", "preset", "stickerId"]),
    );

    const button = requireDefinition("sticker-button");
    expect(
      normalizeConfig(button, {
        ...button.defaults,
        label: "  hi\u0000there  ",
      }).config.label,
    ).toBe("hithere");
  });

  it("retains hidden values locally but omits them from share serialization", () => {
    const button = requireDefinition("sticker-button");
    const config = normalizeConfig(button, {
      ...button.defaults,
      element: "anchor",
      loading: true,
    }).config;
    const loadingField = button.schema.fields.find(
      (field) => field.key === "loading",
    );
    expect(loadingField && isFieldVisible(loadingField, config)).toBe(false);
    expect(config.loading).toBe(true);
    expect(serializableValues(button, config)).not.toHaveProperty("loading");
  });

  it("validates every preset and derives canonical dirty/preset state", () => {
    for (const definition of componentCatalog.entries) {
      const runtime = definition as unknown as ComponentDocDefinition<
        Record<string, string | number | boolean | null>
      >;
      expect(isConfigDirty(runtime, { ...runtime.defaults })).toBe(false);
      expect(selectedPresetId(runtime, { ...runtime.defaults })).toBe(
        runtime.presets[0]?.id,
      );
      for (const preset of runtime.presets) {
        const result = normalizeConfig(runtime, preset.config);
        expect(result.changed).toBe(false);
        expect(selectedPresetId(runtime, result.config)).toBe(preset.id);
      }
    }
  });
});

describe("M13 canonical URL state", () => {
  it("uses stable canonical ordering and standards-compatible Unicode base64url", () => {
    expect(canonicalStringify({ z: 1, a: { y: 2, b: 3 } })).toBe(
      canonicalStringify({ a: { b: 3, y: 2 }, z: 1 }),
    );
    const unicode = "Scout ✦ नमस्ते こんにちは";
    expect(decodeBase64Url(encodeBase64Url(unicode))).toBe(unicode);
    expect(encodeBase64Url(unicode)).toMatch(/^[A-Za-z0-9_-]+$/u);
  });

  it("round-trips default, preset, and custom state for all eight definitions", () => {
    for (const slug of expectedSlugs) {
      const definition = requireDefinition(slug);
      const secondPreset = definition.presets[1];
      const lastPreset = definition.presets.at(-1);
      const firstField = definition.schema.fields[0];
      if (!lastPreset) {
        throw new Error(`Incomplete registry definition for ${slug}`);
      }
      const cases = [
        { ...definition.defaults },
        { ...secondPreset.config },
        normalizeConfig(definition, {
          ...definition.defaults,
          [firstField.key]: lastPreset.config[firstField.key],
        }).config,
      ];
      for (const config of cases) {
        const share = createShareUrl(
          definition,
          config,
          "https://scout-ui.test",
        );
        expect(share.ok).toBe(true);
        expect(share.byteLength).toBeLessThanOrEqual(MAX_SHARE_URL_BYTES);
        const restored = decodePlaygroundConfig(
          definition,
          queryFor(share.relativeUrl),
        );
        expect(
          configsEqual(
            restored.config,
            normalizeConfig(definition, config).config,
          ),
        ).toBe(true);
      }
    }
  });

  it("omits explicit defaults and produces byte-identical URLs", () => {
    const definition = requireDefinition("sticker");
    const first = createShareUrl(
      definition,
      { ...definition.defaults },
      "https://scout-ui.test",
    );
    const second = createShareUrl(
      definition,
      normalizeConfig(definition, { ...definition.defaults, rotation: "-6" })
        .config,
      "https://scout-ui.test",
    );
    expect(first.relativeUrl).toBe("/playground/sticker");
    expect(second.relativeUrl).toBe(first.relativeUrl);
    expect(canonicalPayload(definition, definition.defaults).values).toEqual(
      {},
    );
  });

  it("recovers safely from malformed, mismatched, future, unknown and hostile payloads", () => {
    const definition = requireDefinition("sticker-button");
    expect(
      decodePlaygroundConfig(definition, { cfg: "%%%", v: "1" }).notice?.kind,
    ).toBe("invalid");
    expect(
      decodePlaygroundConfig(definition, {
        cfg: encodeBase64Url("not json"),
        v: "1",
      }).notice?.kind,
    ).toBe("invalid");
    expect(
      decodePlaygroundConfig(definition, payloadUrl("sticker", {}, 1)).notice
        ?.kind,
    ).toBe("invalid");
    expect(
      decodePlaygroundConfig(definition, payloadUrl("sticker-button", {}, 2))
        .notice?.kind,
    ).toBe("future-version");
    expect(
      decodePlaygroundConfig(
        definition,
        payloadUrl("sticker-button", { unknown: true }),
      ).notice?.kind,
    ).toBe("unknown-fields");
    for (const key of ["__proto__", "constructor", "prototype"]) {
      const raw = `{"component":"sticker-button","schemaVersion":1,"values":{"${key}":{"polluted":true}}}`;
      const restored = decodePlaygroundConfig(definition, {
        cfg: encodeBase64Url(raw),
        v: "1",
      });
      expect(restored.notice?.kind).toBe("unknown-fields");
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    }
    for (const value of [
      "data:text/html,boom",
      "javascript:alert(1)",
      "blob:https://bad.test/id",
    ]) {
      const restored = decodePlaygroundConfig(
        definition,
        payloadUrl("sticker-button", { label: value }),
      );
      expect(restored.notice?.kind).toBe("invalid");
      expect(restored.config).toEqual(definition.defaults);
    }
  });

  it("rejects oversized encoded input before decoding", () => {
    const definition = requireDefinition("sticker");
    const restored = decodePlaygroundConfig(definition, {
      cfg: "a".repeat(3073),
      v: "1",
    });
    expect(restored.notice?.kind).toBe("oversized");
    expect(restored.config).toEqual(definition.defaults);
  });

  it("provides deterministic migration-table infrastructure without inventing public history", () => {
    expect(
      applyMigrations(
        0,
        1,
        { oldTone: "acid" },
        {
          0: (values) => ({ tone: values.oldTone }),
        },
      ),
    ).toEqual({ tone: "acid" });
    expect(() => applyMigrations(0, 1, {}, {})).toThrow("Missing migration");
  });
});
