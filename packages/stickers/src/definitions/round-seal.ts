// Generated from source/catalog.json and assets/round-seal.svg.
import type { StickerDefinition } from "../types.js";

export const roundSeal = {
  ...{
    id: "round-seal",
    name: "Round Seal",
    category: "label",
    tags: ["seal", "badge", "blank"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 25,
      y: 18,
      width: 110,
      height: 126,
    },
    dominantTone: "ultraviolet",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/round-seal.svg",
    editableSource: "assets/round-seal.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-c966493b99b92c709d83fe6918256b13b7219675959fd53a3dd7f226b4cf56ae",
  },
  src: new URL("../../assets/round-seal.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default roundSeal;
