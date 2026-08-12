/**
 * Decision B accepts one duplicated declaration of the generic structural
 * types so that `@scout-ui/sticker-trail` never has to depend on
 * `@scout-ui/react`. These assertions are the guard rail that makes the
 * duplication safe: if either copy drifts — a renamed field, a changed
 * optionality, a widened union — this file stops compiling.
 */
import type {
  NumberRange as TrailNumberRange,
  ScoutMotionPolicy as TrailScoutMotionPolicy,
  StickerSource as TrailStickerSource,
} from "@scout-ui/sticker-trail";

import type {
  NumberRange,
  ScoutMotionPolicy,
  StickerSource,
} from "../src/shared-types.js";

/** Structural identity, strict enough to catch optionality and readonly drift. */
type Identical<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type Assert<T extends true> = T;

export type StickerSourceIsIdentical = Assert<
  Identical<StickerSource, TrailStickerSource>
>;
export type NumberRangeIsIdentical = Assert<
  Identical<NumberRange, TrailNumberRange>
>;
export type ScoutMotionPolicyIsIdentical = Assert<
  Identical<ScoutMotionPolicy, TrailScoutMotionPolicy>
>;

// Mutual assignability in both directions, proven with real values rather than
// only with type-level operators.
const broadSource: StickerSource = { id: "star", src: "/star.svg", width: 64 };
const trailSource: TrailStickerSource = broadSource;
export const broadFromTrail: StickerSource = trailSource;

const broadRange: NumberRange = { min: 1, max: 2 };
const trailRange: TrailNumberRange = broadRange;
export const broadRangeFromTrail: NumberRange = trailRange;

const broadPolicy: ScoutMotionPolicy = { reducedMotion: "always" };
const trailPolicy: TrailScoutMotionPolicy = broadPolicy;
export const broadPolicyFromTrail: ScoutMotionPolicy = trailPolicy;

// An official sticker definition is structurally a source in both packages,
// which is what lets either accept the pack without depending on it.
const officialDefinition = {
  id: "wonky-star",
  src: "/wonky-star.svg",
  width: 160,
  height: 160,
  category: "signal",
} as const;

export const definitionAsBroadSource: StickerSource = officialDefinition;
export const definitionAsTrailSource: TrailStickerSource = officialDefinition;

// @ts-expect-error a source without `src` is not structurally compatible.
export const missingSrc: TrailStickerSource = { id: "star" };
// @ts-expect-error a range must carry both bounds.
export const partialRange: TrailNumberRange = { min: 1 };
// @ts-expect-error the reduced-motion union is closed in both packages.
export const unknownPolicy: TrailScoutMotionPolicy = { reducedMotion: "never" };
