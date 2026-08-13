"use client";

import { StickerCursor } from "@scout-ui/react";
import { useState } from "react";

import { cursorSources } from "../cursor/cursor-sources";

/**
 * Engineering review surface for hotspot correctness.
 *
 * The crosshair guides belong to this fixture, not to the component: the
 * production cursor renders no diagnostic markers. Each panel puts a known
 * hotspot under a known crosshair so a mismatch is visible rather than subtle,
 * and the state switch makes hotspot drift across a visual change obvious.
 */

const hotspots = [
  { label: "centre", x: 0.5, y: 0.5 },
  { label: "top-left tip", x: 0, y: 0 },
  { label: "bottom-right", x: 1, y: 1 },
  { label: "quarter", x: 0.25, y: 0.75 },
] as const;

export function HotspotPreview() {
  const [state, setState] = useState<"default" | "tall">("default");

  return (
    <>
      <section aria-labelledby="hotspot-grid-heading">
        <h2 id="hotspot-grid-heading">Declared hotspots</h2>
        <div className="cursor-hotspot-grid" data-testid="hotspot-grid">
          {hotspots.map((hotspot) => (
            <StickerCursor
              className="cursor-box cursor-hotspot-panel"
              data-hotspot={hotspot.label}
              data-testid={`hotspot-${hotspot.label.replace(/\s/gu, "-")}`}
              key={hotspot.label}
              size={64}
              smoothing={0}
              visuals={{
                default: {
                  hotspot: { x: hotspot.x, y: hotspot.y },
                  source: cursorSources.default,
                },
              }}
            >
              <p className="cursor-hotspot-label">{hotspot.label}</p>
              {/* Fixture-only alignment guides. */}
              <span aria-hidden="true" className="cursor-crosshair" />
            </StickerCursor>
          ))}
        </div>
      </section>

      <section aria-labelledby="hotspot-stability-heading">
        <h2 id="hotspot-stability-heading">Stability across a state change</h2>
        <button
          data-testid="hotspot-toggle"
          onClick={() => {
            setState((value) => (value === "default" ? "tall" : "default"));
          }}
          type="button"
        >
          Visual: {state}
        </button>
        <StickerCursor
          className="cursor-box"
          data-testid="hotspot-stability"
          size={64}
          smoothing={0}
          visuals={{
            // Two visuals with different aspect ratios and different declared
            // anchors. Both must keep the same screen point under the pointer.
            default: {
              hotspot: { x: 0.5, y: 0.5 },
              source:
                state === "default"
                  ? cursorSources.default
                  : cursorSources.tall,
            },
            sparkle: {
              hotspot: { x: 0.1, y: 0.9 },
              source: cursorSources.sparkle,
            },
          }}
        >
          <p>Move across the annotated region and back.</p>
          <span aria-hidden="true" className="cursor-crosshair" />
          <div data-sticker-cursor="sparkle" data-testid="hotspot-sparkle-zone">
            Sparkle zone: a different visual and a different declared hotspot
          </div>
        </StickerCursor>
      </section>
    </>
  );
}
