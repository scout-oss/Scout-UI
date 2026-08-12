import { clamp } from "./geometry.js";
import type { StickerTrailExit } from "./types.js";

/** Fraction of a slot's life spent on the stick entrance. */
export const ENTRANCE_FRACTION = 0.18;
/** Progress at which the exit treatment begins. */
export const EXIT_START = 0.7;
/** Progress at which a freshly activated slot reaches full opacity. */
const OPACITY_RAMP = 0.08;
/** Point within the entrance where the overshoot peaks. */
const OVERSHOOT_PEAK = 0.65;
/** Scale a `shrink` exit collapses toward. */
const SHRINK_TARGET = 0.4;

/**
 * Engine-side record for one pool slot. Deliberately a flat mutable object:
 * these are written every frame and must not allocate.
 */
export interface TrailSlotRecord {
  active: boolean;
  birth: number;
  lifetime: number;
  sourceIndex: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  scaleBase: number;
  drift: number;
  exit: StickerTrailExit;
}

export function createSlotRecord(): TrailSlotRecord {
  return {
    active: false,
    birth: 0,
    drift: 0,
    exit: "fade",
    lifetime: 0,
    rotation: 0,
    scaleBase: 1,
    size: 0,
    sourceIndex: -1,
    x: 0,
    y: 0,
  };
}

export function createSlotRecords(count: number): TrailSlotRecord[] {
  return Array.from({ length: Math.max(count, 0) }, createSlotRecord);
}

export function resetSlotRecord(record: TrailSlotRecord) {
  record.active = false;
  record.birth = 0;
  record.lifetime = 0;
  record.sourceIndex = -1;
}

/**
 * Pick the slot to reuse: the first inactive one, otherwise the oldest active
 * one. The pool never grows, so a full pool always recycles rather than
 * appending.
 */
export function acquireSlotIndex(records: readonly TrailSlotRecord[]): number {
  let oldestIndex = -1;
  let oldestBirth = Number.POSITIVE_INFINITY;

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record === undefined) {
      continue;
    }

    if (!record.active) {
      return index;
    }

    if (record.birth < oldestBirth) {
      oldestBirth = record.birth;
      oldestIndex = index;
    }
  }

  return oldestIndex;
}

export function slotProgress(record: TrailSlotRecord, now: number) {
  if (record.lifetime <= 0) {
    return 1;
  }

  return clamp((now - record.birth) / record.lifetime, 0, 1);
}

/**
 * The `stick` entrance: a quick scale-in with one restrained overshoot, then a
 * settle to rest. Exits then scale only for the `shrink` mode.
 */
export function slotScale(record: TrailSlotRecord, progress: number) {
  let factor = 1;

  if (progress < ENTRANCE_FRACTION) {
    const entrance = progress / ENTRANCE_FRACTION;
    factor =
      entrance < OVERSHOOT_PEAK
        ? 0.78 + (1.04 - 0.78) * (entrance / OVERSHOOT_PEAK)
        : 1.04 +
          (1 - 1.04) * ((entrance - OVERSHOOT_PEAK) / (1 - OVERSHOOT_PEAK));
  }

  if (record.exit === "shrink" && progress > EXIT_START) {
    const exit = (progress - EXIT_START) / (1 - EXIT_START);
    factor *= 1 + (SHRINK_TARGET - 1) * exit;
  }

  return record.scaleBase * factor;
}

export function slotOpacity(progress: number) {
  if (progress < OPACITY_RAMP) {
    return progress / OPACITY_RAMP;
  }

  if (progress <= EXIT_START) {
    return 1;
  }

  return 1 - (progress - EXIT_START) / (1 - EXIT_START);
}

/** Upward travel for the `float` exit; zero for every other mode. */
export function slotDrift(record: TrailSlotRecord, progress: number) {
  return record.exit === "float" ? record.drift * progress : 0;
}
