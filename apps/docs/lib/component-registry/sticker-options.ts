import { type CollageSticker, collageStickers } from "../collage";
import { siteOrigin } from "../site";

/**
 * Artwork offered by the playground's sticker pickers. The docs use the
 * printed-matter set (lib/collage.ts), which is NOT part of
 * @scout-ui/stickers — so generated code declares each selection as the
 * consumer's own StickerSource ({ id, src, width, height }), the contract
 * every component already accepts, instead of importing a package asset.
 */
export interface PlaygroundStickerEntry {
  /** Identifier used in generated code, e.g. `pixelHeart`. */
  readonly exportName: string;
  /** Path the consumer serves the file from in their own app. */
  readonly hostedPath: string;
  /** Where the consumer can download this artwork. */
  readonly downloadUrl: string;
  readonly source: CollageSticker;
}

function camelCase(id: string): string {
  return id.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
}

export const playgroundStickerCatalog: Readonly<
  Record<string, PlaygroundStickerEntry>
> = Object.freeze(
  Object.fromEntries(
    collageStickers.map((source) => [
      source.id,
      Object.freeze({
        downloadUrl: new URL(source.src, siteOrigin).href,
        exportName: camelCase(source.id),
        hostedPath: `/stickers/${source.id}.webp`,
        source,
      }),
    ]),
  ),
);

export const playgroundStickerSources: Readonly<
  Record<string, CollageSticker>
> = Object.freeze(
  Object.fromEntries(
    Object.entries(playgroundStickerCatalog).map(([id, entry]) => [
      id,
      entry.source,
    ]),
  ),
);

export const playgroundStickerOptions = Object.freeze(
  Object.entries(playgroundStickerCatalog).map(([value, entry]) => ({
    label: entry.source.name,
    value,
  })),
);

export function getPlaygroundStickerImport(
  id: string,
): PlaygroundStickerEntry | null {
  if (!Object.hasOwn(playgroundStickerCatalog, id)) return null;
  return playgroundStickerCatalog[id] ?? null;
}
