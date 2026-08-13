export type StickerPeelOrigin =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface PeelPoint {
  x: number;
  y: number;
}

export type PeelIntent = "pending" | "peel" | "scroll";

const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_PEEL_SIZE = "3rem";
const INTENT_DISTANCE = 7;
const VELOCITY_COMMIT = 0.45;

export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function normalizeDragThreshold(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_THRESHOLD;
  return Math.min(0.9, Math.max(0.1, value));
}

export function normalizePeelSize(value: number | string | undefined): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return DEFAULT_PEEL_SIZE;
    return `${String(Math.min(320, Math.max(36, value)))}px`;
  }
  if (typeof value !== "string") return DEFAULT_PEEL_SIZE;

  const candidate = value.trim();
  if (
    /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%|vw|vh|vmin|vmax|ch)$/u.test(
      candidate,
    ) ||
    /^(?:calc|min|max|clamp|var)\([^;{}]+\)$/u.test(candidate)
  ) {
    return candidate;
  }
  return DEFAULT_PEEL_SIZE;
}

export function originVector(origin: StickerPeelOrigin): PeelPoint {
  switch (origin) {
    case "top-left":
      return { x: 1, y: 1 };
    case "top-right":
      return { x: -1, y: 1 };
    case "bottom-left":
      return { x: 1, y: -1 };
    case "bottom-right":
      return { x: -1, y: -1 };
  }
}

function projectMovement(
  origin: StickerPeelOrigin,
  start: PeelPoint,
  current: PeelPoint,
) {
  const vector = originVector(origin);
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const along = (dx * vector.x + dy * vector.y) / Math.SQRT2;
  const across = (dx * -vector.y + dy * vector.x) / Math.SQRT2;
  return { along, across, distance: Math.hypot(dx, dy) };
}

export function resolvePeelIntent(
  origin: StickerPeelOrigin,
  start: PeelPoint,
  current: PeelPoint,
  initiallyOpen: boolean,
): PeelIntent {
  const movement = projectMovement(origin, start, current);
  if (movement.distance < INTENT_DISTANCE) return "pending";

  const intendedAlong = movement.along * (initiallyOpen ? -1 : 1);
  if (
    intendedAlong > 0 &&
    Math.abs(movement.along) >= Math.abs(movement.across) * 1.15
  ) {
    return "peel";
  }
  if (Math.abs(movement.across) > Math.abs(movement.along)) return "scroll";
  return "pending";
}

export function progressFromMovement(options: {
  baseProgress: number;
  current: PeelPoint;
  height: number;
  origin: StickerPeelOrigin;
  start: PeelPoint;
  width: number;
}): number {
  const movement = projectMovement(
    options.origin,
    options.start,
    options.current,
  );
  const travel = Math.max(1, Math.hypot(options.width, options.height) * 0.62);
  return clampProgress(options.baseProgress + movement.along / travel);
}

export function normalizeVelocity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(2, Math.max(-2, value));
}

export function shouldCommitOpen(options: {
  progress: number;
  threshold: number;
  velocity: number;
}): boolean {
  const progress = clampProgress(options.progress);
  const threshold = normalizeDragThreshold(options.threshold);
  const velocity = normalizeVelocity(options.velocity);
  if (velocity >= VELOCITY_COMMIT && progress >= 0.18) return true;
  if (velocity <= -VELOCITY_COMMIT && progress <= 0.82) return false;
  return progress >= threshold;
}
