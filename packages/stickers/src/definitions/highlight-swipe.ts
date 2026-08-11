// Generated from source/catalog.json and assets/highlight-swipe.svg.
import type { StickerDefinition } from "../types.js";

export const highlightSwipe = {
  ...{
    id: "highlight-swipe",
    name: "Highlight Swipe",
    category: "direction",
    tags: ["highlight", "underline", "mark"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 13,
      y: 49,
      width: 134,
      height: 48,
    },
    dominantTone: "acid",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/highlight-swipe.svg",
    editableSource: "assets/highlight-swipe.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-fb4116de3114ec83c5b5a5ca39cf44f4ba3ec44c44370cfc33929ca23e037841",
  },
  src: new URL("../../assets/highlight-swipe.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default highlightSwipe;
