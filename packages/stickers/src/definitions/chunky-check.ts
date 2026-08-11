// Generated from source/catalog.json and assets/chunky-check.svg.
import type { StickerDefinition } from "../types.js";

export const chunkyCheck = {
  ...{
    id: "chunky-check",
    name: "Chunky Check",
    category: "signal",
    tags: ["check", "complete", "confirm"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 13,
      y: 25,
      width: 134,
      height: 106,
    },
    dominantTone: "acid",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/chunky-check.svg",
    editableSource: "assets/chunky-check.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-fd3783c0140fd2e600379b4b6cb73301f6f07538390719db3bf9efb009ae4743",
  },
  src: new URL("../../assets/chunky-check.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default chunkyCheck;
