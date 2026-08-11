// Generated from source/catalog.json and assets/mixtape.svg.
import type { StickerDefinition } from "../types.js";

export const mixtape = {
  ...{
    id: "mixtape",
    name: "Mixtape",
    category: "object",
    tags: ["cassette", "music", "retro"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 8,
      y: 20,
      width: 144,
      height: 124,
    },
    dominantTone: "ultraviolet",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/mixtape.svg",
    editableSource: "assets/mixtape.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-d38f003cb59aba4c1a93ddc4ae5f799940a9b0a5942603a3838c1ae9430956a1",
  },
  src: new URL("../../assets/mixtape.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default mixtape;
