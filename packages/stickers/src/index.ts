// Framework-specific rendering helpers are intentionally excluded.
export {
  officialStickerPack,
  stickerDefinitions,
  stickersById,
} from "./manifest.js";
export type {
  StickerAttributionStatus,
  StickerCategory,
  StickerDefinition,
  StickerFormat,
  StickerPackManifest,
  StickerTransparentBounds,
} from "./types.js";

export const stickerPackVersion = "0.0.0" as const;
