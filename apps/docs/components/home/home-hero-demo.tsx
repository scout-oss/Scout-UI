"use client";

import { Sticker, StickerStack } from "@scout-ui/react";
import { StickerTrail } from "@scout-ui/sticker-trail";
import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

const sources = [sunnySmile, wonkyStar, attentionBolt] as const;

const cards = [
  { id: "semantic", label: "NATIVE SEMANTICS", tone: "#c8ff26" },
  { id: "bounded", label: "BOUNDED MOTION", tone: "#6fe8ff" },
  { id: "handoff", label: "REAL HANDOFF", tone: "#ff70c8" },
] as const;

export function HomeHeroDemo() {
  return (
    <StickerTrail
      aria-label="Interactive Scout UI composition"
      className="sui-docs-hero-board"
      maxActive={8}
      preset="calm"
      reducedMotion="system"
      stickers={sources}
    >
      <p>CONTROLLED</p>
      <p>CHAOS</p>
      <StickerStack
        className="sui-docs-hero-stack"
        getKey={(item) => item.id}
        items={cards}
        renderItem={(item, context) => (
          <div aria-label={item.label} style={{ background: item.tone }}>
            <strong>{item.label}</strong>
            <Sticker
              alt=""
              rotation={context.index * 6 - 5}
              size="lg"
              source={sources[context.index % sources.length] ?? sunnySmile}
            />
          </div>
        )}
        visibleCount={3}
      />
      <span className="sui-docs-hero-tape">move inside this bounded field</span>
    </StickerTrail>
  );
}
