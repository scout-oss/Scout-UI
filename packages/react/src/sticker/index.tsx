import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import {
  joinClassNames,
  type ScoutIntensity,
  type ScoutMotionPolicy,
  type ScoutStyleProperties,
  type StickerSource,
  type StickerTone,
} from "../shared-types.js";

// The explicit names document the scale even though arbitrary CSS strings are
// intentionally accepted by the public contract.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type StickerSize = "xs" | "sm" | "md" | "lg" | "xl" | number | string;
export type StickerMaterial = "flat" | "paper" | "photo" | "metallic";
export type StickerOutline = "none" | "ink" | "paper" | "cutline";
export type StickerShadow = "none" | "stuck" | "lifted";

interface StickerVisualProps extends ScoutMotionPolicy {
  size?: StickerSize;
  tone?: StickerTone;
  material?: StickerMaterial;
  outline?: StickerOutline;
  shadow?: StickerShadow;
  rotation?: number;
  intensity?: ScoutIntensity;
  entrance?: "none" | "stick";
  style?: ScoutStyleProperties;
}

type StickerContentProps =
  | {
      source: StickerSource;
      children?: never;
      alt?: string;
    }
  | {
      source?: never;
      children: ReactNode;
      alt?: never;
    };

type StaticStickerProps = StickerVisualProps &
  StickerContentProps &
  Omit<HTMLAttributes<HTMLSpanElement>, "children" | "style"> & {
    interactive?: false;
  };

type InteractiveStickerProps = StickerVisualProps &
  StickerContentProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "style"> & {
    interactive: true;
  };

export type StickerProps = StaticStickerProps | InteractiveStickerProps;

const namedSizes = new Set(["xs", "sm", "md", "lg", "xl"]);

function resolveSize(size: StickerSize): {
  namedSize?: string;
  styleSize?: string;
} {
  if (typeof size === "string" && namedSizes.has(size)) {
    return { namedSize: size };
  }

  return {
    styleSize: typeof size === "number" ? `${String(size)}px` : size,
  };
}

export function Sticker(props: StickerProps) {
  const {
    alt,
    children,
    className,
    entrance = "none",
    interactive = false,
    intensity = "playful",
    material = "flat",
    outline,
    reducedMotion = "system",
    rotation = 0,
    shadow = "stuck",
    size = "md",
    source,
    style,
    tone = "paper",
    ...elementProps
  } = props;
  const resolvedOutline = outline ?? (source ? "none" : "cutline");
  const { namedSize, styleSize } = resolveSize(size);
  const componentStyle: ScoutStyleProperties = {
    ...style,
    "--sui-sticker-rotation": `${String(rotation)}deg`,
    ...(styleSize ? { "--sui-sticker-size": styleSize } : {}),
  };
  const content = source ? (
    <img
      alt={alt ?? ""}
      className="sui-sticker-image"
      draggable={false}
      height={source.height}
      src={source.src}
      width={source.width}
    />
  ) : (
    <span className="sui-sticker-content">{children}</span>
  );
  const sharedProps = {
    ...elementProps,
    className: joinClassNames(
      "sui-sticker",
      "sui-motion",
      interactive && "sui-focusable",
      source ? "sui-sticker-source" : "sui-sticker-content-wrapper",
      className,
    ),
    "data-entrance": entrance,
    "data-intensity": intensity,
    "data-material": material,
    "data-outline": resolvedOutline,
    "data-reduced-motion": reducedMotion,
    "data-shadow": shadow,
    "data-size": namedSize,
    "data-tone": tone,
    style: componentStyle,
  };

  if (interactive) {
    const buttonProps = sharedProps as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button {...buttonProps} type={buttonProps.type ?? "button"}>
        {content}
      </button>
    );
  }

  return <span {...sharedProps}>{content}</span>;
}
