import { describe, expect, it } from "vitest";

import * as engine from "../src/engine";
import * as geometry from "../src/geometry";
import * as trail from "../src/index";
import * as pool from "../src/pool";
import * as presets from "../src/presets";
import * as sequence from "../src/sequence";

describe("@scout-ui/sticker-trail public entry", () => {
  it("exports the production Trail API and nothing else", () => {
    expect(Object.keys(trail).sort()).toEqual([
      "StickerTrail",
      "useStickerTrail",
    ]);
  });

  it("no longer exposes the milestone-2 packaging sentinel", () => {
    expect("stickerTrailVersion" in trail).toBe(false);
  });
});

describe("server-safe module evaluation", () => {
  it("runs in an environment with no DOM at all", () => {
    // The Vitest environment is Node. If any module read `window`,
    // `document`, `navigator`, `matchMedia`, or an observer constructor at
    // module scope, importing it above would already have thrown.
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");
  });

  it("evaluates every internal module without a browser global", () => {
    expect(typeof engine.createStickerTrailEngine).toBe("function");
    expect(typeof geometry.planSegmentSpawns).toBe("function");
    expect(typeof pool.createSlotRecords).toBe("function");
    expect(typeof presets.resolveTrailOptions).toBe("function");
    expect(typeof sequence.createRandom).toBe("function");
    expect(typeof trail.StickerTrail).toBe("function");
    expect(typeof trail.useStickerTrail).toBe("function");
  });

  it("defers every capability decision to engine construction", () => {
    // Resolution — the only work the component does during render — must be
    // computable on a server.
    const resolved = presets.resolveTrailOptions({
      stickers: [{ id: "a", src: "/a.svg" }],
    });

    expect(resolved.maxActive).toBe(presets.DEFAULT_MAX_ACTIVE);
    expect(resolved.enabled).toBe(true);
  });
});
