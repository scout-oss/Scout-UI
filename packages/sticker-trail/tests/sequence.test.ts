import { describe, expect, it } from "vitest";

import {
  DEFAULT_TRAIL_SEED,
  createRandom,
  createSourceSequencer,
  hashSeed,
} from "../src/sequence";

function draw(count: number, sequence: "ordered" | "random", seed: number) {
  const sequencer = createSourceSequencer(count, sequence, createRandom(seed));
  return Array.from({ length: 40 }, () => sequencer.next());
}

describe("seed generation", () => {
  it("falls back to a stable default when no seed is supplied", () => {
    expect(hashSeed(undefined)).toBe(DEFAULT_TRAIL_SEED);
  });

  it("passes finite numbers through as unsigned integers", () => {
    expect(hashSeed(7)).toBe(7);
    expect(hashSeed(7.9)).toBe(7);
    expect(hashSeed(Number.NaN)).toBe(DEFAULT_TRAIL_SEED);
  });

  it("hashes strings deterministically and distinguishes them", () => {
    expect(hashSeed("scout")).toBe(hashSeed("scout"));
    expect(hashSeed("scout")).not.toBe(hashSeed("scou"));
    expect(hashSeed("scout")).not.toBe(hashSeed("tuocs"));
  });

  it("produces a 32-bit unsigned value", () => {
    for (const seed of ["a", "scout-ui", "", "a longer seed value"]) {
      const hash = hashSeed(seed);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("seeded random", () => {
  it("replays the identical stream for the same seed", () => {
    const first = Array.from({ length: 20 }, createRandom(1234));
    const second = Array.from({ length: 20 }, createRandom(1234));
    expect(first).toEqual(second);
  });

  it("diverges for a different seed", () => {
    const first = Array.from({ length: 20 }, createRandom(1234));
    const second = Array.from({ length: 20 }, createRandom(1235));
    expect(first).not.toEqual(second);
  });

  it("stays inside the unit interval", () => {
    const random = createRandom(99);
    for (let draw = 0; draw < 500; draw += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("ordered selection", () => {
  it("cycles through every source in order", () => {
    expect(draw(4, "ordered", 1).slice(0, 9)).toEqual([
      0, 1, 2, 3, 0, 1, 2, 3, 0,
    ]);
  });

  it("is unaffected by the seed", () => {
    expect(draw(3, "ordered", 1)).toEqual(draw(3, "ordered", 987654));
  });
});

describe("random selection", () => {
  it("is deterministic for a given seed", () => {
    expect(draw(5, "random", 42)).toEqual(draw(5, "random", 42));
  });

  it("differs between seeds", () => {
    expect(draw(5, "random", 42)).not.toEqual(draw(5, "random", 43));
  });

  it("never repeats the previous source when several exist", () => {
    for (const count of [2, 3, 5, 8]) {
      for (const seed of [1, 2, 3, 17, 4096]) {
        const picks = draw(count, "random", seed);
        for (let index = 1; index < picks.length; index += 1) {
          expect(picks[index]).not.toBe(picks[index - 1]);
        }
      }
    }
  });

  it("keeps every pick inside the source range", () => {
    const picks = draw(6, "random", 7);
    for (const pick of picks) {
      expect(pick).toBeGreaterThanOrEqual(0);
      expect(pick).toBeLessThan(6);
    }
  });

  it("eventually reaches every source", () => {
    expect(new Set(draw(4, "random", 5))).toEqual(new Set([0, 1, 2, 3]));
  });

  it("repeats the only source when exactly one exists", () => {
    expect(new Set(draw(1, "random", 5))).toEqual(new Set([0]));
  });

  it("reports no source when the pack is empty", () => {
    expect(new Set(draw(0, "random", 5))).toEqual(new Set([-1]));
  });
});
