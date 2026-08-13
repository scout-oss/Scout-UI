import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import {
  joinClassNames,
  type ScoutMotionPolicy,
  type StickerSource,
} from "../shared-types.js";
import {
  clampSize,
  clampSmoothing,
  clampTilt,
  type Hotspot,
  normalizeHotspot,
} from "./cursor-math.js";
import {
  createStickerCursorEngine,
  type ResolvedCursorOptions,
  type ResolvedCursorVisual,
  type StickerCursorEngine,
} from "./engine.js";
import { DEFAULT_STATE_ATTRIBUTE } from "./state.js";

// The conventional names document the vocabulary and drive editor completion
// even though the union stays open for product-specific state names.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type StickerCursorState = "default" | "hover" | "active" | string;

export interface CursorVisual {
  source: StickerSource;
  /**
   * Normalised fractions of the rendered visual box, `{ x: 0.5, y: 0.5 }` being
   * its centre and the default. Normalised rather than pixel coordinates so the
   * apparent pointer position survives a state change to artwork with different
   * intrinsic dimensions, and survives `size` overriding those dimensions.
   */
  hotspot?: Hotspot;
}

export interface StickerCursorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">, ScoutMotionPolicy {
  children: ReactNode;
  visuals: Record<StickerCursorState, CursorVisual> & {
    default: CursorVisual;
  };
  enabled?: boolean;
  size?: number;
  tilt?: number;
  smoothing?: number;
  clickFeedback?: "none" | "press" | "echo";
  hideNative?: "when-ready" | "never";
  stateAttribute?: string;
  disabledSelector?: string;
  layerClassName?: string;
}

/**
 * A stable semantic key for the resolved options. The engine restarts on this
 * rather than on object identity, so a consumer may inline the `visuals` object
 * literal without tearing the engine down on every parent render.
 */
function buildSignature(options: ResolvedCursorOptions): string {
  return JSON.stringify([
    [...options.visuals.entries()].map(([state, visual]) => [
      state,
      visual.src,
      visual.hotspot.x,
      visual.hotspot.y,
    ]),
    options.clickFeedback,
    options.disabledSelector ?? "",
    options.enabled,
    options.hideNative,
    options.reducedMotion,
    options.size,
    options.smoothing,
    options.stateAttribute,
    options.tilt,
  ]);
}

export function StickerCursor(props: StickerCursorProps) {
  const {
    children,
    className,
    clickFeedback,
    disabledSelector,
    enabled,
    hideNative,
    layerClassName,
    reducedMotion,
    size,
    smoothing,
    stateAttribute,
    tilt,
    visuals,
    ...elementProps
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLImageElement>(null);
  const engineRef = useRef<StickerCursorEngine | null>(null);

  // Resolution is pure, so it runs during render. No browser capability is
  // consulted here; that happens inside the engine, after mount.
  const resolvedVisuals = new Map<string, ResolvedCursorVisual>();
  for (const [state, visual] of Object.entries(visuals)) {
    resolvedVisuals.set(state, {
      hotspot: normalizeHotspot(visual.hotspot),
      src: visual.source.src,
    });
  }

  const nextResolved: ResolvedCursorOptions = {
    clickFeedback: clickFeedback ?? "press",
    disabledSelector,
    enabled: enabled ?? true,
    hideNative: hideNative ?? "when-ready",
    reducedMotion: reducedMotion ?? "system",
    size: clampSize(size),
    smoothing: clampSmoothing(smoothing),
    stateAttribute: stateAttribute ?? DEFAULT_STATE_ATTRIBUTE,
    tilt: clampTilt(tilt),
    visuals: resolvedVisuals,
  };

  const signature = buildSignature(nextResolved);
  const resolved = useMemo(
    () => nextResolved,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the signature is the semantic identity of `nextResolved`.
    [signature],
  );

  useEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    const visual = visualRef.current;
    if (container === null || layer === null || visual === null) {
      return undefined;
    }

    const engine = createStickerCursorEngine(
      { container, layer, visual },
      resolved,
    );
    engineRef.current = engine;

    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, [resolved]);

  return (
    <div
      {...elementProps}
      className={joinClassNames("sui-sticker-cursor", className)}
      ref={containerRef}
    >
      {children}
      <div
        aria-hidden="true"
        className={joinClassNames("sui-sticker-cursor-layer", layerClassName)}
        data-visible="false"
        ref={layerRef}
        role="presentation"
      >
        {/*
          One lightweight image node. The engine writes only transform inputs to
          it, so pointer movement never reaches React. `alt=""` plus the
          aria-hidden layer keep it out of the accessibility tree entirely.
        */}
        <img
          alt=""
          className="sui-sticker-cursor-visual"
          data-sui-cursor-visual=""
          decoding="async"
          draggable={false}
          ref={visualRef}
        />
      </div>
    </div>
  );
}
