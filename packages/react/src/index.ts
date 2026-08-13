// Keep this barrel unmarked and logic-free so each preserved leaf retains its
// own React Server Component classification.
export { Sticker } from "./sticker/index.js";
export type {
  StickerMaterial,
  StickerOutline,
  StickerProps,
  StickerShadow,
  StickerSize,
} from "./sticker/index.js";
export { StickerBadge } from "./sticker-badge/index.js";
export type { StickerBadgeProps } from "./sticker-badge/index.js";
export { StickerButton } from "./sticker-button/index.js";
export type { StickerButtonProps } from "./sticker-button/index.js";
export { StickerCursor } from "./sticker-cursor/index.js";
export type {
  CursorVisual,
  StickerCursorProps,
  StickerCursorState,
} from "./sticker-cursor/index.js";
export { StickerPeel } from "./sticker-peel/index.js";
export type { StickerPeelProps } from "./sticker-peel/index.js";
export { StickerStack } from "./sticker-stack/index.js";
export type { StickerStackProps } from "./sticker-stack/index.js";
export { StickerTrail, useStickerTrail } from "./sticker-trail/index.js";
export type {
  StickerTrailController,
  StickerTrailExit,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailProps,
  StickerTrailSequence,
  StickerTrailTouch,
  UseStickerTrailOptions,
} from "./sticker-trail/index.js";
export type {
  NumberRange,
  ScoutIntensity,
  ScoutMotionPolicy,
  ScoutStyleProperties,
  StickerSource,
  StickerTone,
} from "./shared-types.js";
export { scoutUiTokens } from "./tokens.generated.js";
export type {
  ScoutUiToken,
  ScoutUiTokenGroup,
  ScoutUiTokenName,
} from "./tokens.generated.js";

export const scoutUiReactVersion = "0.0.0" as const;
