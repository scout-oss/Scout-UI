import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";
import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { chunkyCheck } from "@scout-ui/stickers/definitions/chunky-check";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import type { Metadata } from "next";
import Link from "next/link";

import { componentCatalog } from "../lib/registry";
import { repositoryUrl, routeMetadata } from "../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/",
  title: "Scout UI — The open-source sticker UI library",
  description:
    "Build accessible, high-performance React interfaces with sticker-native primitives and controlled chaos.",
});

export default function HomePage() {
  const signature = componentCatalog.entries.filter(
    (component) => component.kind === "signature",
  );
  return (
    <div className="sui-docs-home">
      <section className="sui-docs-hero">
        <div className="sui-docs-hero-copy">
          <StickerBadge rotation={-2} shape="stamp" tone="acid">
            Open source · React · alpha
          </StickerBadge>
          <h1 data-route-heading tabIndex={-1}>
            UI THAT <span>STICKS.</span>
          </h1>
          <p>
            Scout UI is the open-source sticker UI library: tactile React
            primitives with native semantics, bounded motion, and enough
            controlled chaos to make interfaces memorable.
          </p>
          <div className="sui-docs-hero-actions">
            <StickerButton
              href="/components"
              shape="label"
              size="large"
              tone="acid"
            >
              Browse components
            </StickerButton>
            <StickerButton href={repositoryUrl} size="large" tone="paper">
              GitHub ↗
            </StickerButton>
          </div>
        </div>
        <div
          aria-label="Scout UI sticker composition"
          className="sui-docs-hero-board"
          role="img"
        >
          <p>CONTROLLED</p>
          <p>CHAOS</p>
          <Sticker
            alt=""
            rotation={-11}
            shadow="lifted"
            size="xl"
            source={sunnySmile}
          />
          <Sticker
            alt=""
            rotation={12}
            shadow="stuck"
            size="lg"
            source={wonkyStar}
          />
          <Sticker
            alt=""
            rotation={-4}
            shadow="lifted"
            size="lg"
            source={attentionBolt}
          />
          <span className="sui-docs-hero-tape">production-minded</span>
        </div>
      </section>

      <section aria-label="Scout UI qualities" className="sui-docs-proof-strip">
        <div>
          <strong>FUNCTIONAL</strong>
          <span>Native semantics first.</span>
        </div>
        <div>
          <strong>BOUNDED</strong>
          <span>Motion with an exit plan.</span>
        </div>
        <div>
          <strong>HANDOFF-READY</strong>
          <span>Public contracts, not demos.</span>
        </div>
      </section>

      <section className="sui-docs-home-field-guide">
        <div className="sui-docs-section-heading">
          <p className="sui-docs-eyebrow">Signature field guide</p>
          <h2>Interactions with rules.</h2>
          <p>
            Five loud ideas, each engineered to remain polite around the rest of
            your product.
          </p>
        </div>
        <ol>
          {signature.map((component, index) => (
            <li data-accent={component.accent} key={component.slug}>
              <span>0{String(index + 1)}</span>
              <div>
                <h3>{component.name}</h3>
                <p>{component.purpose}</p>
              </div>
              <Link href={`/components/${component.slug}`}>
                Open field note →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="sui-docs-home-pack" data-sui-theme="night">
        <div>
          <p className="sui-docs-eyebrow">
            Three packages. One visual grammar.
          </p>
          <h2>Bring the art. Keep the engineering.</h2>
          <p>
            Use the framework-neutral official pack, your own raster or vector
            assets, or React content. Scout UI does not require one artwork
            format.
          </p>
          <StickerButton href="/stickers" tone="cyan">
            See the contact sheet
          </StickerButton>
        </div>
        <div className="sui-docs-pack-poster" aria-hidden="true">
          <Sticker alt="" rotation={8} size="xl" source={chunkyCheck} />
          <span>SVG</span>
          <span>PNG</span>
          <span>WebP</span>
          <span>React</span>
        </div>
      </section>

      <section className="sui-docs-open-call">
        <p className="sui-docs-eyebrow">Built in public</p>
        <h2>Make something that sticks.</h2>
        <p>
          Contribute code, accessibility testing, original artwork, or clear
          documentation.
        </p>
        <div>
          <StickerButton href="/open-source" shape="label" tone="pink">
            Open-source guide
          </StickerButton>
          <StickerButton href="/guides/getting-started" tone="ink">
            Start with the guide
          </StickerButton>
        </div>
      </section>
    </div>
  );
}
