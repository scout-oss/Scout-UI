import { describe, expect, it } from "vitest";

import { DeterministicFrameClock } from "../deterministic-frame-clock";
import { createLinearPointerPath } from "../stable-pointer-path";

describe("DeterministicFrameClock", () => {
  it("runs one queued generation per deterministic timestamp", () => {
    const clock = new DeterministicFrameClock(100);
    const timestamps: number[] = [];

    clock.requestFrame((timestamp) => {
      timestamps.push(timestamp);
      clock.requestFrame((nextTimestamp) => timestamps.push(nextTimestamp));
    });

    expect(clock.advance(20)).toBe(1);
    expect(timestamps).toEqual([120]);
    expect(clock.pendingCount).toBe(1);
    expect(clock.advance(20)).toBe(1);
    expect(timestamps).toEqual([120, 140]);
  });

  it("cancels frames and rejects unsafe durations", () => {
    const clock = new DeterministicFrameClock();
    const callback = clock.requestFrame(() => undefined);

    clock.cancelFrame(callback);
    expect(clock.pendingCount).toBe(0);
    expect(() => clock.advance(0)).toThrow(RangeError);
  });

  it("settles bounded work without component-specific logic", () => {
    const clock = new DeterministicFrameClock();
    let value = 0;

    const schedule = () => {
      clock.requestFrame(() => {
        value += 1;
        if (value < 3) schedule();
      });
    };
    schedule();

    expect(clock.settle({ isSettled: () => value === 3 })).toBe(3);
  });
});

describe("createLinearPointerPath", () => {
  it("creates stable inclusive pointer samples", () => {
    expect(
      createLinearPointerPath({ x: 0, y: 10 }, { x: 20, y: 30 }, 2),
    ).toEqual([
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: 30 },
    ]);
  });
});
