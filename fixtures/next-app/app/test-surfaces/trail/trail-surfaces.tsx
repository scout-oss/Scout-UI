"use client";

import { StickerTrail } from "@scout-ui/react";
import { useStickerTrail } from "@scout-ui/react/sticker-trail";
import { useRef, useState } from "react";

import { officialSources, probeSources } from "./trail-sources";

/** Fixed variance so a screenshot or coordinate read is reproducible. */
const probeShape = {
  rotation: { min: 0, max: 0 },
  scale: { min: 1, max: 1 },
  size: { min: 24, max: 24 },
  spacing: { min: 20, max: 20 },
} as const;

function HookTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const controller = useStickerTrail({
    containerRef,
    layerRef,
    lifetime: 5000,
    maxActive: 8,
    seed: "hook",
    stickers: probeSources,
    ...probeShape,
  });

  return (
    <section aria-labelledby="hook-trail-heading">
      <h2 id="hook-trail-heading">Hook trail</h2>
      <div className="trail-box" data-testid="hook-trail" ref={containerRef}>
        <p>The hook drives a container the caller owns.</p>
        <div
          aria-hidden="true"
          className="sui-trail-layer"
          data-testid="hook-trail-layer"
          ref={layerRef}
          role="presentation"
        />
      </div>
      <button
        onClick={() => {
          controller.clear();
        }}
        type="button"
      >
        Clear hook trail
      </button>
      <button
        onClick={() => {
          controller.pause();
        }}
        type="button"
      >
        Pause hook trail
      </button>
      <button
        onClick={() => {
          controller.resume();
        }}
        type="button"
      >
        Resume hook trail
      </button>
    </section>
  );
}

export function TrailSurfaces() {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <section aria-labelledby="wrapper-trail-heading">
        <h2 id="wrapper-trail-heading">Wrapper trail</h2>
        <StickerTrail
          className="trail-box"
          data-testid="wrapper-trail"
          lifetime={5000}
          maxActive={8}
          seed="wrapper"
          stickers={probeSources}
          {...probeShape}
        >
          <p data-testid="wrapper-trail-text">
            Selectable copy underneath the decorative layer.
          </p>
          <button
            data-testid="wrapper-trail-button"
            onClick={() => {
              setClicks((value) => value + 1);
            }}
            type="button"
          >
            Clicks: {clicks}
          </button>
        </StickerTrail>
      </section>

      <HookTrail />

      <section aria-labelledby="offset-trail-heading">
        <h2 id="offset-trail-heading">Offset container</h2>
        {/* Scrollable regions need keyboard access; this is fixture markup,
            not a library requirement. */}
        <div
          aria-label="Offset trail scroller"
          className="trail-scroller"
          data-testid="trail-scroller"
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard.
          tabIndex={0}
        >
          <div className="trail-scroller-spacer" />
          <StickerTrail
            className="trail-box trail-box-offset"
            data-testid="offset-trail"
            lifetime={5000}
            maxActive={8}
            seed="offset"
            stickers={probeSources}
            {...probeShape}
          >
            <p>Positioned, padded, bordered, and inside a scroller.</p>
          </StickerTrail>
          <div className="trail-scroller-spacer" />
        </div>
      </section>

      <section aria-labelledby="disabled-trail-heading">
        <h2 id="disabled-trail-heading">Disabled trail</h2>
        <StickerTrail
          className="trail-box"
          data-testid="disabled-trail"
          enabled={false}
          lifetime={5000}
          maxActive={8}
          stickers={probeSources}
          {...probeShape}
        >
          <p>Disabled trails attach no movement loop.</p>
        </StickerTrail>
      </section>

      <section aria-labelledby="tap-trail-heading">
        <h2 id="tap-trail-heading">Tap trail</h2>
        <StickerTrail
          className="trail-box trail-box-tall"
          data-testid="tap-trail"
          lifetime={5000}
          maxActive={8}
          seed="tap"
          stickers={probeSources}
          touch="tap"
          {...probeShape}
        >
          <p>Tap mode spawns once per deliberate tap and never captures.</p>
          <div
            aria-label="Tap surface scrollable content"
            className="trail-scroll-content"
            data-testid="tap-scroll"
            role="region"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard.
            tabIndex={0}
          >
            <p>Scrollable content one.</p>
            <p>Scrollable content two.</p>
            <p>Scrollable content three.</p>
            <p>Scrollable content four.</p>
            <p>Scrollable content five.</p>
          </div>
        </StickerTrail>
      </section>

      <section aria-labelledby="ceiling-trail-heading">
        <h2 id="ceiling-trail-heading">Node ceiling</h2>
        <StickerTrail
          className="trail-box"
          data-testid="ceiling-trail"
          lifetime={5000}
          // Deliberately far beyond the hard ceiling; the engine must clamp.
          maxActive={100000}
          seed="ceiling"
          spacing={{ min: 4, max: 4 }}
          stickers={probeSources}
        >
          <p>Requests an impossible pool size.</p>
        </StickerTrail>
      </section>

      <section aria-labelledby="offscreen-trail-heading">
        <h2 id="offscreen-trail-heading">Offscreen trail</h2>
        <div className="trail-offscreen-spacer" />
        <StickerTrail
          className="trail-box"
          data-testid="offscreen-trail"
          lifetime={5000}
          maxActive={8}
          seed="offscreen"
          stickers={probeSources}
          {...probeShape}
        >
          <p>Spawning pauses while this container is offscreen.</p>
        </StickerTrail>
      </section>

      <section aria-labelledby="official-trail-heading">
        <h2 id="official-trail-heading">Official pack sources</h2>
        <StickerTrail
          className="trail-box"
          data-testid="official-trail"
          seed="official"
          stickers={officialSources}
        >
          <p>Official definitions are structurally valid trail sources.</p>
        </StickerTrail>
      </section>
    </>
  );
}
