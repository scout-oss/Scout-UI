export interface TestPoint {
  x: number;
  y: number;
}

export function createLinearPointerPath(
  start: TestPoint,
  end: TestPoint,
  segments: number,
) {
  if (!Number.isInteger(segments) || segments < 1) {
    throw new RangeError("Pointer path segments must be a positive integer");
  }

  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments;
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    } satisfies TestPoint;
  });
}
