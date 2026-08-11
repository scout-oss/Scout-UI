// Generated from source/catalog.json and assets/sunny-smile.svg.
import type { StickerDefinition } from "../types.js";

export const sunnySmile = {
  ...{
    id: "sunny-smile",
    name: "Sunny Smile",
    category: "expression",
    tags: ["smile", "happy", "face"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 11,
      y: 10,
      width: 137,
      height: 140,
    },
    dominantTone: "orange",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/sunny-smile.svg",
    editableSource: "assets/sunny-smile.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-190bf89d14ac4d8fb20252fd6565bff48971ad477c9c413273b3e26906d0632b",
  },
  src: new URL("../../assets/sunny-smile.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default sunnySmile;
