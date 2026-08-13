/**
 * Pure maths for the cursor engine.
 *
 * Deliberately independent of `@scout-ui/sticker-trail`: sharing would mean
 * exporting Trail internals as public API, and the two engines only look
 * similar. A cursor follows one target with a settle phase; a trail spawns
 * bounded nodes along a path. Coupling them would constrain both.
 */

/** Reference frame duration used to normalise smoothing across frame rates. */
const REFERENCE_FRAME_MS = 1000 / 60;

/** Weight given to the previous smoothed velocity sample. */
export const VELOCITY_WEIGHT_PREVIOUS = 0.4;
/** Weight given to the newest instantaneous velocity sample. */
export const VELOCITY_WEIGHT_INSTANT = 0.6;

/** Design limit: the cursor tilts no further than this in either direction. */
export const MAX_TILT_DEGREES = 14;
/** Default tilt when the consumer supplies none. */
export const DEFAULT_TILT_DEGREES = 10;

/** Horizontal velocity, in px/ms, that produces the full tilt. */
const TILT_SATURATION_VELOCITY = 2.5;

export const DEFAULT_SMOOTHING = 0.35;
/** Above this, following becomes visibly laggy rather than smooth. */
export const MAX_SMOOTHING = 0.95;

export const DEFAULT_CURSOR_SIZE = 44;
export const MIN_CURSOR_SIZE = 16;
export const MAX_CURSOR_SIZE = 160;

/** Sub-pixel distance below which the cursor counts as arrived. */
export const POSITION_EPSILON = 0.05;
/** Sub-degree rotation below which the tilt counts as rested. */
export const TILT_EPSILON = 0.05;

/** Scale applied to the visual while the primary button is held. */
export const PRESS_SCALE = 0.92;
/** Duration of one press or release transition, in milliseconds. */
export const PRESS_DURATION_MS = 140;

/** Hard ceiling on echo nodes, per the engineering specification. */
export const MAX_ECHO_NODES = 4;
export const ECHO_LIFETIME_MS = 420;

export function clamp(value: number, min: number, max: number) {
  // NaN propagates through Math.min/Math.max, so it needs an explicit answer.
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function clampSize(size: number | undefined) {
  return size === undefined
    ? DEFAULT_CURSOR_SIZE
    : clamp(size, MIN_CURSOR_SIZE, MAX_CURSOR_SIZE);
}

export function clampTilt(tilt: number | undefined) {
  return tilt === undefined
    ? DEFAULT_TILT_DEGREES
    : clamp(Math.abs(tilt), 0, MAX_TILT_DEGREES);
}

export function clampSmoothing(smoothing: number | undefined) {
  return smoothing === undefined
    ? DEFAULT_SMOOTHING
    : clamp(smoothing, 0, MAX_SMOOTHING);
}

/**
 * Fraction of the remaining distance to cover this frame.
 *
 * `smoothing` is the fraction of the gap that survives one reference frame, so
 * 0 follows instantly and larger values trail further behind. Normalising by
 * the real frame duration keeps the feel identical on a 60Hz and a 144Hz
 * display instead of making the cursor faster on faster hardware.
 */
export function smoothingFactor(smoothing: number, deltaMs: number) {
  if (smoothing <= 0) {
    return 1;
  }

  const frames = clamp(deltaMs, 0, 100) / REFERENCE_FRAME_MS;
  return 1 - Math.pow(smoothing, frames);
}

export function approach(
  current: number,
  target: number,
  factor: number,
): number {
  return current + (target - current) * clamp(factor, 0, 1);
}

export function instantVelocity(delta: number, deltaMs: number) {
  return delta / Math.max(deltaMs, 1);
}

export function smoothVelocity(previous: number, instant: number) {
  return (
    previous * VELOCITY_WEIGHT_PREVIOUS + instant * VELOCITY_WEIGHT_INSTANT
  );
}

/**
 * Horizontal velocity becomes a bounded lean. The cursor should read as
 * physically dragged, never as spinning, so the result is clamped to the
 * consumer's limit which is itself clamped to the design maximum.
 */
export function tiltFromVelocity(
  smoothedVelocityX: number,
  maxTilt: number,
): number {
  const normalized = clamp(smoothedVelocityX / TILT_SATURATION_VELOCITY, -1, 1);

  return clamp(normalized * maxTilt, -maxTilt, maxTilt);
}

/** True once position and rotation have both converged and nothing is animating. */
export function hasSettled(
  positionDelta: number,
  tiltDelta: number,
  animating: boolean,
): boolean {
  return (
    !animating &&
    Math.abs(positionDelta) < POSITION_EPSILON &&
    Math.abs(tiltDelta) < TILT_EPSILON
  );
}

export interface Hotspot {
  x: number;
  y: number;
}

/** Centre of the visual: the safe default when no hotspot is declared. */
export const CENTRE_HOTSPOT: Hotspot = { x: 0.5, y: 0.5 };

/**
 * Hotspots are normalised fractions of the rendered visual box, not pixels.
 *
 * That is what keeps the apparent pointer position stable when a state change
 * swaps in artwork with different intrinsic dimensions, and when `size`
 * overrides the source dimensions entirely. A pixel hotspot would silently
 * drift under either. Invalid, missing, or out-of-range values collapse to a
 * safe in-bounds value rather than throwing the cursor off the pointer.
 */
export function normalizeHotspot(hotspot: Hotspot | undefined): Hotspot {
  if (hotspot === undefined) {
    return CENTRE_HOTSPOT;
  }

  return {
    x: clamp(hotspot.x, 0, 1),
    y: clamp(hotspot.y, 0, 1),
  };
}

/** Percentage translation that places the hotspot exactly under the pointer. */
export function hotspotOffsetPercent(hotspot: Hotspot): Hotspot {
  return { x: -hotspot.x * 100, y: -hotspot.y * 100 };
}
