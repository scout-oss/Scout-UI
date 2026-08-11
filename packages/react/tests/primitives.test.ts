/* eslint-disable react/no-children-prop -- createElement keeps these server-render tests in a Node-only .ts fixture. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Sticker, StickerBadge, StickerButton } from "../src/index";

const source = {
  id: "test-sticker",
  src: "/test-sticker.svg",
  width: 96,
  height: 96,
};

describe("Sticker", () => {
  it("renders a decorative source statically without a second outline", () => {
    const markup = renderToStaticMarkup(createElement(Sticker, { source }));

    expect(markup).toContain("<span");
    expect(markup).toContain('data-outline="none"');
    expect(markup).toContain('alt=""');
    expect(markup).toContain('class="sui-sticker-image"');
    expect(markup).not.toContain("tabindex");
  });

  it("keeps meaningful source text and intrinsic dimensions", () => {
    const markup = renderToStaticMarkup(
      createElement(Sticker, { alt: "A bright test sticker", source }),
    );

    expect(markup).toContain('alt="A bright test sticker"');
    expect(markup).toContain('width="96"');
    expect(markup).toContain('height="96"');
  });

  it("gives raw child content wrapper treatment by default", () => {
    const markup = renderToStaticMarkup(
      createElement(Sticker, { children: "RAW" }),
    );

    expect(markup).toContain('data-outline="cutline"');
    expect(markup).toContain("sui-sticker-content-wrapper");
  });

  it("uses native button semantics when interactive", () => {
    const markup = renderToStaticMarkup(
      createElement(Sticker, {
        "aria-label": "Open scout signal",
        children: "!",
        interactive: true,
      }),
    );

    expect(markup).toMatch(/^<button/u);
    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-label="Open scout signal"');
  });
});

describe("StickerButton", () => {
  it("renders a native button with a stable accessible loading label", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerButton, {
        children: "Save signal",
        loading: true,
        loadingLabel: "Saving signal",
      }),
    );

    expect(markup).toMatch(/^<button/u);
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("Saving signal");
    expect(markup).toContain("Save signal");
  });

  it("renders a real anchor and preserves href", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerButton, {
        children: "Read the guide",
        href: "/guide",
      }),
    );

    expect(markup).toMatch(/^<a/u);
    expect(markup).toContain('href="/guide"');
    expect(markup).not.toContain('role="button"');
  });
});

describe("StickerBadge", () => {
  it("renders static mode as a noninteractive span", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerBadge, { children: "Signal" }),
    );

    expect(markup).toMatch(/^<span/u);
    expect(markup).not.toContain("tabindex");
  });

  it("renders select mode as one pressed button", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerBadge, {
        children: "Selected signal",
        mode: "select",
        onSelectedChange: () => undefined,
        selected: true,
      }),
    );

    expect(markup).toMatch(/^<button/u);
    expect(markup).toContain('aria-pressed="true"');
    expect(markup.match(/<button/gu)).toHaveLength(1);
    expect(markup).toContain("✓");
  });

  it("renders remove mode as one named button without nesting", () => {
    const markup = renderToStaticMarkup(
      createElement(StickerBadge, {
        children: "Purple",
        mode: "remove",
        onRemove: () => undefined,
        removeLabel: "Remove Purple filter",
      }),
    );

    expect(markup).toMatch(/^<button/u);
    expect(markup).toContain('aria-label="Remove Purple filter"');
    expect(markup.match(/<button/gu)).toHaveLength(1);
  });
});
