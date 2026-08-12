"use client";

// Trail-specific public API only. The generic structural types
// (`StickerSource`, `NumberRange`, `ScoutMotionPolicy`) stay owned by this
// package's own `shared-types` module, so `export *` is deliberately avoided:
// it would re-export a second copy of those names under the same identifiers.
export { StickerTrail, useStickerTrail } from "@scout-ui/sticker-trail";
export type {
  StickerTrailController,
  StickerTrailExit,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailProps,
  StickerTrailSequence,
  StickerTrailTouch,
  UseStickerTrailOptions,
} from "@scout-ui/sticker-trail";
