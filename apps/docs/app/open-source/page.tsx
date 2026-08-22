import { StickerBadge, StickerButton } from "@scout-ui/react";
import type { Metadata } from "next";

import { PageHeading } from "../../components/page-heading";
import { repositoryUrl, routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/open-source",
  title: "Open source",
  description:
    "Understand Scout UI's licenses, contribution areas, and alpha package status.",
});

const contributionAreas = [
  [
    "Code",
    "Components, package quality, framework fixtures, and performance tests.",
  ],
  [
    "Accessibility",
    "Keyboard, screen reader, forced-colors, reflow, and motion verification.",
  ],
  [
    "Artwork",
    "Original, provenance-documented sticker packs under explicit licensing.",
  ],
  [
    "Documentation",
    "Examples and guidance that make expressive UI safer to adopt.",
  ],
] as const;

export default function OpenSourcePage() {
  return (
    <div className="sui-docs-page sui-docs-open-source-page" data-pagefind-body>
      <PageHeading
        eyebrow="Public by design"
        lede="Scout UI is built from a real product language and generalized in public. The packages remain in alpha preflight; contributions should preserve both expression and engineering discipline."
      >
        Open source, with receipts
      </PageHeading>
      <section className="sui-docs-license-board" data-sui-theme="night">
        <div>
          <StickerBadge tone="acid">Code</StickerBadge>
          <h2>MIT</h2>
          <p>Runtime, tooling, and documentation code.</p>
        </div>
        <div>
          <StickerBadge tone="pink">Official artwork</StickerBadge>
          <h2>CC0-1.0</h2>
          <p>Current v0.1 sticker pack, documented separately.</p>
        </div>
      </section>
      <section className="sui-docs-contribution-tabs">
        <p className="sui-docs-eyebrow">Ways in</p>
        <h2>Contribute where you have leverage.</h2>
        <ul>
          {contributionAreas.map(([title, detail]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="sui-docs-open-actions">
        <StickerButton href={repositoryUrl} size="large" tone="acid">
          Repository ↗
        </StickerButton>
        <StickerButton
          href={`${repositoryUrl}/issues`}
          size="large"
          tone="paper"
        >
          Issues ↗
        </StickerButton>
        <StickerButton
          href={`${repositoryUrl}/security`}
          size="large"
          tone="paper"
        >
          Security ↗
        </StickerButton>
      </div>
      <section className="sui-docs-open-source-links">
        <p className="sui-docs-eyebrow">Canonical project documents</p>
        <h2>Policy lives with the source.</h2>
        <ul>
          <li>
            <a href={`${repositoryUrl}/blob/main/LICENSE`}>
              MIT code license ↗
            </a>
          </li>
          <li>
            <a href={`${repositoryUrl}/blob/main/LICENSE-ASSETS.md`}>
              Official artwork license ↗
            </a>
          </li>
          <li>
            <a
              href={`${repositoryUrl}/blob/main/packages/stickers/ATTRIBUTION.md`}
            >
              Attribution record ↗
            </a>
          </li>
          <li>
            <a href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`}>
              Contributing ↗
            </a>
          </li>
          <li>
            <a href={`${repositoryUrl}/blob/main/CODE_OF_CONDUCT.md`}>
              Code of conduct ↗
            </a>
          </li>
          <li>
            <a href={`${repositoryUrl}/blob/main/SECURITY.md`}>
              Security policy ↗
            </a>
          </li>
          <li>
            <a href={`${repositoryUrl}/blob/main/SUPPORT.md`}>Support ↗</a>
          </li>
          <li>
            <a href={`${repositoryUrl}/issues/new/choose`}>Open an issue ↗</a>
          </li>
        </ul>
        <p>
          Scout UI generalizes an open-source interface language. It does not
          ship private Scout product code, product screenshots, product claims,
          or uncleared product artwork.
        </p>
      </section>
    </div>
  );
}
