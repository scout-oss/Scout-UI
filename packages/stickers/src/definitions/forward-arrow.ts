// Generated from source/catalog.json and assets/forward-arrow.svg.
import type { StickerDefinition } from "../types.js";

export const forwardArrow = {
  ...{
    id: "forward-arrow",
    name: "Forward Arrow",
    category: "direction",
    tags: ["arrow", "forward", "next"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 10,
      y: 12,
      width: 140,
      height: 136,
    },
    dominantTone: "cobalt",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/forward-arrow.svg",
    editableSource: "assets/forward-arrow.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-a03ff3b1c76b91d4f39e801fcb627f23c040b45f039902b33809abe076ae029d",
  },
  src: new URL("../../assets/forward-arrow.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default forwardArrow;
