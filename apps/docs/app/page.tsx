import { StickerBadge, StickerButton } from "@scout-ui/react";
import { stickerDefinitions } from "@scout-ui/stickers";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  AdhesiveTestButton,
  KineticHeadline,
} from "../components/kinetic/kinetic-headline";
import { Magnetic } from "../components/kinetic/magnetic";
import { SpecimenSheet } from "../components/kinetic/specimen-sheet";
import { SplitWords } from "../components/kinetic/split-words";
import { StickerDesk } from "../components/kinetic/sticker-desk";
import { VelocityStrip } from "../components/kinetic/velocity-strip";
import { PlaygroundSession } from "../components/playground/playground-session";
import { componentCatalog } from "../lib/registry";
import { repositoryUrl, routeMetadata } from "../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/",
  title: "Scout UI — The open-source sticker UI library",
  description:
    "Build accessible, high-performance React interfaces with sticker-native primitives and controlled chaos.",
});

const qualities = [
  { label: "FUNCTIONAL", note: "Native semantics first." },
  { label: "BOUNDED", note: "Motion with an exit plan." },
  { label: "HANDOFF-READY", note: "Public contracts, not demos." },
] as const;

const verbs = [
  "stick",
  "peel",
  "lift",
  "press",
  "carry",
  "shuffle",
  "trail",
  "settle",
] as const;

const rules = [
  {
    title: "Native controls stay native.",
    body: "Buttons are buttons, links are links, badges are real toggles. The sticker is a costume, never a replacement.",
  },
  {
    title: "Motion follows capability and preference.",
    body: "Reduced motion, coarse pointers, and the docs “Reduce effects” switch all resolve to calm, complete states.",
  },
  {
    title: "High-frequency work stays bounded.",
    body: "Pointer coordinates never touch React state. Fixed pools, transforms, and one frame loop that sleeps when idle.",
  },
  {
    title: "Official art stays provenance-cleared.",
    body: "Twenty-five original stickers with documented creators and licenses. Bring your own art with the same contract.",
  },
] as const;

const stack = [
  "React 19",
  "Next.js App Router",
  "CSS variables",
  "SVG / PNG / WebP",
  "Your own art",
] as const;

