// Component exports are added by their implementation milestones. This barrel
// remains an unmarked, server-safe re-export surface.
export { stickerEntryStatus } from "./sticker/index.js";
export { scoutUiTokens } from "./tokens.generated.js";
export type {
  ScoutUiToken,
  ScoutUiTokenGroup,
  ScoutUiTokenName,
} from "./tokens.generated.js";
export { stickerTrailVersion } from "@scout-ui/sticker-trail";

export const scoutUiReactVersion = "0.0.0" as const;
