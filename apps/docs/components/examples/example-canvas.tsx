"use client";

import {
  Sticker,
  StickerBadge,
  StickerButton,
  StickerCursor,
  StickerNavbar,
  StickerPeel,
  StickerStack,
} from "@scout-ui/react";
import { StickerTrail } from "@scout-ui/sticker-trail";
import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import { useState } from "react";

import type { ExampleSlug } from "../../lib/content/examples";

const sun = sunnySmile;
const star = wonkyStar;
const bolt = attentionBolt;

const stories = [
  {
    id: "one",
    quote: "Expression needs boundaries to stay usable.",
    by: "Mira · design",
  },
  {
    id: "two",
    quote: "Native semantics are the strongest special effect.",
    by: "Jon · engineering",
  },
  {
    id: "three",
    quote: "One loud interaction beats ten competing ones.",
    by: "Ari · product",
  },
] as const;

export function ExampleCanvas({ slug }: { readonly slug: ExampleSlug }) {
  const [mood, setMood] = useState("bright");

  if (slug === "sticker-trail-hero") {
    return (
      <StickerTrail
        className="sui-docs-recipe-trail"
        maxActive={10}
        preset="scout"
        stickers={[sun, star, bolt]}
      >
        <StickerBadge tone="acid">Bounded campaign region</StickerBadge>
        <h2>Make the launch feel alive.</h2>
        <p>The message and link work without pointer decoration.</p>
        <StickerButton href="#recipe-notes" tone="cyan">
          Read the implementation notes
        </StickerButton>
      </StickerTrail>
    );
  }

  if (slug === "custom-cursor-canvas") {
    return (
      <StickerCursor
        className="sui-docs-recipe-cursor"
        clickFeedback="echo"
        visuals={{
          default: { source: star, hotspot: { x: 0.5, y: 0.5 } },
          hover: { source: sun, hotspot: { x: 0.5, y: 0.5 } },
        }}
      >
        <p className="sui-docs-eyebrow">Cursor-safe canvas</p>
        <h2 data-sui-cursor="hover">Compare the tactile finish.</h2>
        <p>Move here; editable and native regions keep the system cursor.</p>
        <button type="button">Native control stays native</button>
      </StickerCursor>
    );
  }

  if (slug === "campaign-navbar") {
    return (
      <div className="sui-docs-recipe-navbar">
        <StickerNavbar
          activeId="work"
          brand={<strong>LOUD / LAB</strong>}
          items={[
            { id: "work", label: "Work", href: "#work" },
            { id: "notes", label: "Notes", href: "#notes" },
            { id: "contact", label: "Contact", href: "#contact" },
          ]}
          showScrollProgress
          variant="ribbon"
        />
        <div>
          <h2>A campaign header with real anchors.</h2>
          <p>Decoration stays behind the navigation contract.</p>
        </div>
      </div>
    );
  }

  if (slug === "peel-product-detail") {
    return (
      <StickerPeel
        className="sui-docs-recipe-peel"
        drag
        front={
          <div>
            <Sticker alt="" source={bolt} size="lg" />
            <h2>Recycled paper field notebook</h2>
            <p>Peel for optional material details.</p>
          </div>
        }
        back={
          <div>
            <p className="sui-docs-eyebrow">Material note</p>
            <h2>80% post-consumer fibre</h2>
            <p>Printed locally with water-based ink.</p>
          </div>
        }
        revealLabel="Reveal material details"
        closeLabel="Close material details"
      />
    );
  }

  if (slug === "sticker-mood-board") {
    return (
      <div className="sui-docs-recipe-mood">
        <div>
          <Sticker
            alt="Smiling sun"
            rotation={-7}
            shadow="lifted"
            size="xl"
            source={sun}
          />
          <Sticker
            alt="Wonky star"
            rotation={9}
            shadow="stuck"
            size="lg"
            source={star}
          />
        </div>
        <h2>Choose a visual mood.</h2>
        <div role="group" aria-label="Mood">
          {["bright", "bold", "calm"].map((item) => (
            <StickerBadge
              key={item}
              mode="select"
              onSelectedChange={() => {
                setMood(item);
              }}
              selected={mood === item}
              tone={
                item === "bright" ? "acid" : item === "bold" ? "pink" : "cyan"
              }
            >
              {item}
            </StickerBadge>
          ))}
        </div>
        <p aria-live="polite">Selected mood: {mood}</p>
      </div>
    );
  }

  return (
    <StickerStack
      className="sui-docs-recipe-stack"
      drag
      getKey={(item) => item.id}
      items={stories}
      keyboard
      renderItem={(item) => (
        <article>
          <p>“{item.quote}”</p>
          <strong>{item.by}</strong>
        </article>
      )}
    />
  );
}
