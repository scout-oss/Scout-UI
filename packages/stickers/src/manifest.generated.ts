// Generated from source/catalog.json. Do not edit manually.
import type { StickerDefinition, StickerPackManifest } from "./types.js";
import { wonkyStar } from "./definitions/wonky-star.js";
import { sparklePop } from "./definitions/sparkle-pop.js";
import { radialBurst } from "./definitions/radial-burst.js";
import { chunkyCheck } from "./definitions/chunky-check.js";
import { attentionBolt } from "./definitions/attention-bolt.js";
import { sunnySmile } from "./definitions/sunny-smile.js";
import { watchfulEye } from "./definitions/watchful-eye.js";
import { patchHeart } from "./definitions/patch-heart.js";
import { highFive } from "./definitions/high-five.js";
import { chatBubble } from "./definitions/chat-bubble.js";
import { forwardArrow } from "./definitions/forward-arrow.js";
import { loopArrow } from "./definitions/loop-arrow.js";
import { scribblePointer } from "./definitions/scribble-pointer.js";
import { highlightSwipe } from "./definitions/highlight-swipe.js";
import { targetRing } from "./definitions/target-ring.js";
import { pocketCamera } from "./definitions/pocket-camera.js";
import { bloomFlower } from "./definitions/bloom-flower.js";
import { admitTicket } from "./definitions/admit-ticket.js";
import { mixtape } from "./definitions/mixtape.js";
import { sealedEnvelope } from "./definitions/sealed-envelope.js";
import { blankRibbon } from "./definitions/blank-ribbon.js";
import { notchedStamp } from "./definitions/notched-stamp.js";
import { roundSeal } from "./definitions/round-seal.js";
import { paperTab } from "./definitions/paper-tab.js";
import { tapeStrip } from "./definitions/tape-strip.js";

export const stickerDefinitions = [
  wonkyStar,
  sparklePop,
  radialBurst,
  chunkyCheck,
  attentionBolt,
  sunnySmile,
  watchfulEye,
  patchHeart,
  highFive,
  chatBubble,
  forwardArrow,
  loopArrow,
  scribblePointer,
  highlightSwipe,
  targetRing,
  pocketCamera,
  bloomFlower,
  admitTicket,
  mixtape,
  sealedEnvelope,
  blankRibbon,
  notchedStamp,
  roundSeal,
  paperTab,
  tapeStrip,
] as const satisfies readonly StickerDefinition[];
export const stickersById = Object.freeze(
  Object.fromEntries(
    stickerDefinitions.map((sticker) => [sticker.id, sticker]),
  ),
) as Readonly<Record<string, StickerDefinition>>;
export const officialStickerPack = {
  id: "scout-ui-official-v0-1",
  name: "Scout UI Official v0.1",
  version: "0.1.0",
  artworkLicense: "CC0-1.0",
  codeLicense: "MIT",
  stickers: stickerDefinitions,
} as const satisfies StickerPackManifest;
