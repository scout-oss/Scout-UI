import { describe, expect, it } from "vitest";

import { DeterministicFrameClock } from "../../../tooling/test/deterministic-frame-clock";
import {
  CENTRE_HOTSPOT,
  DEFAULT_CURSOR_SIZE,
  DEFAULT_SMOOTHING,
  DEFAULT_TILT_DEGREES,
  MAX_CURSOR_SIZE,
  MAX_ECHO_NODES,
  MAX_SMOOTHING,
  MAX_TILT_DEGREES,
  MIN_CURSOR_SIZE,
  POSITION_EPSILON,
  TILT_EPSILON,
  approach,
  clamp,
  clampSize,
  clampSmoothing,
  clampTilt,
  hasSettled,
  hotspotOffsetPercent,
  instantVelocity,
  normalizeHotspot,
  smoothVelocity,
  smoothingFactor,
  tiltFromVelocity,
} from "../src/sticker-cursor/cursor-math";

describe("clamping consumer input", () => {
  it("supplies documented defaults", () => {
    expect(clampSize(undefined)).toBe(DEFAULT_CURSOR_SIZE);
    expect(clampTilt(undefined)).toBe(DEFAULT_TILT_DEGREES);
    expect(clampSmoothing(undefined)).toBe(DEFAULT_SMOOTHING);
  });

  it("holds size inside the safe range", () => {
    expect(clampSize(4)).toBe(MIN_CURSOR_SIZE);
    expect(clampSize(9000)).toBe(MAX_CURSOR_SIZE);
    expect(clampSize(48)).toBe(48);
    expect(clampSize(Number.NaN)).toBe(MIN_CURSOR_SIZE);
  });

  it("never lets tilt exceed the design maximum", () => {
    expect(MAX_TILT_DEGREES).toBe(14);
    expect(clampTilt(90)).toBe(MAX_TILT_DEGREES);
    // A negative limit is a magnitude, not a direction.
    expect(clampTilt(-90)).toBe(MAX_TILT_DEGREES);
    expect(clampTilt(0)).toBe(0);
    expect(clampTilt(6)).toBe(6);
  });

  it("keeps smoothing short of a frozen cursor", () => {
    expect(clampSmoothing(-1)).toBe(0);
    expect(clampSmoothing(1)).toBe(MAX_SMOOTHING);
    expect(clampSmoothing(5)).toBe(MAX_SMOOTHING);
    expect(clampSmoothing(0.5)).toBe(0.5);
  });

  it("answers explicitly for NaN rather than propagating it", () => {
    expect(clamp(Number.NaN, 2, 8)).toBe(2);
    expect(clamp(Number.POSITIVE_INFINITY, 2, 8)).toBe(8);
    expect(clamp(Number.NEGATIVE_INFINITY, 2, 8)).toBe(2);
  });
});

describe("smoothing", () => {
  it("follows instantly when smoothing is zero", () => {
    expect(smoothingFactor(0, 16)).toBe(1);
    expect(approach(0, 100, smoothingFactor(0, 16))).toBe(100);
  });

  it("covers more ground over a longer frame", () => {
    const short = smoothingFactor(0.5, 8);
    const long = smoothingFactor(0.5, 32);
    expect(long).toBeGreaterThan(short);
  });

  it("is frame-rate independent over equal elapsed time", () => {
    // Two 8ms frames must land where one 16ms frame lands.
    let split = 0;
    split = approach(split, 100, smoothingFactor(0.5, 8));
    split = approach(split, 100, smoothingFactor(0.5, 8));
    const single = approach(0, 100, smoothingFactor(0.5, 16));
    expect(split).toBeCloseTo(single, 8);
  });

  it("never overshoots, and settles at every smoothing level", () => {
    for (const smoothing of [0, 0.2, 0.5, MAX_SMOOTHING]) {
      let value = 0;
      for (let frame = 0; frame < 200; frame += 1) {
        value = approach(value, 100, smoothingFactor(smoothing, 16));
        expect(value).toBeLessThanOrEqual(100);
      }
      // Approach is asymptotic, so the contract is that it lands inside the
      // settle epsilon — the same threshold the engine stops scheduling on.
      expect(Math.abs(100 - value)).toBeLessThan(POSITION_EPSILON);
    }
  });

  it("clamps a pathological frame delta", () => {
    // A resumed background tab must not teleport by more than one frame's worth.
    expect(smoothingFactor(0.5, 60_000)).toBeLessThanOrEqual(1);
    expect(smoothingFactor(0.5, 60_000)).toBe(smoothingFactor(0.5, 100));
  });
});

