import type { StickerTrailSequence } from "./types.js";

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Seed used when a consumer supplies none, so unseeded output stays stable. */
export const DEFAULT_TRAIL_SEED = 0x5c007;

/**
 * Fold an arbitrary seed into a 32-bit integer. Strings hash through FNV-1a;
 * finite numbers pass through their integer part.
 */
export function hashSeed(seed: string | number | undefined): number {
  if (seed === undefined) {
    return DEFAULT_TRAIL_SEED;
  }

  if (typeof seed === "number") {
    return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : DEFAULT_TRAIL_SEED;
  }

  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

/**
 * mulberry32. Small, fast, and deterministic — the same seed always replays
 * the same visual sequence, which is what makes seeded screenshots stable.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export interface SourceSequencer {
  next(): number;
}

/**
 * Choose which sticker source spawns next.
 *
 * `ordered` cycles. `random` draws from the seeded stream but never repeats
 * the previous source while more than one exists, so a trail cannot degenerate
 * into a run of identical artwork.
 */
export function createSourceSequencer(
  count: number,
  sequence: StickerTrailSequence,
  random: () => number,
): SourceSequencer {
  let previous = -1;

  if (count <= 0) {
    return { next: () => -1 };
  }

  if (count === 1) {
    return { next: () => 0 };
  }

  if (sequence === "ordered") {
    return {
      next: () => {
        previous = (previous + 1) % count;
        return previous;
      },
    };
  }

  return {
    next: () => {
      if (previous < 0) {
        previous = Math.min(Math.floor(random() * count), count - 1);
        return previous;
      }

      // Draw from the count - 1 sources that are not the previous one, then
      // shift past it. Uniform, and structurally unable to repeat.
      let candidate = Math.min(Math.floor(random() * (count - 1)), count - 2);
      if (candidate >= previous) {
        candidate += 1;
      }

      previous = candidate;
      return candidate;
    },
  };
}
