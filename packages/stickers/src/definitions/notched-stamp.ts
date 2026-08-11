// Generated from source/catalog.json and assets/notched-stamp.svg.
import type { StickerDefinition } from "../types.js";

export const notchedStamp = {
  ...{
    id: "notched-stamp",
    name: "Notched Stamp",
    category: "label",
    tags: ["stamp", "label", "blank"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 10,
      y: 19,
      width: 133,
      height: 118,
    },
    dominantTone: "orange",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/notched-stamp.svg",
    editableSource: "assets/notched-stamp.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-587f8a216376c5c3dddba1f0f765a4556d1bd6f5c06b9fd417484ada87828075",
  },
  src: new URL("../../assets/notched-stamp.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default notchedStamp;
