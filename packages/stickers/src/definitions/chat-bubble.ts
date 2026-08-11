// Generated from source/catalog.json and assets/chat-bubble.svg.
import type { StickerDefinition } from "../types.js";

export const chatBubble = {
  ...{
    id: "chat-bubble",
    name: "Chat Bubble",
    category: "expression",
    tags: ["speech", "message", "conversation"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 12,
      y: 17,
      width: 134,
      height: 129,
    },
    dominantTone: "ultraviolet",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/chat-bubble.svg",
    editableSource: "assets/chat-bubble.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-305ea9c6b616024c3c03bb52e4efc5e5158c449141495ace0851378965746b0a",
  },
  src: new URL("../../assets/chat-bubble.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default chatBubble;
