import type { ComponentDocDefinition, ComponentSlug } from "./types";
import {
  canonicalStringify,
  containsBlockedUrlScheme,
  normalizeConfig,
  serializableValues,
} from "./schema";

export const CURRENT_PLAYGROUND_SCHEMA_VERSION = 1;
export const MAX_SHARE_URL_BYTES = 2048;
export const URL_REPLACE_DEBOUNCE_MS = 220;
const MAX_ENCODED_INPUT_LENGTH = 3072;

export type ConfigNoticeKind =
  "future-version" | "invalid" | "normalized" | "oversized" | "unknown-fields";

export interface ConfigNotice {
  readonly kind: ConfigNoticeKind;
  readonly message: string;
}

interface Payload {
  readonly component: ComponentSlug;
  readonly schemaVersion: number;
  readonly values: Record<string, unknown>;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export interface DecodedConfig<C extends object> {
  readonly config: C;
  readonly notice: ConfigNotice | null;
}

export interface ShareUrlResult {
  readonly ok: boolean;
  readonly relativeUrl: string;
  readonly fullUrl: string;
  readonly byteLength: number;
  readonly notice: ConfigNotice | null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeBase64Url(value: string): string {
  return bytesToBase64(new TextEncoder().encode(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

export function decodeBase64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]*$/u.test(value)) {
    throw new Error("Malformed base64url input");
  }
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + padding;
  return new TextDecoder("utf-8", { fatal: true }).decode(
    base64ToBytes(base64),
  );
}

export type Migration = (
  values: Record<string, unknown>,
) => Record<string, unknown>;
export type MigrationTable = Readonly<Record<number, Migration>>;

export function applyMigrations(
  fromVersion: number,
  toVersion: number,
  values: Record<string, unknown>,
  migrations: MigrationTable,
) {
  let current = values;
  for (let version = fromVersion; version < toVersion; version += 1) {
    const migrate = migrations[version];
    if (!migrate)
      throw new Error(`Missing migration from version ${String(version)}`);
    current = migrate(current);
  }
  return current;
}

// v1 is the first production URL format. Real historical migrations are added
// here only when a prior public schema actually exists.
export const playgroundMigrations: MigrationTable = Object.freeze({});

function invalid<C extends object>(
  definition: ComponentDocDefinition<C>,
  message: string,
  kind: ConfigNoticeKind = "invalid",
): DecodedConfig<C> {
  return {
    config: { ...definition.defaults },
    notice: { kind, message },
  };
}

export function decodePlaygroundConfig<C extends object>(
  definition: ComponentDocDefinition<C>,
  query: { readonly cfg?: string; readonly v?: string },
): DecodedConfig<C> {
  if (!query.cfg && !query.v) {
    return { config: { ...definition.defaults }, notice: null };
  }
  const version = Number(query.v);
  if (!Number.isInteger(version) || version < 1 || !query.cfg) {
    return invalid(
      definition,
      "This playground link is invalid. Using safe defaults.",
    );
  }
  if (version > definition.schemaVersion) {
    return invalid(
      definition,
      "This playground link was created with a newer configuration version. Using safe defaults.",
      "future-version",
    );
  }
  if (query.cfg.length > MAX_ENCODED_INPUT_LENGTH) {
    return invalid(
      definition,
      "This playground link is too large to restore safely. Using safe defaults.",
      "oversized",
    );
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(query.cfg)) as unknown;
    if (!isUnknownRecord(parsed)) {
      return invalid(
        definition,
        "This playground link is invalid. Using safe defaults.",
      );
    }
    const payload = parsed;
    if (
      payload.component !== definition.slug ||
      payload.schemaVersion !== version ||
      !isUnknownRecord(payload.values)
    ) {
      return invalid(
        definition,
        "This playground link does not match this component. Using safe defaults.",
      );
    }
    if (containsBlockedUrlScheme(payload.values)) {
      return invalid(
        definition,
        "This playground link contains a blocked URL value. Using safe defaults.",
      );
    }
    const migrated =
      version < definition.schemaVersion
        ? applyMigrations(
            version,
            definition.schemaVersion,
            payload.values,
            playgroundMigrations,
          )
        : payload.values;
    const result = normalizeConfig(definition, {
      ...definition.defaults,
      ...migrated,
    });
    const notice =
      result.unknownKeys.length > 0
        ? {
            kind: "unknown-fields" as const,
            message: "Unknown playground fields were ignored safely.",
          }
        : result.invalidKeys.length > 0
          ? {
              kind: "normalized" as const,
              message: "Some playground values were restored to safe limits.",
            }
          : null;
    return { config: result.config, notice };
  } catch {
    return invalid(
      definition,
      "This playground link could not be read. Using safe defaults.",
    );
  }
}

export function canonicalPayload<C extends object>(
  definition: ComponentDocDefinition<C>,
  config: C,
) {
  return {
    component: definition.slug,
    schemaVersion: definition.schemaVersion,
    values: serializableValues(definition, config),
  } satisfies Payload;
}

export function createShareUrl<C extends object>(
  definition: ComponentDocDefinition<C>,
  config: C,
  origin: string,
): ShareUrlResult {
  const payload = canonicalPayload(definition, config);
  const hasValues = Object.keys(payload.values).length > 0;
  const relativeUrl = hasValues
    ? `/playground/${definition.slug}?v=${String(definition.schemaVersion)}&cfg=${encodeBase64Url(canonicalStringify(payload))}`
    : `/playground/${definition.slug}`;
  const fullUrl = new URL(relativeUrl, origin).toString();
  const byteLength = new TextEncoder().encode(fullUrl).byteLength;
  if (byteLength > MAX_SHARE_URL_BYTES) {
    return {
      ok: false,
      relativeUrl,
      fullUrl,
      byteLength,
      notice: {
        kind: "oversized",
        message:
          "This configuration is usable here but is too large to share in a Scout UI URL.",
      },
    };
  }
  return { ok: true, relativeUrl, fullUrl, byteLength, notice: null };
}
