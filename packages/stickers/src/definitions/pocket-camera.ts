// Generated from source/catalog.json and assets/pocket-camera.svg.
import type { StickerDefinition } from "../types.js";

export const pocketCamera = {
  ...{
    id: "pocket-camera",
    name: "Pocket Camera",
    category: "object",
    tags: ["camera", "photo", "capture"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 9,
      y: 22,
      width: 142,
      height: 119,
    },
    dominantTone: "cobalt",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/pocket-camera.svg",
    editableSource: "assets/pocket-camera.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-2e572cd13639f0d9687eb383407c409eaeae8d4b4e8ad2a0406bb8868bcf6266",
  },
  src: new URL("../../assets/pocket-camera.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default pocketCamera;
