"use client";

// The entire public runtime is interactive, so the package root is the client
// boundary. Nothing below reads a browser global at module evaluation.
export { StickerTrail } from "./StickerTrail.js";
export type { StickerTrailProps } from "./StickerTrail.js";
export { useStickerTrail } from "./useStickerTrail.js";
export type { UseStickerTrailOptions } from "./useStickerTrail.js";
export type {
  NumberRange,
  ScoutMotionPolicy,
  StickerSource,
  StickerTrailController,
  StickerTrailExit,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailSequence,
  StickerTrailTouch,
} from "./types.js";
