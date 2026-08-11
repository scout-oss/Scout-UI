// Generated from source/catalog.json and assets/sparkle-pop.svg.
import type { StickerDefinition } from "../types.js";

export const sparklePop = {
  ...{
    id: "sparkle-pop",
    name: "Sparkle Pop",
    category: "signal",
    tags: ["sparkle", "shine", "new"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 15,
      y: 9,
      width: 121,
      height: 135,
    },
    dominantTone: "cyan",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/sparkle-pop.svg",
    editableSource: "assets/sparkle-pop.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-d3c2b67badcb8fb4d12261682f09cacd57357fb1b863ca8136e16bc72238e51d",
  },
  src: new URL("../../assets/sparkle-pop.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default sparklePop;
