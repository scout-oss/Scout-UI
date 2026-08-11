// Generated from source/catalog.json and assets/sealed-envelope.svg.
import type { StickerDefinition } from "../types.js";

export const sealedEnvelope = {
  ...{
    id: "sealed-envelope",
    name: "Sealed Envelope",
    category: "object",
    tags: ["envelope", "mail", "message"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 11,
      y: 29,
      width: 139,
      height: 109,
    },
    dominantTone: "cyan",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/sealed-envelope.svg",
    editableSource: "assets/sealed-envelope.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-e5011d3c86893ea0fc8dff9efd8407882f9f51129a94b92c5c45e622524d4c85",
  },
  src: new URL("../../assets/sealed-envelope.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default sealedEnvelope;
