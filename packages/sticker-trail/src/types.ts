// These generic structural types are owned locally so the standalone package
// never depends on @scout-ui/react or @scout-ui/stickers. They stay
// structurally equivalent to the broad package's definitions, and
// packages/react/tests/trail-type-parity.test-d.tsx proves mutual
// assignability so the two copies cannot drift.

export interface StickerSource {
  id: string;
  src: string;
  width?: number;
  height?: number;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface ScoutMotionPolicy {
  reducedMotion?: "system" | "always";
}

export type StickerTrailPreset =
  "calm" | "scout" | "dense" | "floaty" | "chaos";

export type StickerTrailSequence = "ordered" | "random";
export type StickerTrailExit = "fade" | "shrink" | "float";
export type StickerTrailTouch = "none" | "tap";

export interface StickerTrailOptions extends ScoutMotionPolicy {
  stickers: readonly StickerSource[];
  preset?: StickerTrailPreset;
  enabled?: boolean;
  size?: NumberRange;
  spacing?: NumberRange;
  lifetime?: number;
  maxActive?: number;
  rotation?: NumberRange;
  scale?: NumberRange;
  sequence?: StickerTrailSequence;
  seed?: string | number;
  exit?: StickerTrailExit;
  touch?: StickerTrailTouch;
  clip?: boolean;
}

export interface StickerTrailController {
  clear(): void;
  pause(): void;
  resume(): void;
}

/**
 * Every option decided. Presets, defaults, and safety clamping are already
 * applied, so the engine never re-reads the public option shape.
 */
export interface ResolvedTrailOptions {
  readonly stickers: readonly StickerSource[];
  readonly enabled: boolean;
  readonly size: NumberRange;
  readonly spacing: NumberRange;
  readonly velocityFactor: number;
  readonly lifetime: number;
  readonly maxActive: number;
  readonly rotation: NumberRange;
  readonly scale: NumberRange;
  readonly sequence: StickerTrailSequence;
  readonly seed: number;
  readonly exit: StickerTrailExit;
  readonly touch: StickerTrailTouch;
  readonly clip: boolean;
  readonly reducedMotion: "system" | "always";
  readonly drift: number;
}
