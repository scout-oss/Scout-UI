export type StackAxis = "x" | "y";
export type StackDirection = "next" | "previous";
export type StackGestureIntent = "pending" | "stack" | "scroll";

export interface StackPoint {
  x: number;
  y: number;
}

export interface StackGeometry {
  depth: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  zIndex: number;
}

export interface StackDragMeasurement {
  offset: number;
  progress: number;
  velocity: number;
}

const INTENT_DISTANCE = 8;
const INTENT_RATIO = 1.15;
const SWIPE_PROGRESS = 0.34;
const SWIPE_VELOCITY = 0.55;
const MIN_FLICK_PROGRESS = 0.08;

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeStackIndex(index: number | undefined, count: number) {
  if (count <= 0) return 0;
  const safeIndex = Math.trunc(finite(index ?? 0));
  return Math.min(count - 1, Math.max(0, safeIndex));
}

export function targetStackIndex(
  index: number,
  count: number,
  direction: StackDirection,
  loop: boolean,
) {
  if (count <= 1) return normalizeStackIndex(index, count);
  const current = normalizeStackIndex(index, count);
  if (direction === "next") {
    if (current < count - 1) return current + 1;
    return loop ? 0 : current;
  }
  if (current > 0) return current - 1;
  return loop ? count - 1 : current;
}

export function visibleStackIndexes(
  activeIndex: number,
  count: number,
  visibleCount: 2 | 3 | 4 | 5,
  loop: boolean,
) {
  if (count <= 0) return [];
  const active = normalizeStackIndex(activeIndex, count);
  const limit = Math.min(visibleCount, count);
  const indexes = [active];

  if (loop) {
    for (let depth = 1; depth < limit; depth += 1) {
      indexes.push((active + depth) % count);
    }
    return indexes;
  }

  for (
    let index = active + 1;
    index < count && indexes.length < limit;
    index += 1
  ) {
    indexes.push(index);
  }
  for (
    let index = active - 1;
    index >= 0 && indexes.length < limit;
    index -= 1
  ) {
    indexes.push(index);
  }
  return indexes;
}

export function stableKeyHash(key: string | number | bigint): number {
  const value = String(key);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stackGeometry(
  key: string | number | bigint,
  depth: number,
  axis: StackAxis,
): StackGeometry {
  const safeDepth = Math.max(0, Math.trunc(finite(depth)));
  if (safeDepth === 0) {
    return { depth: 0, offsetX: 0, offsetY: 0, rotation: 0, zIndex: 10 };
  }
  const hash = stableKeyHash(key);
  const direction = hash % 2 === 0 ? 1 : -1;
  const jitter = ((hash >>> 3) % 5) * 0.18;
  const rotation = direction * Math.min(4.8, 0.8 + safeDepth * 0.72 + jitter);
  const primary = Math.min(18, 7 + safeDepth * 3);
  const secondary = Math.min(18, 8 + safeDepth * 3.5);
  return {
    depth: safeDepth,
    offsetX:
      axis === "x" ? primary : direction * Math.min(10, 3 + safeDepth * 1.5),
    offsetY: axis === "y" ? primary : secondary,
    rotation,
    zIndex: 10 - safeDepth,
  };
}

export function resolveStackIntent(
  axis: StackAxis,
  start: StackPoint,
  current: StackPoint,
): StackGestureIntent {
  const deltaX = finite(current.x - start.x);
  const deltaY = finite(current.y - start.y);
  const primary = Math.abs(axis === "x" ? deltaX : deltaY);
  const perpendicular = Math.abs(axis === "x" ? deltaY : deltaX);
  if (Math.hypot(deltaX, deltaY) < INTENT_DISTANCE) return "pending";
  if (primary > perpendicular * INTENT_RATIO) return "stack";
  if (perpendicular > primary * INTENT_RATIO) return "scroll";
  return "pending";
}

export function measureStackDrag(options: {
  axis: StackAxis;
  current: StackPoint;
  extent: number;
  lastOffset: number;
  lastTime: number;
  start: StackPoint;
  time: number;
}): StackDragMeasurement {
  const rawOffset =
    options.axis === "x"
      ? options.current.x - options.start.x
      : options.current.y - options.start.y;
  const extent = Math.max(1, finite(options.extent, 1));
  const offset = Math.max(
    -extent * 1.1,
    Math.min(extent * 1.1, finite(rawOffset)),
  );
  const elapsed = Math.max(1, finite(options.time - options.lastTime, 1));
  const velocity = Math.max(
    -2,
    Math.min(2, finite((offset - options.lastOffset) / elapsed)),
  );
  return {
    offset,
    progress: Math.min(1, Math.abs(offset) / extent),
    velocity,
  };
}

export function resolveStackSwipe(
  measurement: StackDragMeasurement,
): StackDirection | null {
  const committedByDistance = measurement.progress >= SWIPE_PROGRESS;
  const committedByVelocity =
    measurement.progress >= MIN_FLICK_PROGRESS &&
    Math.abs(measurement.velocity) >= SWIPE_VELOCITY;
  if (!committedByDistance && !committedByVelocity) return null;
  return measurement.offset < 0 ? "next" : "previous";
}
