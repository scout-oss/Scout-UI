import { createElement } from "react";
import type { MouseEventHandler } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StickerNavbar } from "../src/index";
import type { StickerNavbarProps } from "../src/index";

interface TestNavItem {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

const items = [
  { href: "/", id: "home", label: "Home" },
  { href: "/work", id: "work", label: "Selected work" },
  {
    external: true,
    href: "https://example.com/notes",
    id: "notes",
    label: "Notes",
  },
  { disabled: true, href: "/draft", id: "draft", label: "Draft" },
] satisfies readonly TestNavItem[];

function renderDeterministically(props: StickerNavbarProps) {
  const first = renderToStaticMarkup(createElement(StickerNavbar, props));
  const second = renderToStaticMarkup(createElement(StickerNavbar, props));
  expect(second).toBe(first);
  return first;
}

function renderFrameworkLink(
  item: TestNavItem,
  linkProps: {
    className: string;
    "aria-current"?: "page";
    onClick: MouseEventHandler<HTMLAnchorElement>;
  },
) {
  return createElement(
    "a",
    {
      ...linkProps,
      "data-framework-link": item.id,
      href: item.href,
    },
    item.label,
  );
}

describe("StickerNavbar server semantics", () => {
  it("renders deterministic Ribbon defaults and semantic navigation", () => {
    const markup = renderDeterministically({
      activeId: "work",
      brand: createElement("strong", { "data-brand-slot": "true" }, "Scout"),
      items,
    });

    expect(markup).toContain("<header");
    expect(markup).toContain("<nav");
    expect(markup).toContain('data-navbar-header="true"');
    expect(markup).toContain('data-navbar-nav="desktop"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('data-variant="ribbon"');
    expect(markup).toContain('data-sticky="false"');
    expect(markup).toContain('data-reduced-motion="system"');
    expect(markup).toContain('data-navbar-ribbon="true"');
    expect(markup).not.toContain('data-navbar-collage="true"');
    expect(markup).not.toContain('data-navbar-progress="true"');
    expect(markup).toContain('data-brand-slot="true"');
    expect(markup).toContain('data-navbar-item="home"');
    expect(markup).toContain('data-navbar-item="work"');
    expect(markup).toContain('data-navbar-item="notes"');
    expect(markup).not.toContain('data-navbar-item="draft"');
    expect(markup).not.toContain("Draft");
    expect(markup.match(/aria-current="page"/gu)).toHaveLength(1);
    expect(markup).toMatch(
      /<a(?=[^>]*data-navbar-item="work")(?=[^>]*data-active="true")(?=[^>]*aria-current="page")[^>]*>/u,
    );
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('aria-label="Open navigation menu"');
  });

  it("renders deterministic Collage, slots, sticky mode, and progress", () => {
    const markup = renderDeterministically({
      action: createElement(
        "a",
        { "data-action-slot": "true", href: "/join" },
        "Join",
      ),
      activeId: "home",
      brand: createElement("span", { "data-brand-slot": "true" }, "Scout"),
      closeMenuLabel: "Dismiss site menu",
      collage: [
        { id: "star", src: "/star.svg" },
        { id: "burst", src: "/burst.svg" },
      ],
      items,
      menuLabel: "Show site menu",
      reducedMotion: "always",
      showScrollProgress: true,
      sticky: true,
      switcher: createElement(
        "button",
        { "data-switcher-slot": "true", type: "button" },
        "Theme",
      ),
      variant: "collage",
    });

    expect(markup).toContain('data-variant="collage"');
    expect(markup).toContain('data-sticky="true"');
    expect(markup).toContain('data-reduced-motion="always"');
    expect(markup).toContain('data-navbar-collage="true"');
    expect(markup).toContain('data-navbar-progress="true"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('data-navbar-ribbon="true"');
    expect(markup).toContain('data-brand-slot="true"');
    expect(markup).toContain('data-switcher-slot="true"');
    expect(markup).toContain('data-action-slot="true"');
    expect(markup).toContain('aria-label="Show site menu"');
  });

  it("preserves header attributes and custom anchor renderer props", () => {
    const markup = renderDeterministically({
      "aria-label": "Site header",
      activeId: "work",
      brand: "Scout",
      className: "consumer-navbar",
      id: "site-navbar",
      items,
      renderLink: renderFrameworkLink,
    });

    expect(markup).toMatch(/<header[^>]*id="site-navbar"/u);
    expect(markup).toMatch(/<header[^>]*aria-label="Site header"/u);
    expect(markup).toContain("consumer-navbar");
    expect(markup).toContain('data-framework-link="home"');
    expect(markup).toContain('data-framework-link="work"');
    expect(markup).toMatch(
      /<a(?=[^>]*data-framework-link="work")(?=[^>]*aria-current="page")[^>]*>/u,
    );
    expect(markup).toContain("sui-sticker-navbar-item");
  });
});
