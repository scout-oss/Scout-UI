"use client";

// StickerCursor is genuinely client-interactive: it reads pointer capability,
// decodes artwork, and drives an animation frame loop. Only this leaf carries
// the directive — the root barrel and the server-compatible primitives stay
// unmarked.
export { StickerCursor } from "./StickerCursor.js";
export type {
  CursorVisual,
  StickerCursorProps,
  StickerCursorState,
} from "./StickerCursor.js";
