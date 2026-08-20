import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { chunkyCheck } from "@scout-ui/stickers/definitions/chunky-check";
import { pocketCamera } from "@scout-ui/stickers/definitions/pocket-camera";
import { scribblePointer } from "@scout-ui/stickers/definitions/scribble-pointer";
import { sparklePop } from "@scout-ui/stickers/definitions/sparkle-pop";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

export const playgroundStickerCatalog = Object.freeze({
  "attention-bolt": {
    exportName: "attentionBolt",
    module: "@scout-ui/stickers/definitions/attention-bolt",
    source: attentionBolt,
  },
  "chunky-check": {
    exportName: "chunkyCheck",
    module: "@scout-ui/stickers/definitions/chunky-check",
    source: chunkyCheck,
  },
  "pocket-camera": {
    exportName: "pocketCamera",
    module: "@scout-ui/stickers/definitions/pocket-camera",
    source: pocketCamera,
  },
  "scribble-pointer": {
    exportName: "scribblePointer",
    module: "@scout-ui/stickers/definitions/scribble-pointer",
    source: scribblePointer,
  },
  "sparkle-pop": {
    exportName: "sparklePop",
    module: "@scout-ui/stickers/definitions/sparkle-pop",
    source: sparklePop,
  },
  "sunny-smile": {
    exportName: "sunnySmile",
    module: "@scout-ui/stickers/definitions/sunny-smile",
    source: sunnySmile,
  },
  "wonky-star": {
    exportName: "wonkyStar",
    module: "@scout-ui/stickers/definitions/wonky-star",
    source: wonkyStar,
  },
});

type PlaygroundStickerId = keyof typeof playgroundStickerCatalog;

export const playgroundStickerSources = Object.freeze(
  Object.fromEntries(
    Object.entries(playgroundStickerCatalog).map(([id, entry]) => [
      id,
      entry.source,
    ]),
  ) as {
    readonly [
      K in PlaygroundStickerId
    ]: (typeof playgroundStickerCatalog)[K]["source"];
  },
);

export const playgroundStickerOptions = Object.freeze(
  Object.entries(playgroundStickerCatalog).map(([value, entry]) => ({
    label: entry.source.name,
    value,
  })),
);

export function getPlaygroundStickerImport(id: string) {
  if (!Object.hasOwn(playgroundStickerCatalog, id)) return null;
  return playgroundStickerCatalog[id as PlaygroundStickerId];
}
