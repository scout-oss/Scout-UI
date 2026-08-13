import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StickerStack } from "../src/index";
import type { StickerStackProps } from "../src/index";

const items = Array.from({ length: 8 }, (_, index) => ({
  id: `item-${String(index)}`,
  label: `Card ${String(index + 1)}`,
}));

type Item = (typeof items)[number];

function TestStack(props: StickerStackProps<Item>) {
  return createElement(StickerStack<Item>, props);
}

describe("StickerStack server semantics", () => {
  it("renders deterministic bounded markup with one active card", () => {
    const props = {
      getKey: (item: (typeof items)[number]) => item.id,
      id: "stack-ssr",
      items,
      renderItem: (item: (typeof items)[number]) => item.label,
    };
    const first = renderToStaticMarkup(createElement(TestStack, props));
    const second = renderToStaticMarkup(createElement(TestStack, props));
    expect(first).toBe(second);
    expect(first.match(/data-stack-card="true"/gu)).toHaveLength(3);
    expect(first.match(/data-active="true"/gu)).toHaveLength(1);
    expect(first.match(/data-active="false"/gu)).toHaveLength(2);
    expect(first.match(/inert=""/gu)).toHaveLength(2);
    expect(first).toContain('aria-label="Previous item"');
    expect(first).toContain('aria-label="Next item"');
    expect(first).not.toContain("Item 1 of 8");
  });

  it("normalizes controlled and default indexes without mutating data", () => {
    const original = [...items];
    const controlled = renderToStaticMarkup(
      createElement(StickerStack, {
        getKey: (item: (typeof items)[number]) => item.id,
        index: 99,
        items,
        renderItem: (item: (typeof items)[number]) => item.label,
        visibleCount: 2,
      }),
    );
    const uncontrolled = renderToStaticMarkup(
      createElement(StickerStack, {
        defaultIndex: 4,
        getKey: (item: (typeof items)[number]) => item.id,
        items,
        renderItem: (item: (typeof items)[number]) => item.label,
        visibleCount: 5,
      }),
    );
    expect(controlled).toContain("Card 8");
    expect(controlled.match(/data-stack-card="true"/gu)).toHaveLength(2);
    expect(uncontrolled).toContain("Card 5");
    expect(uncontrolled.match(/data-stack-card="true"/gu)).toHaveLength(5);
    expect(items).toEqual(original);
  });

  it("renders empty and one-item states without phantom navigation", () => {
    const empty = renderToStaticMarkup(
      createElement(StickerStack, {
        empty: createElement("p", null, "Nothing stuck yet"),
        getKey: (item: { id: string }) => item.id,
        items: [],
        renderItem: (item: { id: string }) => item.id,
      }),
    );
    expect(empty).toContain("Nothing stuck yet");
    expect(empty).not.toContain("data-stack-card");
    expect(empty).not.toContain("Next item");

    const one = renderToStaticMarkup(
      createElement(StickerStack, {
        getKey: (item: (typeof items)[number]) => item.id,
        items: items.slice(0, 1),
        loop: true,
        renderItem: (item: (typeof items)[number]) => item.label,
        visibleCount: 5,
      }),
    );
    expect(one.match(/data-stack-card="true"/gu)).toHaveLength(1);
    expect(one.match(/disabled=""/gu)).toHaveLength(2);
  });
});
