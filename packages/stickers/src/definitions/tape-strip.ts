// Generated from source/catalog.json and assets/tape-strip.svg.
import type { StickerDefinition } from "../types.js";

export const tapeStrip = {
  ...{
    id: "tape-strip",
    name: "Tape Strip",
    category: "label",
    tags: ["tape", "material", "blank"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 6,
      y: 39,
      width: 144,
      height: 90,
    },
    dominantTone: "cyan",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/tape-strip.svg",
    editableSource: "assets/tape-strip.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-a33d87ed89b29949f3ef864fe41d14b1708f20de5006af978acd215286389e06",
  },
  src: new URL("../../assets/tape-strip.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default tapeStrip;
