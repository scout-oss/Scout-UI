"use client";

import { StickerTrail } from "@scout-ui/react";
import type { StickerTrailPreset } from "@scout-ui/react";

import { officialSources } from "../trail/trail-sources";

/**
 * Deterministic preset comparison. Every panel shares one seed, one viewport,
 * and one pointer path, so the only variable is the preset itself.
 */
const presets = [
  "calm",
  "scout",
  "dense",
  "floaty",
  "chaos",
] as const satisfies readonly StickerTrailPreset[];

export function PresetGrid() {
  return (
    <div className="trail-preset-grid" data-testid="trail-preset-grid">
      {presets.map((preset) => (
        <section
          aria-labelledby={`preset-${preset}-heading`}
          className="trail-preset-panel"
          key={preset}
        >
          <h2 className="trail-preset-title" id={`preset-${preset}-heading`}>
            {preset}
          </h2>
          <StickerTrail
            className="trail-box trail-preset-canvas"
            data-preset={preset}
            data-testid={`preset-trail-${preset}`}
            preset={preset}
            seed="scout-ui-preset-comparison"
            stickers={officialSources}
          />
        </section>
      ))}
    </div>
  );
}
