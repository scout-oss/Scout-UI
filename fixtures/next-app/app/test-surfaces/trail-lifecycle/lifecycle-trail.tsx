"use client";

import { StickerTrail } from "@scout-ui/react";
import { useStickerTrail } from "@scout-ui/react/sticker-trail";
import { StrictMode, useRef, useState } from "react";

import { probeSources } from "../trail/trail-sources";

function HookLifecycleTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useStickerTrail({
    containerRef,
    layerRef,
    maxActive: 6,
    seed: "lifecycle-hook",
    stickers: probeSources,
  });

  return (
    <div
      className="trail-box"
      data-testid="lifecycle-hook-trail"
      ref={containerRef}
    >
      <p>Hook-owned pool</p>
      <div
        aria-hidden="true"
        className="sui-trail-layer"
        data-testid="lifecycle-hook-layer"
        ref={layerRef}
        role="presentation"
      />
    </div>
  );
}

/**
 * Mount and unmount the trail on demand so a test can replay setup/cleanup
 * many times. React Strict Mode performs the same replay; both must leave no
 * listener, observer, frame, or node behind.
 */
export function LifecycleTrail() {
  const [mounted, setMounted] = useState(true);
  const [cycle, setCycle] = useState(0);

  return (
    <section aria-labelledby="lifecycle-heading">
      <h2 id="lifecycle-heading">Mount lifecycle</h2>
      <p data-testid="lifecycle-cycle">{cycle}</p>
      <button
        data-testid="lifecycle-toggle"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount trail" : "Mount trail"}
      </button>
      <button
        data-testid="lifecycle-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount trail
      </button>
      <StrictMode>
        {mounted ? (
          <div data-testid="lifecycle-mounted" key={cycle}>
            <StickerTrail
              className="trail-box"
              data-testid="lifecycle-trail"
              maxActive={6}
              seed="lifecycle"
              stickers={probeSources}
            >
              <p>Wrapper-owned pool</p>
            </StickerTrail>
            <HookLifecycleTrail />
          </div>
        ) : null}
      </StrictMode>
    </section>
  );
}
