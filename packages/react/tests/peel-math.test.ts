import { describe, expect, it } from "vitest";

import {
  clampProgress,
  normalizeDragThreshold,
  normalizePeelSize,
  normalizeVelocity,
  originVector,
  progressFromMovement,
  resolvePeelIntent,
  shouldCommitOpen,
} from "../src/sticker-peel/peel-math";

describe("StickerPeel geometry", () => {
  it("maps all four origins toward the opposite corner", () => {
    expect(originVector("top-left")).toEqual({ x: 1, y: 1 });
    expect(originVector("top-right")).toEqual({ x: -1, y: 1 });
    expect(originVector("bottom-left")).toEqual({ x: 1, y: -1 });
    expect(originVector("bottom-right")).toEqual({ x: -1, y: -1 });
  });

  it.each([
    ["top-left", { x: 100, y: 100 }],
    ["top-right", { x: -100, y: 100 }],
    ["bottom-left", { x: 100, y: -100 }],
    ["bottom-right", { x: -100, y: -100 }],
  ] as const)("computes opening progress from %s", (origin, current) => {
    expect(
      progressFromMovement({
        baseProgress: 0,
        current,
        height: 160,
        origin,
        start: { x: 0, y: 0 },
        width: 240,
      }),
    ).toBeGreaterThan(0.7);
  });

  it("clamps negative movement, overdrag, NaN, and Infinity", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(2)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("distinguishes directional peel intent from page-scroll intent", () => {
    expect(
      resolvePeelIntent("top-left", { x: 0, y: 0 }, { x: 3, y: 3 }, false),
    ).toBe("pending");
    expect(
      resolvePeelIntent("top-left", { x: 0, y: 0 }, { x: 40, y: 35 }, false),
    ).toBe("peel");
    expect(
      resolvePeelIntent("top-left", { x: 0, y: 0 }, { x: -35, y: 35 }, false),
    ).toBe("scroll");
    expect(
      resolvePeelIntent("top-left", { x: 40, y: 40 }, { x: 5, y: 5 }, true),
    ).toBe("peel");
  });
});

describe("StickerPeel normalization and commit", () => {
  it("normalizes thresholds and unsafe size inputs", () => {
    expect(normalizeDragThreshold(undefined)).toBe(0.5);
    expect(normalizeDragThreshold(-2)).toBe(0.1);
    expect(normalizeDragThreshold(4)).toBe(0.9);
    expect(normalizeDragThreshold(Number.NaN)).toBe(0.5);
    expect(normalizePeelSize(12)).toBe("36px");
    expect(normalizePeelSize(900)).toBe("320px");
    expect(normalizePeelSize("4.5rem")).toBe("4.5rem");
    expect(normalizePeelSize("clamp(2rem, 8vw, 5rem)")).toBe(
      "clamp(2rem, 8vw, 5rem)",
    );
    expect(normalizePeelSize("1px; color: red")).toBe("3rem");
    expect(normalizePeelSize(Number.NaN)).toBe("3rem");
  });

  it("uses threshold with bounded velocity as a secondary signal", () => {
    expect(
      shouldCommitOpen({ progress: 0.7, threshold: 0.5, velocity: 0 }),
    ).toBe(true);
    expect(
      shouldCommitOpen({ progress: 0.3, threshold: 0.5, velocity: 0 }),
    ).toBe(false);
    expect(
      shouldCommitOpen({ progress: 0.35, threshold: 0.5, velocity: 0.8 }),
    ).toBe(true);
    expect(
      shouldCommitOpen({ progress: 0.7, threshold: 0.5, velocity: -0.8 }),
    ).toBe(false);
    expect(
      shouldCommitOpen({ progress: 0.05, threshold: 0.5, velocity: 2 }),
    ).toBe(false);
    expect(normalizeVelocity(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeVelocity(8)).toBe(2);
  });
});
