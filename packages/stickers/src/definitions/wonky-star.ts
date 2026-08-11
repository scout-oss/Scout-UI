// Generated from source/catalog.json and assets/wonky-star.svg.
import type { StickerDefinition } from "../types.js";

export const wonkyStar = {
  ...{
    id: "wonky-star",
    name: "Wonky Star",
    category: "signal",
    tags: ["star", "favorite", "celebrate"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 11,
      y: 11,
      width: 134,
      height: 137,
    },
    dominantTone: "acid",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/wonky-star.svg",
    editableSource: "assets/wonky-star.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-44c73d9c2d988b926a417253f5f44331e25a50ce08a5233f3f17c421d60b94ad",
  },
  src: new URL("../../assets/wonky-star.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default wonkyStar;
