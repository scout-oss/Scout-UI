import { describe, expect, it } from "vitest";

import {
  DISCONTINUITY_DISTANCE,
  DISCONTINUITY_DURATION,
  MAX_SPAWNS_PER_FRAME,
  VELOCITY_WEIGHT_INSTANT,
  VELOCITY_WEIGHT_PREVIOUS,
  clamp,
  instantVelocity,
  isDiscontinuity,
  normalizeRange,
  planSegmentSpawns,
  pointDistance,
  resolveSpacing,
  smoothVelocity,
  valueInRange,
} from "../src/geometry";

describe("distance and velocity", () => {
  it("measures euclidean travel", () => {
    expect(pointDistance(3, 4)).toBe(5);
    expect(pointDistance(0, 0)).toBe(0);
    expect(pointDistance(-3, -4)).toBe(5);
  });

  it("divides by the elapsed time with a one-millisecond floor", () => {
    expect(instantVelocity(30, 10)).toBe(3);
    // A zero or sub-millisecond frame must not produce an infinite velocity.
    expect(instantVelocity(30, 0)).toBe(30);
    expect(instantVelocity(30, 0.25)).toBe(30);
  });

  it("smooths with the documented 0.35/0.65 weighting", () => {
    expect(VELOCITY_WEIGHT_PREVIOUS + VELOCITY_WEIGHT_INSTANT).toBe(1);
    expect(smoothVelocity(2, 4)).toBeCloseTo(2 * 0.35 + 4 * 0.65, 10);
    expect(smoothVelocity(0, 0)).toBe(0);
  });

  it("converges toward a sustained velocity without overshooting it", () => {
    let velocity = 0;
    for (let sample = 0; sample < 40; sample += 1) {
      velocity = smoothVelocity(velocity, 5);
      expect(velocity).toBeLessThanOrEqual(5);
    }

    expect(velocity).toBeCloseTo(5, 6);
  });
});

describe("spacing", () => {
  const spacing = { min: 34, max: 58 };

  it("uses the minimum when the pointer is at rest", () => {
    expect(resolveSpacing(spacing, 0, 10)).toBe(34);
  });

  it("widens with velocity", () => {
    expect(resolveSpacing(spacing, 1, 10)).toBe(44);
  });

  it("never exceeds the configured maximum", () => {
    expect(resolveSpacing(spacing, 1000, 10)).toBe(58);
  });
});

describe("range handling", () => {
  it("orders a reversed range", () => {
    expect(normalizeRange({ min: 90, max: 20 }, { min: 0, max: 100 })).toEqual({
      min: 20,
      max: 90,
    });
  });

  it("pulls an out-of-range pair inside the safety bounds", () => {
    expect(
      normalizeRange({ min: -400, max: 4000 }, { min: 16, max: 256 }),
    ).toEqual({ min: 16, max: 256 });
  });

  it("replaces a non-finite bound with the safe minimum", () => {
    expect(clamp(Number.NaN, 4, 48)).toBe(4);
    expect(clamp(Number.POSITIVE_INFINITY, 4, 48)).toBe(48);
  });

  it("interpolates within a range and clamps the unit input", () => {
    const range = { min: 10, max: 20 };
    expect(valueInRange(range, 0)).toBe(10);
    expect(valueInRange(range, 0.5)).toBe(15);
    expect(valueInRange(range, 1)).toBe(20);
    expect(valueInRange(range, 4)).toBe(20);
    expect(valueInRange(range, -4)).toBe(10);
  });
});

describe("segment interpolation", () => {
  it("emits nothing until the accumulated distance reaches the spacing", () => {
    const plan = planSegmentSpawns({
      carried: 0,
      fromX: 0,
      fromY: 0,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 40,
      toX: 10,
      toY: 0,
    });

    expect(plan.points).toHaveLength(0);
    expect(plan.carried).toBe(10);
  });

  it("accumulates distance across frames", () => {
    const first = planSegmentSpawns({
      carried: 0,
      fromX: 0,
      fromY: 0,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 40,
      toX: 30,
      toY: 0,
    });
    expect(first.points).toHaveLength(0);
    expect(first.carried).toBe(30);

    const second = planSegmentSpawns({
      carried: first.carried,
      fromX: 30,
      fromY: 0,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 40,
      toX: 60,
      toY: 0,
    });

    expect(second.points).toEqual([{ x: 40, y: 0 }]);
    expect(second.carried).toBe(20);
  });

  it("interpolates evenly spaced points along a long segment", () => {
    const plan = planSegmentSpawns({
      carried: 0,
      fromX: 0,
      fromY: 0,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 10,
      toX: 0,
      toY: 25,
    });

    expect(plan.points).toEqual([
      { x: 0, y: 10 },
      { x: 0, y: 20 },
    ]);
    expect(plan.carried).toBe(5);
    expect(plan.capped).toBe(false);
  });

  it("interpolates diagonally in local coordinates", () => {
    const plan = planSegmentSpawns({
      carried: 0,
      fromX: 10,
      fromY: 10,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 5,
      toX: 16,
      toY: 18,
    });

    expect(plan.points).toEqual([
      { x: 13, y: 14 },
      { x: 16, y: 18 },
    ]);
  });

  it("caps spawns per frame and discards the backlog instead of queuing it", () => {
    const plan = planSegmentSpawns({
      carried: 0,
      fromX: 0,
      fromY: 0,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 5,
      toX: 400,
      toY: 0,
    });

    expect(plan.points).toHaveLength(MAX_SPAWNS_PER_FRAME);
    expect(plan.capped).toBe(true);
    // Dropping the remainder is what stops a truncated frame from backfilling
    // the same path across subsequent frames.
    expect(plan.carried).toBe(0);
  });

  it("returns the carried distance unchanged when the pointer does not move", () => {
    const plan = planSegmentSpawns({
      carried: 12,
      fromX: 5,
      fromY: 5,
      maxSpawns: MAX_SPAWNS_PER_FRAME,
      spacing: 20,
      toX: 5,
      toY: 5,
    });

    expect(plan.points).toHaveLength(0);
    expect(plan.carried).toBe(12);
  });

  it("never emits when the spawn budget is zero", () => {
    const plan = planSegmentSpawns({
      carried: 0,
      fromX: 0,
      fromY: 0,
      maxSpawns: 0,
      spacing: 5,
      toX: 100,
      toY: 0,
    });

    expect(plan.points).toHaveLength(0);
  });
});

describe("discontinuity detection", () => {
  it("accepts ordinary frame-to-frame movement", () => {
    expect(isDiscontinuity(24, 16)).toBe(false);
    expect(isDiscontinuity(0, 16)).toBe(false);
  });

  it("rejects a pointer teleport", () => {
    expect(isDiscontinuity(DISCONTINUITY_DISTANCE + 1, 16)).toBe(true);
  });

  it("rejects a suspended loop such as a background tab or debugger pause", () => {
    expect(isDiscontinuity(20, DISCONTINUITY_DURATION + 1)).toBe(true);
    expect(isDiscontinuity(20, 60_000)).toBe(true);
  });

  it("rejects a negative or non-finite delta", () => {
    expect(isDiscontinuity(20, -5)).toBe(true);
    expect(isDiscontinuity(Number.NaN, 16)).toBe(true);
    expect(isDiscontinuity(20, Number.POSITIVE_INFINITY)).toBe(true);
  });
});
