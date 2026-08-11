// Generated from source/catalog.json and assets/attention-bolt.svg.
import type { StickerDefinition } from "../types.js";

export const attentionBolt = {
  ...{
    id: "attention-bolt",
    name: "Attention Bolt",
    category: "signal",
    tags: ["bolt", "energy", "attention"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 24,
      y: 7,
      width: 114,
      height: 146,
    },
    dominantTone: "orange",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/attention-bolt.svg",
    editableSource: "assets/attention-bolt.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-406377f7a2f8108ae5b673db3bd10fff5ec468e1e6b563914014ff45df4bbc97",
  },
  src: new URL("../../assets/attention-bolt.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default attentionBolt;
