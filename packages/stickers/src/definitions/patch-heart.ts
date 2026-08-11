// Generated from source/catalog.json and assets/patch-heart.svg.
import type { StickerDefinition } from "../types.js";

export const patchHeart = {
  ...{
    id: "patch-heart",
    name: "Patch Heart",
    category: "expression",
    tags: ["heart", "care", "favorite"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 10,
      y: 20,
      width: 140,
      height: 128,
    },
    dominantTone: "hot-pink",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/patch-heart.svg",
    editableSource: "assets/patch-heart.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-e3ea18c82ba65b8a3dc6320ea3d56aad5ace11223927d6b5e5c742a409a2bc35",
  },
  src: new URL("../../assets/patch-heart.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default patchHeart;
