import type { HTMLAttributes, ReactNode } from "react";
import { useMemo, useRef } from "react";

import { TRAIL_SLOT_ATTRIBUTE } from "./engine.js";
import { resolveTrailOptions } from "./presets.js";
import type { StickerTrailOptions } from "./types.js";
import { useStickerTrail } from "./useStickerTrail.js";

/**
 * `HTMLAttributes<HTMLDivElement>` was checked against the validated React
 * range: it declares only `translate` and `color` among names that could
 * collide, and neither `size`, `scale`, nor `rotate` appears on it. No trail
 * option collides, so `children` is the only omission required.
 */
export interface StickerTrailProps
  extends
    StickerTrailOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  layerClassName?: string;
}

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function StickerTrail(props: StickerTrailProps) {
  const {
    children,
    className,
    clip,
    enabled,
    exit,
    layerClassName,
    lifetime,
    maxActive,
    preset,
    reducedMotion,
    rotation,
    scale,
    seed,
    sequence,
    size,
    spacing,
    stickers,
    touch,
    ...elementProps
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const trailOptions: StickerTrailOptions = {
    ...(clip === undefined ? {} : { clip }),
    ...(enabled === undefined ? {} : { enabled }),
    ...(exit === undefined ? {} : { exit }),
    ...(lifetime === undefined ? {} : { lifetime }),
    ...(maxActive === undefined ? {} : { maxActive }),
    ...(preset === undefined ? {} : { preset }),
    ...(reducedMotion === undefined ? {} : { reducedMotion }),
    ...(rotation === undefined ? {} : { rotation }),
    ...(scale === undefined ? {} : { scale }),
    ...(seed === undefined ? {} : { seed }),
    ...(sequence === undefined ? {} : { sequence }),
    ...(size === undefined ? {} : { size }),
    ...(spacing === undefined ? {} : { spacing }),
    ...(touch === undefined ? {} : { touch }),
    stickers,
  };

  // Pool size comes from the same pure resolution the engine uses, so the
  // server and the first client render always emit an identical inert pool.
  const resolved = resolveTrailOptions(trailOptions);
  const slots = useMemo(
    () => Array.from({ length: resolved.maxActive }, (_, index) => index),
    [resolved.maxActive],
  );

  useStickerTrail({ ...trailOptions, containerRef, layerRef });

  return (
    <div
      {...elementProps}
      className={joinClassNames("sui-trail", className)}
      data-clip={resolved.clip ? "true" : "false"}
      ref={containerRef}
    >
      {children}
      <div
        aria-hidden="true"
        className={joinClassNames("sui-trail-layer", layerClassName)}
        ref={layerRef}
        role="presentation"
      >
        {slots.map((slot) => (
          <img
            alt=""
            className="sui-trail-item"
            data-active="false"
            decoding="async"
            draggable={false}
            key={slot}
            {...{ [TRAIL_SLOT_ATTRIBUTE]: "" }}
          />
        ))}
      </div>
    </div>
  );
}
