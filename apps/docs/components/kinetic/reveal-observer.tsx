"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  isReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";
import {
  isOnScreen,
  isSkimming,
  trackSkimming,
} from "../../lib/kinetic/visibility";

/**
 * One IntersectionObserver for every `[data-k-reveal]` element on the page.
 *
 * Content is never hidden by default: the hidden "before" state only applies
 * once <html data-k-armed> is set here, and anything already on screen is
 * marked revealed synchronously first, so armed pages never flash. Reveals are
 * one-way (they never re-hide on scroll-out) and run as finite CSS transitions.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (isReducedEffects() || !("IntersectionObserver" in window)) {
      delete root.dataset.kArmed;
      return;
    }
    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-k-reveal]:not([data-k-in])",
      ),
    ];
    const viewport = window.innerHeight;
    for (const target of targets) {
      const box = target.getBoundingClientRect();
      if (box.top < viewport && box.bottom > 0) target.dataset.kIn = "true";
    }
    root.dataset.kArmed = "true";
    trackSkimming();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !isOnScreen(entry.target)) continue;
          const target = entry.target as HTMLElement;
          if (isSkimming()) target.dataset.kInstant = "true";
          target.dataset.kIn = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const target of targets) {
      if (target.dataset.kIn !== "true") observer.observe(target);
    }
    // Choosing "Reduce effects" mid-visit disarms immediately: anything
    // still hidden becomes visible without choreography.
    const stopWatching = watchReducedEffects((reduced) => {
      if (!reduced) return;
      observer.disconnect();
      delete root.dataset.kArmed;
    });
    return () => {
      stopWatching();
      observer.disconnect();
    };
  }, [pathname]);
  return null;
}
