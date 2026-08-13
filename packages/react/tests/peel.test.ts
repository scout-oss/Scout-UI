import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StickerPeel } from "../src/index";
import type { StickerPeelProps } from "../src/index";

describe("StickerPeel server semantics", () => {
  it("renders a deterministic closed disclosure with both layers mounted", () => {
    const props: StickerPeelProps = {
      back: "Answer",
      front: "Question",
      id: "peel-ssr",
    };
    const first = renderToStaticMarkup(createElement(StickerPeel, props));
    const second = renderToStaticMarkup(createElement(StickerPeel, props));

    expect(first).toBe(second);
    expect(first).toContain('data-open="false"');
    expect(first).toContain('aria-expanded="false"');
    expect(first).toContain('aria-controls="peel-ssr-back"');
    expect(first).toContain("Question");
    expect(first).toContain("Answer");
    expect(first).toMatch(/id="peel-ssr-back"[^>]*inert/u);
    expect(first).toContain("Peel to reveal");
  });

  it("renders controlled open and defaultOpen deterministically", () => {
    for (const state of [{ open: true }, { defaultOpen: true }]) {
      const markup = renderToStaticMarkup(
        createElement(StickerPeel, {
          ...state,
          back: "Open answer",
          front: "Closed prompt",
          id: "open-peel",
        }),
      );
      expect(markup).toContain('data-open="true"');
      expect(markup).toContain('aria-expanded="true"');
      expect(markup).toMatch(/sui-sticker-peel-front[^>]*inert/u);
      expect(markup).toContain("Stick back");
    }
  });

  it("emits disabled and reduced-motion state without browser evaluation", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerPeel, {
        back: "Back",
        disabled: true,
        front: "Front",
        peelSize: 52,
        reducedMotion: "always",
      }),
    );
    expect(markup).toContain("disabled");
    expect(markup).toContain('data-reduced-motion="always"');
    expect(markup).toContain("--sui-peel-size:52px");
  });
});
