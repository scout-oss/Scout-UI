import { Sticker } from "@scout-ui/react/sticker";
import { StickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton } from "@scout-ui/react/sticker-button";
import { loopArrow } from "@scout-ui/stickers/definitions/loop-arrow";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

import {
  BadgeReviewStates,
  InteractivePrimitives,
} from "./interactive-primitives";

const tones = [
  "paper",
  "ink",
  "ultraviolet",
  "acid",
  "cyan",
  "pink",
  "cobalt",
  "orange",
] as const;

export default function PrimitiveGalleryPage() {
  return (
    <main
      className="primitive-gallery sui-theme"
      data-testid="primitive-gallery"
    >
      <header className="primitive-hero">
        <p className="token-eyebrow">
          Milestone 5 · deterministic review canvas
        </p>
        <h1>Primitives with a little mischief.</h1>
        <p>
          Hard depth, authored irregularity, native semantics, and no theme
          provider in sight.
        </p>
      </header>

      <section className="primitive-section" aria-labelledby="sticker-heading">
        <div className="primitive-section-heading">
          <p>01 / Object</p>
          <h2 id="sticker-heading">Sticker</h2>
        </div>
        <div className="primitive-surface-grid">
          <div className="primitive-canvas primitive-canvas-paper">
            <h3>Intrinsic artwork</h3>
            <div className="primitive-row primitive-row-bottom">
              <Sticker
                source={wonkyStar}
                size="xs"
                rotation={-4}
                shadow="stuck"
              />
              <Sticker
                source={wonkyStar}
                alt="Wonky acid star"
                size="md"
                rotation={3}
              />
              <Sticker
                source={loopArrow}
                size="lg"
                rotation={-6}
                shadow="lifted"
              />
            </div>
            <small>Official assets retain their own cut lines.</small>
          </div>
          <div className="primitive-canvas primitive-canvas-night sui-theme--night">
            <h3>Consumer artwork</h3>
            <div className="primitive-row primitive-row-bottom">
              <Sticker outline="ink" shadow="none" size="sm" tone="orange">
                RAW
              </Sticker>
              <Sticker material="paper" size="md" tone="cyan" rotation={-3}>
                ✦
              </Sticker>
              <Sticker
                material="photo"
                outline="cutline"
                size="lg"
                tone="paper"
                rotation={4}
              >
                <span className="primitive-photo-placeholder">PHOTO</span>
              </Sticker>
              <Sticker material="metallic" outline="ink" size="md" tone="paper">
                METAL
              </Sticker>
            </div>
          </div>
        </div>
      </section>

      <section className="primitive-section" aria-labelledby="button-heading">
        <div className="primitive-section-heading">
          <p>02 / Action</p>
          <h2 id="button-heading">StickerButton</h2>
        </div>
        <div className="primitive-tone-grid">
          {tones.map((tone) => (
            <StickerButton
              href="#button-heading"
              key={tone}
              shape="label"
              tone={tone}
            >
              {tone}
            </StickerButton>
          ))}
        </div>
        <div className="primitive-state-board">
          <StickerButton size="compact" shape="label" tone="acid">
            Compact
          </StickerButton>
          <StickerButton
            leading={<span aria-hidden="true">✦</span>}
            shape="paper"
            tone="ultraviolet"
            trailing={<span aria-hidden="true">↗</span>}
          >
            Default action
          </StickerButton>
          <StickerButton
            href="#badge-heading"
            size="large"
            shape="pill"
            tone="cyan"
          >
            Anchor action →
          </StickerButton>
          <StickerButton disabled tone="orange">
            Disabled action
          </StickerButton>
          <StickerButton loading loadingLabel="Saving draft" tone="paper">
            Save this very important draft
          </StickerButton>
          <StickerButton className="primitive-focus-demo" tone="cobalt">
            Focus resting baseline
          </StickerButton>
          <StickerButton className="primitive-wrap-button" tone="pink">
            A deliberately long action label that wraps without breaking the
            layout
          </StickerButton>
        </div>
      </section>

      <section className="primitive-section" aria-labelledby="badge-heading">
        <div className="primitive-section-heading">
          <p>03 / Label</p>
          <h2 id="badge-heading">StickerBadge</h2>
        </div>
        <div className="primitive-state-board">
          <StickerBadge size="compact">Static</StickerBadge>
          <StickerBadge shape="stamp" tone="orange">
            NEW
          </StickerBadge>
          <StickerBadge shape="pill" tone="acid">
            Category
          </StickerBadge>
          <BadgeReviewStates />
          <StickerBadge
            className="primitive-long-badge"
            shape="label"
            title="A very long status label with its full value available in the title"
            tone="paper"
          >
            A very long status label with its full value available in the title
          </StickerBadge>
        </div>
      </section>

      <section
        className="primitive-section primitive-custom-theme"
        aria-labelledby="custom-heading"
      >
        <div className="primitive-section-heading">
          <p>04 / Consumer CSS</p>
          <h2 id="custom-heading">No provider. No Tailwind.</h2>
        </div>
        <div className="primitive-state-board primitive-consumer-font">
          <Sticker outline="cutline" tone="acid">
            CSS
          </Sticker>
          <StickerButton tone="ultraviolet">Custom theme action</StickerButton>
          <StickerBadge tone="cyan">Inherited serif font</StickerBadge>
        </div>
      </section>

      <section
        className="primitive-section"
        aria-labelledby="interaction-heading"
      >
        <div className="primitive-section-heading">
          <p>05 / Client wrapper</p>
          <h2 id="interaction-heading">Real interactions</h2>
        </div>
        <InteractivePrimitives />
      </section>
    </main>
  );
}
