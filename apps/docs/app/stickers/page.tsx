import { officialStickerPack, stickerDefinitions } from "@scout-ui/stickers";
import type { Metadata } from "next";

import { StickerDesk } from "../../components/kinetic/sticker-desk";
import { PageHeading } from "../../components/page-heading";
import { StickerBrowser } from "../../components/sticker-browser";
import { componentDefinitions } from "../../lib/component-registry/definitions";
import { playgroundStickerCatalog } from "../../lib/component-registry/sticker-options";
import { createShareUrl } from "../../lib/component-registry/url-state";
import { repositoryUrl, routeMetadata } from "../../lib/site";

// Deep links that open the Sticker playground with this artwork preselected,
// built on the server from the same share-URL contract the playground uses.
const playgroundHrefs = Object.fromEntries(
  Object.keys(playgroundStickerCatalog).map((id) => [
    id,
    createShareUrl(
      componentDefinitions.sticker,
      { ...componentDefinitions.sticker.defaults, sourceId: id },
      "https://scout-ui.invalid",
    ).relativeUrl,
  ]),
);

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
      <section aria-label="Sticker desk" className="sui-k-drawer-desk">
        <StickerDesk
          label={`All ${String(stickerDefinitions.length)} official stickers scattered on a desk. Drag to throw them; use Shuffle or Tidy up from the keyboard. The inspectable list follows.`}
          stickers={stickerDefinitions}
        />
      </section>
      <div data-pagefind-body>
        <StickerBrowser playgroundHrefs={playgroundHrefs} />
      </div>
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
      <section className="sui-docs-license-note">
        <p className="sui-docs-eyebrow">Bring your own stickers</p>
        <h2>SVG is a current asset format, not a component assumption.</h2>
        <p>
          Pass official definitions, image URLs, PNG or WebP sources, or
          consumer-rendered React content where the component contract permits.
          Keep provenance and alternative text alongside your assets.
        </p>
        <a href="/guides/asset-authoring">Read the asset authoring guide →</a>
      </section>
    </div>
  );
}
