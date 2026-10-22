import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StickerPeel } from "../src/index";
import {
  clipHalfPlane,
  peelGeometry,
  reflectAcross,
  tipForReach,
} from "../src/sticker-peel/peel-realistic";

describe("StickerPeel realistic appearance (opt-in)", () => {
  it("keeps the classic default and adds no decorative layers", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerPeel, { back: "B", front: "F", id: "p" }),
    );
    expect(markup).toContain('data-appearance="classic"');
    expect(markup).not.toContain("sui-sticker-peel-flap");
  });

  it("renders the flap and shadow as hidden decoration without changing semantics", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerPeel, {
        appearance: "realistic",
        back: "Answer",
        front: "Question",
        id: "real",
      }),
    );
    expect(markup).toContain('data-appearance="realistic"');
    expect(markup).toMatch(/aria-hidden="true" class="sui-sticker-peel-flap"/u);
    expect(markup).toMatch(
      /aria-hidden="true" class="sui-sticker-peel-shadow-wrap"/u,
    );
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="real-back"');
  });
});

describe("realistic peel geometry", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  it("clips a polygon to one half-plane", () => {
    const kept = clipHalfPlane(square, { x: 50, y: 0 }, { x: 1, y: 0 });
    expect(Math.min(...kept.map((p) => p.x))).toBeCloseTo(50);
    expect(Math.max(...kept.map((p) => p.x))).toBeCloseTo(100);
  });

  it("reflects points across the fold line", () => {
    const p = reflectAcross({ x: 10, y: 20 }, { x: 50, y: 0 }, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(90);
    expect(p.y).toBeCloseTo(20);
  });

  it("is flat at the corner and fully peeled at full reach", () => {
    const rest = peelGeometry("top-right", 200, 100, { x: 200, y: 0 });
    expect(rest.lift).toBe(0);
    expect(rest.flap).toEqual([]);
    expect(rest.front).toHaveLength(4);

    const full = peelGeometry(
      "top-right",
      200,
      100,
      tipForReach("top-right", 200, 100, 1),
    );
    expect(full.front.length).toBeLessThan(3);
    expect(full.reach).toBe(1);
  });

  it("puts the reflected corner exactly on the tip", () => {
    const tip = { x: 150, y: 40 };
    const g = peelGeometry("top-right", 200, 100, tip);
    const corner = reflectAcross({ x: 200, y: 0 }, g.fold, g.normal);
    expect(corner.x).toBeCloseTo(tip.x);
    expect(corner.y).toBeCloseTo(tip.y);
    expect(g.flap.length).toBeGreaterThanOrEqual(3);
  });
});
