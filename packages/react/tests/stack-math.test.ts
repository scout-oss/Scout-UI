import { describe, expect, it } from "vitest";

import {
  measureStackDrag,
  normalizeStackIndex,
  resolveStackIntent,
  resolveStackSwipe,
  stableKeyHash,
  stackGeometry,
  targetStackIndex,
  visibleStackIndexes,
} from "../src/sticker-stack/stack-math";

describe("StickerStack index and window helpers", () => {
  it("normalizes empty, fractional, non-finite, negative, and oversized indexes", () => {
    expect(normalizeStackIndex(4, 0)).toBe(0);
    expect(normalizeStackIndex(2.9, 5)).toBe(2);
    expect(normalizeStackIndex(Number.NaN, 5)).toBe(0);
    expect(normalizeStackIndex(-4, 5)).toBe(0);
    expect(normalizeStackIndex(99, 5)).toBe(4);
  });

  it("resolves finite and looping boundaries without false movement", () => {
    expect(targetStackIndex(0, 4, "previous", false)).toBe(0);
    expect(targetStackIndex(3, 4, "next", false)).toBe(3);
    expect(targetStackIndex(0, 4, "previous", true)).toBe(3);
    expect(targetStackIndex(3, 4, "next", true)).toBe(0);
    expect(targetStackIndex(0, 1, "next", true)).toBe(0);
  });

  it.each([2, 3, 4, 5] as const)(
    "renders only the requested %s-layer window",
    (visibleCount) => {
      expect(visibleStackIndexes(2, 100, visibleCount, false)).toHaveLength(
        visibleCount,
      );
      expect(visibleStackIndexes(99, 100, visibleCount, false)).toEqual(
        Array.from({ length: visibleCount }, (_, depth) => 99 - depth),
      );
      expect(visibleStackIndexes(99, 100, visibleCount, true)).toEqual(
        Array.from({ length: visibleCount }, (_, depth) => (99 + depth) % 100),
      );
    },
  );

  it("never duplicates a one-item stack", () => {
    expect(visibleStackIndexes(0, 1, 5, true)).toEqual([0]);
  });
});

describe("StickerStack deterministic geometry", () => {
  it("produces identical bounded geometry for identical inputs", () => {
    const first = stackGeometry("stable-card", 4, "x");
    const second = stackGeometry("stable-card", 4, "x");
    expect(first).toEqual(second);
    expect(Math.abs(first.rotation)).toBeLessThanOrEqual(4.8);
    expect(first.offsetX).toBeLessThanOrEqual(18);
    expect(first.offsetY).toBeLessThanOrEqual(18);
    expect(stableKeyHash("stable-card")).toBe(stableKeyHash("stable-card"));
  });

  it("keeps the active card level and varies axes deterministically", () => {
    expect(stackGeometry("active", 0, "x")).toEqual({
      depth: 0,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      zIndex: 10,
    });
    expect(stackGeometry("card", 2, "x")).not.toEqual(
      stackGeometry("card", 2, "y"),
    );
  });
});

describe("StickerStack drag math", () => {
  it("waits for directional intent and yields perpendicular movement to scroll", () => {
    const start = { x: 0, y: 0 };
    expect(resolveStackIntent("x", start, { x: 4, y: 2 })).toBe("pending");
    expect(resolveStackIntent("x", start, { x: 30, y: 6 })).toBe("stack");
    expect(resolveStackIntent("x", start, { x: 5, y: 35 })).toBe("scroll");
    expect(resolveStackIntent("y", start, { x: 6, y: -30 })).toBe("stack");
    expect(resolveStackIntent("y", start, { x: 35, y: 5 })).toBe("scroll");
  });

  it("maps left/up to next, right/down to previous, and small movement to snap-back", () => {
    const base = {
      axis: "x" as const,
      extent: 300,
      lastOffset: 0,
      lastTime: 0,
      start: { x: 0, y: 0 },
      time: 300,
    };
    expect(
      resolveStackSwipe(
        measureStackDrag({ ...base, current: { x: -150, y: 0 } }),
      ),
    ).toBe("next");
    expect(
      resolveStackSwipe(
        measureStackDrag({ ...base, current: { x: 150, y: 0 } }),
      ),
    ).toBe("previous");
    expect(
      resolveStackSwipe(
        measureStackDrag({ ...base, current: { x: 10, y: 0 } }),
      ),
    ).toBeNull();
    expect(
      resolveStackSwipe(
        measureStackDrag({
          ...base,
          axis: "y",
          current: { x: 0, y: -160 },
        }),
      ),
    ).toBe("next");
  });

  it("clamps pathological values", () => {
    expect(
      measureStackDrag({
        axis: "x",
        current: { x: Number.POSITIVE_INFINITY, y: 0 },
        extent: Number.NaN,
        lastOffset: Number.NaN,
        lastTime: Number.NaN,
        start: { x: 0, y: 0 },
        time: Number.NaN,
      }),
    ).toEqual({ offset: 0, progress: 0, velocity: 0 });
  });
});
