// Generated from source/catalog.json and assets/paper-tab.svg.
import type { StickerDefinition } from "../types.js";

export const paperTab = {
  ...{
    id: "paper-tab",
    name: "Paper Tab",
    category: "label",
    tags: ["tab", "paper", "blank"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 11,
      y: 14,
      width: 134,
      height: 132,
    },
    dominantTone: "acid",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/paper-tab.svg",
    editableSource: "assets/paper-tab.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-9babe60f3610402ca7f94c0286b5cbbeaf5f41896b5828d9b257c7c5a4bd657d",
  },
  src: new URL("../../assets/paper-tab.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default paperTab;
