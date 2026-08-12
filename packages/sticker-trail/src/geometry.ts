import type { NumberRange } from "./types.js";

/** Weight given to the previous smoothed velocity sample. */
export const VELOCITY_WEIGHT_PREVIOUS = 0.35;
/** Weight given to the newest instantaneous velocity sample. */
export const VELOCITY_WEIGHT_INSTANT = 0.65;

/**
 * Hard per-frame spawn cap. A frame may never activate more slots than this,
 * regardless of how far the pointer travelled.
 */
export const MAX_SPAWNS_PER_FRAME = 6;

/**
 * A single frame that reports more travel than this is treated as a
 * discontinuity — a pointer teleport, a window jump, or a resumed tab.
 */
export const DISCONTINUITY_DISTANCE = 480;

/**
 * A frame gap longer than this means the loop was suspended (background tab,
 * debugger pause, long task). The segment restarts instead of backfilling.
 */
export const DISCONTINUITY_DURATION = 250;

export function clamp(value: number, min: number, max: number) {
  // NaN propagates through Math.min/Math.max, so it is the one case that needs
  // an explicit answer. Infinities clamp correctly on their own.
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function pointDistance(dx: number, dy: number) {
  return Math.hypot(dx, dy);
}

export function instantVelocity(distance: number, deltaTime: number) {
  return distance / Math.max(deltaTime, 1);
}

export function smoothVelocity(previous: number, instant: number) {
  return (
    previous * VELOCITY_WEIGHT_PREVIOUS + instant * VELOCITY_WEIGHT_INSTANT
  );
}

/**
 * Faster movement spaces stickers farther apart so a flick reads as a sparse
 * arc rather than a solid ribbon. The result never escapes the configured
 * spacing range.
 */
export function resolveSpacing(
  spacing: NumberRange,
  smoothedVelocity: number,
  velocityFactor: number,
) {
  return clamp(
    spacing.min + smoothedVelocity * velocityFactor,
    spacing.min,
    spacing.max,
  );
}

export function isDiscontinuity(distance: number, deltaTime: number) {
  return (
    !Number.isFinite(distance) ||
    !Number.isFinite(deltaTime) ||
    deltaTime < 0 ||
    distance > DISCONTINUITY_DISTANCE ||
    deltaTime > DISCONTINUITY_DURATION
  );
}

/**
 * Order a range and pull it inside the supplied safety bounds. Consumers may
 * pass a reversed or out-of-range pair; neither may reach the engine.
 */
export function normalizeRange(
  range: NumberRange,
  bounds: NumberRange,
): NumberRange {
  const first = clamp(range.min, bounds.min, bounds.max);
  const second = clamp(range.max, bounds.min, bounds.max);

  return first <= second
    ? { min: first, max: second }
    : { min: second, max: first };
}

export function valueInRange(range: NumberRange, unit: number) {
  return range.min + (range.max - range.min) * clamp(unit, 0, 1);
}

export interface SegmentPoint {
  x: number;
  y: number;
}

export interface SegmentPlanInput {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Distance already travelled since the previous spawn. */
  carried: number;
  spacing: number;
  maxSpawns: number;
}

export interface SegmentPlan {
  points: readonly SegmentPoint[];
  /** Distance to carry into the next segment. */
  carried: number;
  /** True when the spawn cap truncated the segment and the backlog was dropped. */
  capped: boolean;
}

/**
 * Interpolate spawn positions along one pointer segment.
 *
 * The spawn cap is a ceiling, not a queue: when it truncates a segment the
 * unspent distance is discarded rather than carried, so a long jump cannot
 * backfill nodes across subsequent frames.
 */
export function planSegmentSpawns({
  fromX,
  fromY,
  toX,
  toY,
  carried,
  spacing,
  maxSpawns,
}: SegmentPlanInput): SegmentPlan {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const travelled = pointDistance(dx, dy);

  if (travelled <= 0 || spacing <= 0 || maxSpawns <= 0) {
    return {
      capped: false,
      carried: carried + Math.max(travelled, 0),
      points: [],
    };
  }

  const points: SegmentPoint[] = [];
  let next = spacing - carried;

  while (next <= travelled && points.length < maxSpawns) {
    const progress = next / travelled;
    points.push({ x: fromX + dx * progress, y: fromY + dy * progress });
    next += spacing;
  }

  const capped = points.length === maxSpawns && next <= travelled;

  return {
    capped,
    carried: capped ? 0 : travelled - (next - spacing),
    points,
  };
}
