import { Sticker } from "@scout-ui/react";
import { officialStickerPack, stickerDefinitions } from "@scout-ui/stickers";
import type { Metadata } from "next";

import { PageHeading } from "../../components/page-heading";
import { repositoryUrl, routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/stickers",
  title: "Stickers",
  description: "Browse the original framework-neutral Scout UI sticker pack.",
});

export default function StickersPage() {
  return (
    <div className="sui-docs-page sui-docs-stickers-page">
      <PageHeading
        eyebrow={`${String(stickerDefinitions.length)} cleared originals · ${officialStickerPack.artworkLicense}`}
        lede="A framework-neutral contact sheet of original SVG artwork. Bring these definitions—or bring your own PNG, WebP, SVG, or React content."
      >
        The sticker drawer
      </PageHeading>
      <ul className="sui-docs-contact-sheet">
        {stickerDefinitions.map((sticker, index) => (
          <li data-category={sticker.category} key={sticker.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <Sticker
              alt={sticker.name}
              rotation={(index % 5) * 2 - 4}
              size="lg"
              source={sticker}
            />
            <div>
              <strong>{sticker.name}</strong>
              <small>
                {sticker.category} · {sticker.format.toUpperCase()}
              </small>
            </div>
          </li>
        ))}
      </ul>
      <section className="sui-docs-license-note">
        <p className="sui-docs-eyebrow">License boundary</p>
        <h2>Code and artwork are documented separately.</h2>
        <p>
          The official v0.1 artwork is {officialStickerPack.artworkLicense}; the
          package code is {officialStickerPack.codeLicense}. Review the
          repository attribution and asset contribution files before adding new
          packs.
        </p>
        <a href={`${repositoryUrl}/tree/main/packages/stickers`}>
          Read the sticker package source ↗
        </a>
      </section>
    </div>
  );
}
