"use client";

import { useEffect, useState } from "react";

import type { TableOfContentsItem } from "../lib/mdx";

export function PageEdgeNav({
  items,
}: {
  readonly items: readonly TableOfContentsItem[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null);
    if (headings.length === 0) return;

    const updateActiveHeading = () => {
      const activationLine = window.innerHeight * 0.26;
      let current = headings[0];

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > activationLine) break;
        current = heading;
      }

      if (current?.id) setActiveId(current.id);
    };

    let frame: number | null = null;
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateActiveHeading();
      });
    };
    const observer = new IntersectionObserver(
      () => {
        // IntersectionObserver callbacks contain only headings whose state
        // changed. Re-evaluate the ordered set so callback batching cannot
        // make the current section depend on delivery order.
        scheduleUpdate();
      },
      { rootMargin: "-18% 0px -68%", threshold: [0, 1] },
    );
    for (const heading of headings) observer.observe(heading);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    scheduleUpdate();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  const links = (
    <ol>
      {items.map((item) => (
        <li data-level={item.level} key={item.id}>
          <a
            aria-current={activeId === item.id ? "location" : undefined}
            href={`#${item.id}`}
            onClick={() => {
              setActiveId(item.id);
              window.setTimeout(() => {
                const anchorTarget = document.getElementById(item.id);
                const focusTarget = anchorTarget?.matches("h2, h3")
                  ? anchorTarget
                  : anchorTarget?.querySelector<HTMLElement>("h2, h3");
                focusTarget?.focus({ preventScroll: true });
              });
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <aside aria-label="On this page" className="sui-docs-page-edge">
      <nav className="sui-docs-page-edge-desktop">
        <p>On this page</p>
        {links}
      </nav>
      <details className="sui-docs-page-edge-mobile">
        <summary>On this page</summary>
        <nav aria-label="On this page mobile">{links}</nav>
      </details>
    </aside>
  );
}
