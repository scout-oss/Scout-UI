// Generated from source/catalog.json and assets/blank-ribbon.svg.
import type { StickerDefinition } from "../types.js";

export const blankRibbon = {
  ...{
    id: "blank-ribbon",
    name: "Blank Ribbon",
    category: "label",
    tags: ["ribbon", "label", "blank"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 7,
      y: 37,
      width: 147,
      height: 92,
    },
    dominantTone: "cobalt",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/blank-ribbon.svg",
    editableSource: "assets/blank-ribbon.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-55c56c1f909d46be9d941d4b3af4fb15f95bfde0a26ab2eadb819385e54b39f2",
  },
  src: new URL("../../assets/blank-ribbon.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default blankRibbon;
