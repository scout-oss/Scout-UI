// Generated from source/catalog.json and assets/scribble-pointer.svg.
import type { StickerDefinition } from "../types.js";

export const scribblePointer = {
  ...{
    id: "scribble-pointer",
    name: "Scribble Pointer",
    category: "direction",
    tags: ["pointer", "doodle", "notice"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 9,
      y: 27,
      width: 132,
      height: 115,
    },
    dominantTone: "orange",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/scribble-pointer.svg",
    editableSource: "assets/scribble-pointer.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-8ed4e664e4e0602f2b6d64ebaed539fa87683457fc3e90e8507c042763ed6452",
  },
  src: new URL("../../assets/scribble-pointer.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default scribblePointer;
