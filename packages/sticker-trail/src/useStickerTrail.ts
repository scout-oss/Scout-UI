import { type RefObject, useEffect, useMemo, useRef } from "react";

import { createStickerTrailEngine, type StickerTrailEngine } from "./engine.js";
import { buildTrailSignature, resolveTrailOptions } from "./presets.js";
import type { StickerTrailController, StickerTrailOptions } from "./types.js";

export interface UseStickerTrailOptions extends StickerTrailOptions {
  containerRef: RefObject<HTMLElement | null>;
  layerRef: RefObject<HTMLElement | null>;
}

/**
 * Drive a trail inside a container the caller owns.
 *
 * The returned controller is referentially stable, and no value the engine
 * touches at pointer frequency is stored in React state.
 */
export function useStickerTrail(
  options: UseStickerTrailOptions,
): StickerTrailController {
  const { containerRef, layerRef, ...trailOptions } = options;
  const engineRef = useRef<StickerTrailEngine | null>(null);

  // Resolution is pure, so it runs during render. The signature — not object
  // identity — decides when the engine restarts, which lets a consumer inline
  // the `stickers` array without tearing the engine down every parent render.
  const nextResolved = resolveTrailOptions(trailOptions);
  const signature = buildTrailSignature(nextResolved);
  const resolved = useMemo(
    () => nextResolved,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the signature is the semantic identity of `nextResolved`.
    [signature],
  );

  useEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    if (container === null || layer === null) {
      return undefined;
    }

    const engine = createStickerTrailEngine({ container, layer }, resolved);
    engineRef.current = engine;

    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, [containerRef, layerRef, resolved]);

  return useMemo<StickerTrailController>(
    () => ({
      clear: () => {
        engineRef.current?.clear();
      },
      pause: () => {
        engineRef.current?.pause();
      },
      resume: () => {
        engineRef.current?.resume();
      },
    }),
    [],
  );
}
