// Generated from source/catalog.json and assets/watchful-eye.svg.
import type { StickerDefinition } from "../types.js";

export const watchfulEye = {
  ...{
    id: "watchful-eye",
    name: "Watchful Eye",
    category: "expression",
    tags: ["eye", "look", "notice"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 9,
      y: 25,
      width: 142,
      height: 109,
    },
    dominantTone: "cyan",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/watchful-eye.svg",
    editableSource: "assets/watchful-eye.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-edf6c9ee2cde4f4cdb84e64c5f746d86bf79b5105c414cc8fd923087b1cda11f",
  },
  src: new URL("../../assets/watchful-eye.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default watchfulEye;
