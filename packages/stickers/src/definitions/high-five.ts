// Generated from source/catalog.json and assets/high-five.svg.
import type { StickerDefinition } from "../types.js";

export const highFive = {
  ...{
    id: "high-five",
    name: "High Five",
    category: "expression",
    tags: ["hand", "celebrate", "hello"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 25,
      y: 9,
      width: 113,
      height: 133,
    },
    dominantTone: "acid",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/high-five.svg",
    editableSource: "assets/high-five.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-4dece2aabf54d162c34747d3eaa0eb5418c5ccc8749961d7133e1fc9db5a9fd3",
  },
  src: new URL("../../assets/high-five.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default highFive;