export default function HomePage() {
  const trail = componentCatalog.get("sticker-trail");
  if (!trail) throw new Error("StickerTrail registry definition is missing.");
  const deskStickers = stickerDefinitions.slice(0, 14);

  return (
    <div className="sui-docs-home sui-k-home" data-pagefind-body>
      <section className="sui-k-hero" data-k-pressure-field>
        <div className="sui-k-hero-meta">
          <StickerBadge rotation={-2} shape="stamp" tone="acid">
            Open source · React · alpha
          </StickerBadge>
          <p>
            Eight primitives
            <span aria-hidden="true"> / </span>
            <br className="sui-k-break" />
            three packages
            <span aria-hidden="true"> / </span>
            <br className="sui-k-break" />
            zero animation libraries
          </p>
        </div>

        <h1 className="sui-k-headline" data-route-heading tabIndex={-1}>
          <KineticHeadline lead="UI THAT" word="STICKS." />
        </h1>

        <div className="sui-k-hero-foot">
          <p className="sui-k-hero-lede">
            Scout UI is the open-source sticker UI library: tactile React
            primitives with native semantics, bounded motion, and enough
            controlled chaos to make interfaces memorable.
          </p>
          <div className="sui-k-hero-actions">
            <Magnetic>
              <StickerButton
                href="/components"
                shape="label"
                size="large"
                tone="acid"
              >
                Browse components
              </StickerButton>
            </Magnetic>
            <StickerButton href="/playground" size="large" tone="paper">
              Open the playground
            </StickerButton>
            <a className="sui-k-text-link" href={repositoryUrl}>
              GitHub ↗
            </a>
          </div>
          <div className="sui-k-hero-note">
            <p>
              <span aria-hidden="true" className="sui-k-scribble-arrow">
                ↖
              </span>
              Grab a letter. Throw it. It sticks back.
            </p>
            <AdhesiveTestButton />
          </div>
        </div>

        <ul aria-label="Scout UI qualities" className="sui-k-stamps">
          {qualities.map((quality, index) => (
            <li
              key={quality.label}
              style={{ "--sui-k-i": index } as CSSProperties}
            >
              <strong>{quality.label}</strong>
              <span>{quality.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <VelocityStrip words={verbs} />

      <section
        aria-labelledby="specimens-heading"
        className="sui-k-section sui-k-gallery"
      >
        <header className="sui-k-section-head" data-k-reveal>
          <p className="sui-k-kicker">
            <span>01</span> The specimen sheet
          </p>
          <h2 id="specimens-heading">
            <SplitWords text="Eight components. Every one *live*." />
          </h2>
          <p>
            Nothing below is a screenshot. Each tile is the published component
            doing the one thing it is best at — peel it, throw it, press it,
            draw on it. Arrow keys and buttons reach every one.
          </p>
        </header>
        <SpecimenSheet />
      </section>

      <section
        aria-labelledby="handoff-heading"
        className="sui-k-section sui-k-handoff"
        id="config-to-handoff"
      >
        <header className="sui-k-section-head" data-k-reveal>
          <p className="sui-k-kicker">
            <span>02</span> From config to handoff
          </p>
          <h2 id="handoff-heading">
            <SplitWords text="Turn one knob. Three outputs *agree*." />
          </h2>
          <p>
            Change the bounded Trail once: the live preview, deterministic code,
            and configuration-aware AI prompt stay aligned through one registry.
            Copy whichever your workflow needs.
          </p>
        </header>
        <PlaygroundSession
          initialConfig={{ ...trail.defaults }}
          mode="component"
          slug="sticker-trail"
        />
      </section>

      <section
        aria-labelledby="drawer-heading"
        className="sui-k-section sui-k-drawer"
        data-sui-theme="night"
      >
        <header className="sui-k-section-head" data-k-reveal>
          <p className="sui-k-kicker">
            <span>03</span> The sticker drawer
          </p>
          <h2 id="drawer-heading">
            <SplitWords text="Twenty-five originals. Go on, make a *mess*." />
          </h2>
          <p>
            The official pack is framework-neutral SVG with documented
            provenance. Pick a sticker up, flick it, watch it skid — then bring
            your own PNG, WebP, SVG, or React art with the same contract.
          </p>
          <div className="sui-k-drawer-actions">
            <StickerButton href="/stickers" tone="cyan">
              Open the drawer
            </StickerButton>
            <ul aria-label="Supported artwork" className="sui-k-format-tags">
              <li>SVG</li>
              <li>PNG</li>
              <li>WebP</li>
              <li>React</li>
            </ul>
          </div>
        </header>
        <StickerDesk
          label={`A desk of ${String(deskStickers.length)} official Scout UI stickers. Drag to throw them; use Shuffle or Tidy up from the keyboard.`}
          stickers={deskStickers}
        />
      </section>

      <section
        aria-labelledby="rules-heading"
        className="sui-k-section sui-k-rules"
      >
        <header className="sui-k-section-head" data-k-reveal>
          <p className="sui-k-kicker">
            <span>04</span> Production rules
          </p>
          <h2 id="rules-heading">
            <SplitWords text="Expression with an *exit* plan." />
          </h2>
        </header>
        <ol className="sui-k-rule-list">
          {rules.map((rule, index) => (
            <li
              data-k-reveal
              key={rule.title}
              style={{ "--sui-k-i": index } as CSSProperties}
            >
              <span aria-hidden="true" className="sui-k-rule-number">
                {index + 1}
              </span>
              <h3>{rule.title}</h3>
              <p>{rule.body}</p>
            </li>
          ))}
        </ol>
        <div className="sui-k-stack-row">
          <p>Works with your stack</p>
          <ul aria-label="Works with your stack">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="final-heading"
        className="sui-k-final"
        data-sui-theme="night"
      >
        <p className="sui-k-kicker">Alpha preflight · not yet an npm release</p>
        <h2 data-k-reveal id="final-heading">
          <SplitWords text="Make something that *sticks.*" />
        </h2>
        <div className="sui-k-install">
          <code>pnpm add @scout-ui/react</code>
          <p>
            Use the install command once a public alpha is announced. Today,
            inspect the packages and verified consumer fixtures in the
            repository.
          </p>
        </div>
        <div className="sui-k-final-actions">
          <StickerButton href="/components" size="large" tone="acid">
            Browse components
          </StickerButton>
          <StickerButton href={repositoryUrl} size="large" tone="paper">
            GitHub ↗
          </StickerButton>
        </div>
        <nav aria-label="Ways to contribute" className="sui-k-contribute">
          <p>Built in public —</p>
          <Link href="/open-source">contribute code</Link>
          <Link href="/guides/accessibility">test accessibility</Link>
          <Link href="/guides/asset-authoring">draw stickers</Link>
          <Link href="/guides/contributing">write docs</Link>
        </nav>
      </section>
    </div>
  );
}
