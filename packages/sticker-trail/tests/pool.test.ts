import { describe, expect, it } from "vitest";

import { DeterministicFrameClock } from "../../../tooling/test/deterministic-frame-clock";
import {
  ENTRANCE_FRACTION,
  EXIT_START,
  acquireSlotIndex,
  createSlotRecords,
  resetSlotRecord,
  slotDrift,
  slotOpacity,
  slotProgress,
  slotScale,
  type TrailSlotRecord,
} from "../src/pool";

function activate(record: TrailSlotRecord, birth: number, lifetime = 1000) {
  record.active = true;
  record.birth = birth;
  record.lifetime = lifetime;
  return record;
}

describe("pool allocation", () => {
  it("creates a fixed number of inactive records", () => {
    const records = createSlotRecords(5);
    expect(records).toHaveLength(5);
    expect(records.every((record) => !record.active)).toBe(true);
  });

  it("never creates a negative pool", () => {
    expect(createSlotRecords(-4)).toHaveLength(0);
  });

  it("prefers the first inactive slot", () => {
    const records = createSlotRecords(3);
    activate(records[0], 0);
    expect(acquireSlotIndex(records)).toBe(1);
  });

  it("recycles the oldest slot once the pool is full", () => {
    const records = createSlotRecords(3);
    activate(records[0], 300);
    activate(records[1], 100);
    activate(records[2], 200);

    expect(acquireSlotIndex(records)).toBe(1);
  });

  it("keeps the pool size constant under sustained recycling", () => {
    const records = createSlotRecords(4);

    for (let spawn = 0; spawn < 500; spawn += 1) {
      const index = acquireSlotIndex(records);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
      activate(records[index], spawn);
    }

    expect(records).toHaveLength(4);
    expect(records.filter((record) => record.active)).toHaveLength(4);
  });

  it("returns a released slot to the pool", () => {
    const records = createSlotRecords(2);
    activate(records[0], 10);
    activate(records[1], 20);
    resetSlotRecord(records[0]);

    expect(records[0].active).toBe(false);
    expect(records[0].sourceIndex).toBe(-1);
    expect(acquireSlotIndex(records)).toBe(0);
  });
});

describe("slot lifecycle", () => {
  it("reports progress across the configured lifetime", () => {
    const record = activate(createSlotRecords(1)[0], 1000, 500);
    expect(slotProgress(record, 1000)).toBe(0);
    expect(slotProgress(record, 1250)).toBe(0.5);
    expect(slotProgress(record, 1500)).toBe(1);
    // Progress is clamped so a late frame cannot produce a negative opacity.
    expect(slotProgress(record, 9999)).toBe(1);
  });

  it("treats a zero lifetime as immediately expired", () => {
    const record = activate(createSlotRecords(1)[0], 0, 0);
    expect(slotProgress(record, 0)).toBe(1);
  });

  it("expires every slot within its lifetime under a deterministic clock", () => {
    const clock = new DeterministicFrameClock();
    const records = createSlotRecords(3);
    for (const record of records) {
      activate(record, clock.now, 200);
    }

    clock.settle({
      isSettled: () =>
        records.every((record) => slotProgress(record, clock.now) >= 1),
      maxFrames: 60,
    });

    expect(clock.now).toBeGreaterThanOrEqual(200);
    expect(clock.now).toBeLessThan(400);
  });
});

describe("stick entrance and exit shaping", () => {
  const record = activate(createSlotRecords(1)[0], 0, 1000);
  record.scaleBase = 1;

  it("starts small, overshoots once, then settles at rest", () => {
    expect(slotScale(record, 0)).toBeCloseTo(0.78, 5);
    const peak = slotScale(record, ENTRANCE_FRACTION * 0.65);
    expect(peak).toBeCloseTo(1.04, 5);
    expect(slotScale(record, ENTRANCE_FRACTION)).toBeCloseTo(1, 5);
    expect(slotScale(record, 0.5)).toBe(1);
  });

  it("overshoots exactly once", () => {
    let crossings = 0;
    let previous = slotScale(record, 0);
    for (let step = 1; step <= 200; step += 1) {
      const current = slotScale(record, step / 200);
      if (previous <= 1 && current > 1) {
        crossings += 1;
      }
      previous = current;
    }

    expect(crossings).toBe(1);
  });

  it("scales the entrance by the seeded base scale", () => {
    const scaled = activate(createSlotRecords(1)[0], 0, 1000);
    scaled.scaleBase = 2;
    expect(slotScale(scaled, 0.5)).toBe(2);
    expect(slotScale(scaled, 0)).toBeCloseTo(1.56, 5);
  });

  it("collapses only for a shrink exit", () => {
    const shrink = activate(createSlotRecords(1)[0], 0, 1000);
    shrink.exit = "shrink";
    expect(slotScale(shrink, EXIT_START)).toBeCloseTo(1, 5);
    expect(slotScale(shrink, 1)).toBeCloseTo(0.4, 5);
    expect(slotScale(record, 1)).toBe(1);
  });
});

describe("opacity and drift", () => {
  it("ramps in, holds, then fades out", () => {
    expect(slotOpacity(0)).toBe(0);
    expect(slotOpacity(0.08)).toBe(1);
    expect(slotOpacity(0.4)).toBe(1);
    expect(slotOpacity(EXIT_START)).toBe(1);
    expect(slotOpacity(1)).toBe(0);
  });

  it("never leaves the unit interval", () => {
    for (let step = 0; step <= 100; step += 1) {
      const opacity = slotOpacity(step / 100);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
    }
  });

  it("drifts only for a float exit", () => {
    const float = activate(createSlotRecords(1)[0], 0, 1000);
    float.exit = "float";
    float.drift = 28;
    expect(slotDrift(float, 0)).toBe(0);
    expect(slotDrift(float, 0.5)).toBe(14);
    expect(slotDrift(float, 1)).toBe(28);

    const fade = activate(createSlotRecords(1)[0], 0, 1000);
    fade.drift = 28;
    expect(slotDrift(fade, 1)).toBe(0);
  });
});