describe("velocity and tilt", () => {
  it("divides by elapsed time with a one-millisecond floor", () => {
    expect(instantVelocity(30, 10)).toBe(3);
    expect(instantVelocity(30, 0)).toBe(30);
  });

  it("smooths toward a sustained velocity without overshooting", () => {
    let velocity = 0;
    for (let sample = 0; sample < 60; sample += 1) {
      velocity = smoothVelocity(velocity, 4);
      expect(velocity).toBeLessThanOrEqual(4);
    }
    expect(velocity).toBeCloseTo(4, 6);
  });

  it("leans with direction and saturates at the limit", () => {
    expect(tiltFromVelocity(0, 10)).toBe(0);
    expect(tiltFromVelocity(5, 10)).toBe(10);
    expect(tiltFromVelocity(-5, 10)).toBe(-10);
    expect(Math.abs(tiltFromVelocity(1000, 14))).toBeLessThanOrEqual(
      MAX_TILT_DEGREES,
    );
  });

  it("never exceeds the consumer limit at any velocity", () => {
    for (let velocity = -50; velocity <= 50; velocity += 0.5) {
      expect(Math.abs(tiltFromVelocity(velocity, 6))).toBeLessThanOrEqual(6);
    }
  });

  it("produces a proportional lean below saturation", () => {
    const half = tiltFromVelocity(1.25, 10);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(10);
  });
});

describe("settle", () => {
  it("rests only when position and tilt have both converged", () => {
    expect(hasSettled(0, 0, false)).toBe(true);
    expect(hasSettled(POSITION_EPSILON / 2, TILT_EPSILON / 2, false)).toBe(
      true,
    );
    expect(hasSettled(5, 0, false)).toBe(false);
    expect(hasSettled(0, 5, false)).toBe(false);
  });

  it("never rests while something is animating", () => {
    expect(hasSettled(0, 0, true)).toBe(false);
  });

  it("converges within a bounded number of frames", () => {
    const clock = new DeterministicFrameClock();
    let rendered = 0;
    const target = 500;

    const frames = clock.settle({
      isSettled: () => {
        rendered = approach(rendered, target, smoothingFactor(0.35, 16));
        return hasSettled(target - rendered, 0, false);
      },
      maxFrames: 120,
    });

    expect(frames).toBeLessThan(120);
    expect(rendered).toBeCloseTo(target, 1);
  });
});

describe("hotspot", () => {
  it("defaults to the centre of the visual", () => {
    expect(normalizeHotspot(undefined)).toEqual(CENTRE_HOTSPOT);
    expect(CENTRE_HOTSPOT).toEqual({ x: 0.5, y: 0.5 });
  });

  it("keeps declared values inside the visual", () => {
    expect(normalizeHotspot({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
    expect(normalizeHotspot({ x: 0.25, y: 0.75 })).toEqual({
      x: 0.25,
      y: 0.75,
    });
  });

  it("refuses to push the cursor away on invalid input", () => {
    // Negative, oversized, and non-finite values would otherwise fling the
    // artwork far from the pointer.
    expect(normalizeHotspot({ x: -40, y: -40 })).toEqual({ x: 0, y: 0 });
    expect(normalizeHotspot({ x: 900, y: 900 })).toEqual({ x: 1, y: 1 });
    expect(normalizeHotspot({ x: Number.NaN, y: Number.NaN })).toEqual({
      x: 0,
      y: 0,
    });
    expect(
      normalizeHotspot({
        x: Number.POSITIVE_INFINITY,
        y: Number.NEGATIVE_INFINITY,
      }),
    ).toEqual({ x: 1, y: 0 });
  });

  it("translates by a percentage of the visual, not by pixels", () => {
    // Percentages are what make the hotspot survive a size change or artwork
    // with different intrinsic dimensions.
    expect(hotspotOffsetPercent({ x: 0.5, y: 0.5 })).toEqual({
      x: -50,
      y: -50,
    });
    expect(hotspotOffsetPercent({ x: 0, y: 0 })).toEqual({ x: -0, y: -0 });
    expect(hotspotOffsetPercent({ x: 1, y: 1 })).toEqual({ x: -100, y: -100 });
  });

  it("keeps the pointer under the same artwork point across states", () => {
    // Two states with different declared hotspots must each place their own
    // anchor at the pointer, which is exactly what the offset expresses.
    const tip = hotspotOffsetPercent(normalizeHotspot({ x: 0.1, y: 0.1 }));
    const centre = hotspotOffsetPercent(normalizeHotspot(undefined));
    expect(tip).not.toEqual(centre);
    expect(tip.x).toBeCloseTo(-10, 6);
    expect(centre.x).toBeCloseTo(-50, 6);
  });
});

describe("echo bounds", () => {
  it("caps the pool at the specified maximum", () => {
    expect(MAX_ECHO_NODES).toBe(4);
  });
});
