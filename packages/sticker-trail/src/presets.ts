import { clamp, normalizeRange } from "./geometry.js";
import { hashSeed } from "./sequence.js";
import type {
  NumberRange,
  ResolvedTrailOptions,
  StickerTrailExit,
  StickerTrailOptions,
  StickerTrailPreset,
} from "./types.js";

/**
 * Tier 1 — the engine's absolute safety ceiling.
 *
 * These are not defaults and never a preset value. Every preset value and every
 * consumer value is clamped into these bounds. Nothing in the library may raise
 * them; see SCOUT_UI_ENGINEERING_SPEC.md section 15.7.
 */
export const TRAIL_HARD_LIMITS = {
  maxActive: { min: 4, max: 48 },
  lifetime: { min: 150, max: 5000 },
  size: { min: 16, max: 256 },
  rotation: { min: -180, max: 180 },
  scale: { min: 0.1, max: 4 },
  spacing: { min: 4, max: 512 },
  spawnsPerFrame: 6,
} as const satisfies Record<string, NumberRange | number>;

export const DEFAULT_TRAIL_PRESET: StickerTrailPreset = "scout";

/**
 * Tier 2 baseline: the active-node count a trail uses when a consumer names
 * neither a preset nor an explicit maximum. It is the `scout` value, and is
 * deliberately well below the tier-1 ceiling.
 */
export const DEFAULT_MAX_ACTIVE = 24;

export interface TrailPresetValues {
  readonly size: NumberRange;
  readonly spacing: NumberRange;
  /** Pixels of extra spacing per unit of smoothed velocity (px/ms). */
  readonly velocityFactor: number;
  readonly lifetime: number;
  readonly maxActive: number;
  readonly rotation: NumberRange;
  readonly scale: NumberRange;
  readonly exit: StickerTrailExit;
  /** Upward travel in pixels across a slot's life; only used by `float`. */
  readonly drift: number;
}

/**
 * Tier 2 — tuned preset values.
 *
 * `scout` is the signature reference experience and the default: mid-size
 * artwork, velocity-aware spacing that stays legible during a fast flick,
 * restrained rotation, and a life short enough that a hero never accumulates
 * clutter.
 *
 * `chaos` deliberately shares `dense`'s active-node maximum. Its expressiveness
 * comes from scale and rotation variance, never from more simultaneous nodes.
 */
export const stickerTrailPresets: Readonly<
  Record<StickerTrailPreset, TrailPresetValues>
> = {
  calm: {
    drift: 0,
    exit: "fade",
    lifetime: 900,
    maxActive: 14,
    rotation: { min: -6, max: 6 },
    scale: { min: 0.94, max: 1.04 },
    size: { min: 52, max: 72 },
    spacing: { min: 58, max: 92 },
    velocityFactor: 14,
  },
  scout: {
    drift: 0,
    exit: "fade",
    lifetime: 1100,
    maxActive: DEFAULT_MAX_ACTIVE,
    rotation: { min: -12, max: 12 },
    scale: { min: 0.9, max: 1.08 },
    size: { min: 64, max: 92 },
    spacing: { min: 34, max: 58 },
    velocityFactor: 10,
  },
  dense: {
    drift: 0,
    exit: "fade",
    lifetime: 900,
    maxActive: 32,
    rotation: { min: -10, max: 10 },
    scale: { min: 0.88, max: 1.04 },
    size: { min: 40, max: 64 },
    spacing: { min: 20, max: 34 },
    velocityFactor: 6,
  },
  floaty: {
    drift: 28,
    exit: "float",
    lifetime: 1800,
    maxActive: 20,
    rotation: { min: -8, max: 8 },
    scale: { min: 0.9, max: 1.06 },
    size: { min: 56, max: 84 },
    spacing: { min: 44, max: 72 },
    velocityFactor: 12,
  },
  chaos: {
    drift: 0,
    exit: "shrink",
    lifetime: 1000,
    maxActive: 32,
    rotation: { min: -32, max: 32 },
    scale: { min: 0.72, max: 1.28 },
    size: { min: 44, max: 104 },
    spacing: { min: 26, max: 46 },
    velocityFactor: 8,
  },
};

/**
 * Tier 3 — resolve consumer options over a preset, then clamp everything into
 * the hard limits. Explicit values always win over the preset; the hard limits
 * always win over both.
 */
export function resolveTrailOptions(
  options: StickerTrailOptions,
): ResolvedTrailOptions {
  const preset = stickerTrailPresets[options.preset ?? DEFAULT_TRAIL_PRESET];

  return {
    clip: options.clip ?? true,
    drift: preset.drift,
    enabled: options.enabled ?? true,
    exit: options.exit ?? preset.exit,
    lifetime: clamp(
      options.lifetime ?? preset.lifetime,
      TRAIL_HARD_LIMITS.lifetime.min,
      TRAIL_HARD_LIMITS.lifetime.max,
    ),
    maxActive: Math.round(
      clamp(
        options.maxActive ?? preset.maxActive,
        TRAIL_HARD_LIMITS.maxActive.min,
        TRAIL_HARD_LIMITS.maxActive.max,
      ),
    ),
    reducedMotion: options.reducedMotion ?? "system",
    rotation: normalizeRange(
      options.rotation ?? preset.rotation,
      TRAIL_HARD_LIMITS.rotation,
    ),
    scale: normalizeRange(
      options.scale ?? preset.scale,
      TRAIL_HARD_LIMITS.scale,
    ),
    seed: hashSeed(options.seed),
    sequence: options.sequence ?? "random",
    size: normalizeRange(options.size ?? preset.size, TRAIL_HARD_LIMITS.size),
    spacing: normalizeRange(
      options.spacing ?? preset.spacing,
      TRAIL_HARD_LIMITS.spacing,
    ),
    stickers: options.stickers,
    touch: options.touch ?? "none",
    velocityFactor: preset.velocityFactor,
  };
}

/**
 * A stable semantic key for a set of options. React memoizes engine setup on
 * this rather than object identity, so a consumer may inline the `stickers`
 * array without restarting the engine on every parent render.
 */
export function buildTrailSignature(resolved: ResolvedTrailOptions): string {
  return JSON.stringify([
    resolved.stickers.map((sticker) => [
      sticker.id,
      sticker.src,
      sticker.width ?? 0,
      sticker.height ?? 0,
    ]),
    resolved.clip,
    resolved.drift,
    resolved.enabled,
    resolved.exit,
    resolved.lifetime,
    resolved.maxActive,
    resolved.reducedMotion,
    resolved.rotation,
    resolved.scale,
    resolved.seed,
    resolved.sequence,
    resolved.size,
    resolved.spacing,
    resolved.touch,
    resolved.velocityFactor,
  ]);
}
