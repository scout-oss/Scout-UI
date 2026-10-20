import { officialStickerPack, stickerDefinitions } from "@scout-ui/stickers";
import type { Metadata } from "next";

import { StickerDesk } from "../../components/kinetic/sticker-desk";
import { collageStickers } from "../../lib/collage";
import { PageHeading } from "../../components/page-heading";
import { StickerBrowser } from "../../components/sticker-browser";
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
        lede="The printed-matter set that dresses this site, and the installable official pack. Every component takes any art with the same { id, src, width, height } shape — bring your own PNG, WebP, SVG, or React content."
      >
        The sticker drawer
      </PageHeading>
      <section
        aria-labelledby="printed-matter-heading"
        className="sui-k-drawer-desk"
      >
        <div className="sui-k-drawer-desk-head">
          <p className="sui-k-kicker">
            <span>{String(collageStickers.length)}</span> Printed matter
          </p>
          <h2 id="printed-matter-heading">The site&apos;s own sticker set</h2>
          <p>
            Tickets, tapes, stamps and seals used across these docs. They are
            plain WebP passed to the same Sticker contract as any art — not part
            of <code>@scout-ui/stickers</code>. The installable official pack is
            the contact sheet below.
          </p>
        </div>
        <StickerDesk
          artScale={1.3}
          label={`A desk of ${String(collageStickers.length)} printed-matter stickers used by the docs site. Drag to throw them; use Shuffle or Tidy up from the keyboard. The installable official pack is listed below.`}
          stickers={collageStickers}
        />
      </section>
      <header className="sui-k-section-head sui-k-official-head">
        <p className="sui-k-kicker">
          <span>{String(stickerDefinitions.length)}</span> Installable pack
        </p>
        <h2>The official @scout-ui/stickers pack</h2>
        <p>
          The framework-neutral SVG set that ships in the v0.1 package, with
          documented provenance. Inspect any sticker and copy its public import.
        </p>
      </header>
      <div data-pagefind-body>
        <StickerBrowser />
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
