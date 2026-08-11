// Generated from source/catalog.json and assets/bloom-flower.svg.
import type { StickerDefinition } from "../types.js";

export const bloomFlower = {
  ...{
    id: "bloom-flower",
    name: "Bloom Flower",
    category: "object",
    tags: ["flower", "bloom", "nature"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 15,
      y: 31,
      width: 123,
      height: 100,
    },
    dominantTone: "hot-pink",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/bloom-flower.svg",
    editableSource: "assets/bloom-flower.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-7f0b0e67dc695a4855bca73fe4624756055374cf92857b2051f1b2002c445247",
  },
  src: new URL("../../assets/bloom-flower.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default bloomFlower;
