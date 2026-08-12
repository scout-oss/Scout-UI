import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_ACTIVE,
  DEFAULT_TRAIL_PRESET,
  TRAIL_HARD_LIMITS,
  buildTrailSignature,
  resolveTrailOptions,
  stickerTrailPresets,
} from "../src/presets";
import { MAX_SPAWNS_PER_FRAME } from "../src/geometry";
import type { StickerTrailPreset, StickerSource } from "../src/types";

const stickers: readonly StickerSource[] = [
  { id: "a", src: "/a.svg" },
  { id: "b", src: "/b.svg" },
];

const presetNames = [
  "calm",
  "scout",
  "dense",
  "floaty",
  "chaos",
] as const satisfies readonly StickerTrailPreset[];

describe("preset catalogue", () => {
  it("ships exactly the five specified presets", () => {
    expect(Object.keys(stickerTrailPresets).sort()).toEqual(
      [...presetNames].sort(),
    );
  });

  it("defaults to scout, the signature reference experience", () => {
    expect(DEFAULT_TRAIL_PRESET).toBe("scout");
    expect(resolveTrailOptions({ stickers })).toMatchObject(
      stickerTrailPresets.scout,
    );
  });

  it("keeps the documented per-preset active maximums", () => {
    expect(stickerTrailPresets.calm.maxActive).toBe(14);
    expect(stickerTrailPresets.scout.maxActive).toBe(24);
    expect(stickerTrailPresets.dense.maxActive).toBe(32);
    expect(stickerTrailPresets.floaty.maxActive).toBe(20);
    expect(stickerTrailPresets.chaos.maxActive).toBe(32);
  });

  it("holds chaos at the dense maximum rather than the hard ceiling", () => {
    expect(stickerTrailPresets.chaos.maxActive).toBe(
      stickerTrailPresets.dense.maxActive,
    );
    expect(stickerTrailPresets.chaos.maxActive).toBeLessThan(
      TRAIL_HARD_LIMITS.maxActive.max,
    );
  });

  it("expresses chaos through variance, not through more nodes", () => {
    const chaos = stickerTrailPresets.chaos;
    const scout = stickerTrailPresets.scout;
    expect(chaos.rotation.max - chaos.rotation.min).toBeGreaterThan(
      scout.rotation.max - scout.rotation.min,
    );
    expect(chaos.scale.max - chaos.scale.min).toBeGreaterThan(
      scout.scale.max - scout.scale.min,
    );
  });

  it("gives floaty the longest life and the only upward drift", () => {
    expect(stickerTrailPresets.floaty.exit).toBe("float");
    expect(stickerTrailPresets.floaty.drift).toBeGreaterThan(0);
    for (const name of presetNames) {
      if (name !== "floaty") {
        expect(stickerTrailPresets[name].drift).toBe(0);
        expect(stickerTrailPresets[name].lifetime).toBeLessThan(
          stickerTrailPresets.floaty.lifetime,
        );
      }
    }
  });

  it("keeps calm the sparsest and dense the closest", () => {
    expect(stickerTrailPresets.calm.spacing.min).toBeGreaterThan(
      stickerTrailPresets.scout.spacing.min,
    );
    expect(stickerTrailPresets.dense.spacing.min).toBeLessThan(
      stickerTrailPresets.scout.spacing.min,
    );
    expect(stickerTrailPresets.dense.size.max).toBeLessThan(
      stickerTrailPresets.scout.size.max,
    );
  });

  it("keeps every preset inside every hard limit", () => {
    for (const name of presetNames) {
      const preset = stickerTrailPresets[name];
      expect(preset.maxActive).toBeGreaterThanOrEqual(
        TRAIL_HARD_LIMITS.maxActive.min,
      );
      expect(preset.maxActive).toBeLessThanOrEqual(
        TRAIL_HARD_LIMITS.maxActive.max,
      );
      expect(preset.lifetime).toBeGreaterThanOrEqual(
        TRAIL_HARD_LIMITS.lifetime.min,
      );
      expect(preset.lifetime).toBeLessThanOrEqual(
        TRAIL_HARD_LIMITS.lifetime.max,
      );
      expect(preset.size.min).toBeGreaterThanOrEqual(
        TRAIL_HARD_LIMITS.size.min,
      );
      expect(preset.size.max).toBeLessThanOrEqual(TRAIL_HARD_LIMITS.size.max);
      expect(preset.rotation.min).toBeGreaterThanOrEqual(
        TRAIL_HARD_LIMITS.rotation.min,
      );
      expect(preset.rotation.max).toBeLessThanOrEqual(
        TRAIL_HARD_LIMITS.rotation.max,
      );
    }
  });
});

describe("the three limit tiers stay separate", () => {
  it("keeps the hard ceiling above every preset value", () => {
    const highest = Math.max(
      ...presetNames.map((name) => stickerTrailPresets[name].maxActive),
    );
    expect(TRAIL_HARD_LIMITS.maxActive.max).toBeGreaterThan(highest);
  });

  it("keeps the no-preset default distinct from the hard ceiling", () => {
    expect(DEFAULT_MAX_ACTIVE).toBe(24);
    expect(DEFAULT_MAX_ACTIVE).toBeLessThan(TRAIL_HARD_LIMITS.maxActive.max);
  });

  it("matches the documented spawn budget", () => {
    expect(TRAIL_HARD_LIMITS.spawnsPerFrame).toBe(MAX_SPAWNS_PER_FRAME);
    expect(TRAIL_HARD_LIMITS.spawnsPerFrame).toBe(6);
  });
});

