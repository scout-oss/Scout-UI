// Generated from source/catalog.json and assets/admit-ticket.svg.
import type { StickerDefinition } from "../types.js";

export const admitTicket = {
  ...{
    id: "admit-ticket",
    name: "Admit Ticket",
    category: "object",
    tags: ["ticket", "event", "entry"],
    width: 160,
    height: 160,
    viewBox: "0 0 160 160",
    transparentBounds: {
      x: 23,
      y: 29,
      width: 125,
      height: 113,
    },
    dominantTone: "orange",
    format: "svg",
    creator: "Scout UI contributors",
    source: "Original vector artwork authored for Scout UI v0.1",
    license: "CC0-1.0",
    attributionStatus: "not-required",
    sourceFile: "assets/admit-ticket.svg",
    editableSource: "assets/admit-ticket.svg",
    aiAssistance:
      "Codex-assisted SVG source authored from the Scout UI specifications; no image model or reference image was used.",
    checksum:
      "sha256-a33ed7b1f2bfb8cfe1fe18609cf409940ef800596b812226bae221d91899c997",
  },
  src: new URL("../../assets/admit-ticket.svg", import.meta.url).href,
} as const satisfies StickerDefinition;
export default admitTicket;
