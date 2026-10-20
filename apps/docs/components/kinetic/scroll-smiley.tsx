"use client";

import { useEffect, useRef } from "react";

import {
  isReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";

/**
 * The brand smiley that turns with the page. Rotation is a direct function of
 * scroll position (0.36deg per px, the mapping measured on goodface.agency),
 * so it reverses when you scroll back and is perfectly still at rest.
 *
 * One passive scroll listener schedules at most one write per frame; nothing
 * runs while the page is idle, so the M17 settle budget is unaffected.
 * Decorative: the brand link carries the accessible name.
 */
const DEGREES_PER_PX = 0.36;

export function ScrollSmiley() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;

    const write = () => {
      frame = 0;
      element.style.transform = `rotate(${(window.scrollY * DEGREES_PER_PX).toFixed(1)}deg)`;
    };
    const onScroll = () => {
      if (frame === 0 && !isReducedEffects()) {
        frame = window.requestAnimationFrame(write);
      }
    };

    if (!isReducedEffects()) write();
    window.addEventListener("scroll", onScroll, { passive: true });
    const stopWatching = watchReducedEffects((reduced) => {
      if (reduced) element.style.transform = "";
      else write();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      stopWatching();
    };
  }, []);

  return (
    <span aria-hidden="true" className="sui-k-smiley" ref={ref}>
      <svg focusable="false" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          fill="var(--sui-acid)"
          r="17.5"
          stroke="var(--sui-ink)"
          strokeWidth="3"
        />
        <ellipse cx="14" cy="16" fill="var(--sui-ink)" rx="2.6" ry="3.6" />
        <ellipse cx="26" cy="16" fill="var(--sui-ink)" rx="2.6" ry="3.6" />
        <path
          d="M11.5 23.5 q8.5 9 17 0"
          fill="none"
          stroke="var(--sui-ink)"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle cx="12" cy="11.5" fill="#fff" opacity="0.7" r="2.2" />
      </svg>
    </span>
  );
}