describe("option resolution", () => {
  it("applies the requested preset", () => {
    expect(resolveTrailOptions({ preset: "dense", stickers })).toMatchObject(
      stickerTrailPresets.dense,
    );
  });

  it("lets an explicit value override the preset", () => {
    const resolved = resolveTrailOptions({
      lifetime: 400,
      maxActive: 9,
      preset: "chaos",
      rotation: { min: -3, max: 3 },
      stickers,
    });

    expect(resolved.lifetime).toBe(400);
    expect(resolved.maxActive).toBe(9);
    expect(resolved.rotation).toEqual({ min: -3, max: 3 });
    // Unspecified values still come from the preset.
    expect(resolved.exit).toBe(stickerTrailPresets.chaos.exit);
    expect(resolved.size).toEqual(stickerTrailPresets.chaos.size);
  });

  it("supplies the documented defaults for unspecified behaviour", () => {
    const resolved = resolveTrailOptions({ stickers });
    expect(resolved.enabled).toBe(true);
    expect(resolved.clip).toBe(true);
    expect(resolved.touch).toBe("none");
    expect(resolved.sequence).toBe("random");
    expect(resolved.reducedMotion).toBe("system");
  });
});

describe("hard-bound clamping", () => {
  it("clamps an extreme consumer maxActive down to the ceiling", () => {
    expect(
      resolveTrailOptions({ maxActive: 100_000, stickers }).maxActive,
    ).toBe(TRAIL_HARD_LIMITS.maxActive.max);
  });

  it("clamps a tiny maxActive up to the floor", () => {
    expect(resolveTrailOptions({ maxActive: 0, stickers }).maxActive).toBe(
      TRAIL_HARD_LIMITS.maxActive.min,
    );
    expect(resolveTrailOptions({ maxActive: -50, stickers }).maxActive).toBe(
      TRAIL_HARD_LIMITS.maxActive.min,
    );
  });

  it("rounds a fractional maxActive to a whole pool size", () => {
    expect(resolveTrailOptions({ maxActive: 12.6, stickers }).maxActive).toBe(
      13,
    );
  });

  it("clamps lifetime, size, rotation, scale, and spacing", () => {
    const resolved = resolveTrailOptions({
      lifetime: 10_000_000,
      rotation: { min: -900, max: 900 },
      scale: { min: -5, max: 500 },
      size: { min: 1, max: 9000 },
      spacing: { min: 0, max: 10_000 },
      stickers,
    });

    expect(resolved.lifetime).toBe(TRAIL_HARD_LIMITS.lifetime.max);
    expect(resolved.size).toEqual(TRAIL_HARD_LIMITS.size);
    expect(resolved.rotation).toEqual(TRAIL_HARD_LIMITS.rotation);
    expect(resolved.scale).toEqual(TRAIL_HARD_LIMITS.scale);
    expect(resolved.spacing).toEqual(TRAIL_HARD_LIMITS.spacing);
  });

  it("clamps a lifetime below the floor", () => {
    expect(resolveTrailOptions({ lifetime: 1, stickers }).lifetime).toBe(
      TRAIL_HARD_LIMITS.lifetime.min,
    );
  });

  it("orders a reversed consumer range", () => {
    expect(
      resolveTrailOptions({ size: { min: 120, max: 40 }, stickers }).size,
    ).toEqual({ min: 40, max: 120 });
  });

  it("never lets a preset bypass the ceiling", () => {
    for (const preset of presetNames) {
      const resolved = resolveTrailOptions({ preset, stickers });
      expect(resolved.maxActive).toBeLessThanOrEqual(
        TRAIL_HARD_LIMITS.maxActive.max,
      );
    }
  });
});

describe("signature", () => {
  it("is stable across separate but equal option objects", () => {
    const first = buildTrailSignature(
      resolveTrailOptions({ preset: "scout", stickers: [{ ...stickers[0] }] }),
    );
    const second = buildTrailSignature(
      resolveTrailOptions({ preset: "scout", stickers: [{ ...stickers[0] }] }),
    );

    expect(first).toBe(second);
  });

  it("changes when a semantic value changes", () => {
    const base = buildTrailSignature(resolveTrailOptions({ stickers }));

    expect(
      buildTrailSignature(resolveTrailOptions({ maxActive: 8, stickers })),
    ).not.toBe(base);
    expect(
      buildTrailSignature(resolveTrailOptions({ seed: "other", stickers })),
    ).not.toBe(base);
    expect(
      buildTrailSignature(
        resolveTrailOptions({ stickers: [{ id: "c", src: "/c.svg" }] }),
      ),
    ).not.toBe(base);
  });

  it("ignores a difference that resolution normalises away", () => {
    expect(
      buildTrailSignature(resolveTrailOptions({ maxActive: 1_000, stickers })),
    ).toBe(
      buildTrailSignature(
        resolveTrailOptions({
          maxActive: TRAIL_HARD_LIMITS.maxActive.max,
          stickers,
        }),
      ),
    );
  });
});
