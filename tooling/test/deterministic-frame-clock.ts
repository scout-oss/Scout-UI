export type TestFrameCallback = (timestamp: number) => void;

export interface SettleOptions {
  isSettled: () => boolean;
  maxFrames?: number;
  stepMs?: number;
}

export class DeterministicFrameClock {
  readonly #callbacks = new Map<number, TestFrameCallback>();
  #nextId = 1;
  #now: number;

  constructor(initialTime = 0) {
    this.#now = initialTime;
  }

  get now() {
    return this.#now;
  }

  get pendingCount() {
    return this.#callbacks.size;
  }

  requestFrame(callback: TestFrameCallback) {
    const id = this.#nextId;
    this.#nextId += 1;
    this.#callbacks.set(id, callback);
    return id;
  }

  cancelFrame(id: number) {
    this.#callbacks.delete(id);
  }

  advance(stepMs = 1000 / 60) {
    if (!Number.isFinite(stepMs) || stepMs <= 0) {
      throw new RangeError("Frame duration must be a positive finite number");
    }

    this.#now += stepMs;
    const callbacks = [...this.#callbacks.values()];
    this.#callbacks.clear();

    for (const callback of callbacks) {
      callback(this.#now);
    }

    return callbacks.length;
  }

  settle({ isSettled, maxFrames = 120, stepMs = 1000 / 60 }: SettleOptions) {
    for (let frame = 0; frame < maxFrames; frame += 1) {
      if (isSettled()) {
        return frame;
      }
      this.advance(stepMs);
    }

    if (isSettled()) {
      return maxFrames;
    }

    throw new Error(
      `Animation did not settle within ${String(maxFrames)} frames`,
    );
  }
}
