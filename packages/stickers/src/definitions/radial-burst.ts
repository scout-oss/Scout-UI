// Generated from source/catalog.json and assets/radial-burst.svg.
import type { StickerDefinition } from "../types.js";

export const radialBurst = {
  ...{
    id: "radial-burst",
    name: "Radial Burst",
    category: "signal",
    tags: ["burst", "impact", "attention"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 11,
      y: 20,
      width: 137,
      height: 132,
    },
    dominantTone: "hot-pink",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/radial-burst.svg",
    editableSource: "assets/radial-burst.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-222fae5c1a7cfc5d1b00f72d201734f7f746b8c7cd364f49a9e9bd855df5277c",
  },
  src: new URL("../../assets/radial-burst.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default radialBurst;
