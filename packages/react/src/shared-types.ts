import type { CSSProperties } from "react";

export type ScoutIntensity = "calm" | "playful" | "loud";

export type StickerTone =
  | "paper"
  | "ink"
  | "ultraviolet"
  | "acid"
  | "cyan"
  | "pink"
  | "cobalt"
  | "orange";

export interface StickerSource {
  id: string;
  src: string;
  width?: number;
  height?: number;
}

export interface ScoutMotionPolicy {
  reducedMotion?: "system" | "always";
}

export type ScoutStyleProperties = CSSProperties & {
  [property: `--sui-${string}`]: string | number | undefined;
};

export function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}
