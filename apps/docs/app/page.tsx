import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";
import { chunkyCheck } from "@scout-ui/stickers/definitions/chunky-check";
import type { Metadata } from "next";
import Link from "next/link";

import { HomeHeroDemo } from "../components/home/home-hero-demo";
import { PlaygroundSession } from "../components/playground/playground-session";
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
  const trail = componentCatalog.get("sticker-trail");
  if (!trail) throw new Error("StickerTrail registry definition is missing.");
  return (
    <div className="sui-docs-home" data-pagefind-body>
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
        <HomeHeroDemo />
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
                <code>{`import { ${component.name} } from "${component.packageName}";`}</code>
              </div>
              <div>
                <Link href={`/components/${component.slug}`}>Reference →</Link>
                <Link href={`/playground/${component.slug}`}>Playground →</Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="sui-docs-home-handoff" id="config-to-handoff">
        <div className="sui-docs-section-heading">
          <p className="sui-docs-eyebrow">From config to handoff</p>
          <h2>One state. Three trustworthy outputs.</h2>
          <p>
            Change the bounded Trail once; preview, deterministic code, and
            configuration-aware AI Prompt stay aligned through the M13–M15
            registry.
          </p>
        </div>
        <PlaygroundSession
          initialConfig={{ ...trail.defaults }}
          mode="component"
          slug="sticker-trail"
        />
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

      <section className="sui-docs-home-stack-row">
        <p className="sui-docs-eyebrow">Works with your stack</p>
        <h2>Public React. Ordinary CSS. Your assets.</h2>
        <ul>
          <li>React 19</li>
          <li>Next.js App Router</li>
          <li>CSS variables</li>
          <li>Consumer SVG / PNG / WebP</li>
        </ul>
      </section>

      <section className="sui-docs-home-principles">
        <p className="sui-docs-eyebrow">Production rules</p>
        <h2>Expression with an exit plan.</h2>
        <div>
          <p>Native controls stay native.</p>
          <p>Motion follows capability and preference.</p>
          <p>High-frequency work remains bounded.</p>
          <p>Official art stays provenance-cleared.</p>
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
          <StickerButton href="/guides/installation" tone="ink">
            Start with the guide
          </StickerButton>
        </div>
      </section>

      <section className="sui-docs-home-final" data-sui-theme="night">
        <p className="sui-docs-eyebrow">
          Alpha preflight · not yet an npm release
        </p>
        <h2>Make something that sticks.</h2>
        <code>pnpm add @scout-ui/react</code>
        <p>
          Use the install command once a public alpha is announced. Today,
          inspect the packages and verified consumer fixtures in the repository.
        </p>
        <div>
          <StickerButton href="/components" size="large" tone="acid">
            Browse components
          </StickerButton>
          <StickerButton href={repositoryUrl} size="large" tone="paper">
            GitHub ↗
          </StickerButton>
        </div>
      </section>
    </div>
  );
}
