// Generated from source/catalog.json and assets/loop-arrow.svg.
import type { StickerDefinition } from "../types.js";

export const loopArrow = {
  ...{
    id: "loop-arrow",
    name: "Loop Arrow",
    category: "direction",
    tags: ["arrow", "loop", "repeat"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 10,
      y: 20,
      width: 128,
      height: 131,
    },
    dominantTone: "cyan",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/loop-arrow.svg",
    editableSource: "assets/loop-arrow.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-b09f4dfb737f9e2d66ef2451dd8b65ab0727c5548de667da174b2e56c6cd42ea",
  },
  src: new URL("../../assets/loop-arrow.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default loopArrow;
