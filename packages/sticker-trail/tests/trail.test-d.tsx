import { useRef } from "react";

import { StickerTrail, useStickerTrail } from "../src/index.js";
import type {
  StickerTrailController,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailProps,
  StickerSource,
} from "../src/index.js";

const stickers: readonly StickerSource[] = [{ id: "star", src: "/star.svg" }];

const validUsage = (
  <>
    <StickerTrail stickers={stickers} />
    <StickerTrail preset="chaos" seed="fixed" stickers={stickers} />
    <StickerTrail
      clip={false}
      exit="float"
      lifetime={900}
      maxActive={12}
      rotation={{ min: -10, max: 10 }}
      scale={{ min: 0.9, max: 1.1 }}
      sequence="ordered"
      size={{ min: 40, max: 80 }}
      spacing={{ min: 30, max: 60 }}
      stickers={stickers}
      touch="tap"
    />
    {/* Div attributes still pass through, including the ones nearest a collision. */}
    <StickerTrail
      aria-label="Bounded canvas"
      className="hero"
      color="rebeccapurple"
      id="hero-trail"
      layerClassName="hero-layer"
      onClick={() => undefined}
      stickers={stickers}
      style={{ minHeight: 320 }}
      translate="no"
    >
      <p>Content stays the real interface.</p>
    </StickerTrail>
  </>
);

export { validUsage };

// `size` and `scale` resolve to the Trail ranges, not to DOM attributes.
export const sizeIsARange = { min: 24, max: 48 } satisfies NonNullable<
  StickerTrailProps["size"]
>;
export const scaleIsARange = { min: 0.5, max: 1.5 } satisfies NonNullable<
  StickerTrailProps["scale"]
>;

export const everyPreset = [
  "calm",
  "scout",
  "dense",
  "floaty",
  "chaos",
] satisfies StickerTrailPreset[];

export function HookUsage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const controller: StickerTrailController = useStickerTrail({
    containerRef,
    layerRef,
    stickers,
  });

  return (
    <div ref={containerRef}>
      <div ref={layerRef} />
      <button onClick={controller.clear} type="button">
        Clear
      </button>
    </div>
  );
}

// Each rejection stays on one line so the `@ts-expect-error` directive keeps
// pointing at the expression that must fail; Prettier would otherwise wrap the
// object literal onto its own line and detach the two.
// @ts-expect-error `stickers` is required.
export const missingStickers = {} satisfies StickerTrailOptions;
// @ts-expect-error the preset union is closed.
// prettier-ignore
export const unknownPreset = { preset: "wild", stickers } satisfies StickerTrailOptions;
// @ts-expect-error a range needs both bounds.
// prettier-ignore
export const partialSize = { size: { min: 20 }, stickers } satisfies StickerTrailOptions;
// @ts-expect-error the touch policy union is closed.
// prettier-ignore
export const unknownTouch = { stickers, touch: "swipe" } satisfies StickerTrailOptions;
// @ts-expect-error the exit union is closed.
// prettier-ignore
export const unknownExit = { exit: "explode", stickers } satisfies StickerTrailOptions;
// @ts-expect-error a public option to ignore an operating-system request is intentionally absent.
// prettier-ignore
export const forcedMotion = { reducedMotion: "never", stickers } satisfies StickerTrailOptions;
// @ts-expect-error arbitrary React renderers are excluded from trail sources.
// prettier-ignore
export const nodeSource = { stickers: [<span key="a" />] } satisfies StickerTrailOptions;
