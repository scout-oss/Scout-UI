// Generated from source/catalog.json and assets/target-ring.svg.
import type { StickerDefinition } from "../types.js";

export const targetRing = {
  ...{
    id: "target-ring",
    name: "Target Ring",
    category: "direction",
    tags: ["target", "circle", "focus"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 9,
      y: 14,
      width: 140,
      height: 132,
    },
    dominantTone: "hot-pink",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/target-ring.svg",
    editableSource: "assets/target-ring.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-67c7e7bab2293b5781d383773133eb5ab528cb1d041b094af9427bd2d7d4cdd7",
  },
  src: new URL("../../assets/target-ring.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default targetRing;
