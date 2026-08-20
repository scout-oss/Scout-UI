import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { chunkyCheck } from "@scout-ui/stickers/definitions/chunky-check";
import { pocketCamera } from "@scout-ui/stickers/definitions/pocket-camera";
import { scribblePointer } from "@scout-ui/stickers/definitions/scribble-pointer";
import { sparklePop } from "@scout-ui/stickers/definitions/sparkle-pop";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

export const playgroundStickerSources = Object.freeze({
  "attention-bolt": attentionBolt,
  "chunky-check": chunkyCheck,
  "pocket-camera": pocketCamera,
  "scribble-pointer": scribblePointer,
  "sparkle-pop": sparklePop,
  "sunny-smile": sunnySmile,
  "wonky-star": wonkyStar,
});

export const playgroundStickerOptions = Object.freeze(
  Object.entries(playgroundStickerSources).map(([value, source]) => ({
    label: source.name,
    value,
  })),
);
