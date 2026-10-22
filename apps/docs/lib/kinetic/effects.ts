"use client";

import { useSyncExternalStore } from "react";

/**
 * Reduced effects is true when the operating system requests reduced motion
 * OR the visitor chose "Reduce effects" in the footer (EffectsControl writes
 * `data-sui-docs-effects-effective` on <html>). The system request always wins.
 */
const query = "(prefers-reduced-motion: reduce)";

const storageKey = "scout-ui-docs:reduced-effects";

function storedReduced(): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "reduced";
  } catch {
    return false;
  }
}

export function isReducedEffects(): boolean {
  if (typeof window === "undefined") return true;
  const effective = document.documentElement.dataset.suiDocsEffectsEffective;
  if (window.matchMedia(query).matches || effective === "reduced") return true;
  // Before EffectsControl has applied the stored preference on this load,
  // the visitor's saved choice is still authoritative.
  return effective === undefined && storedReduced();
}

/** True for touch-first devices, where hover-driven responses never fire. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(query);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["data-sui-docs-effects-effective"],
    attributes: true,
  });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/**
 * Subscribes to the effective reduced-effects state. The server snapshot is
 * `true`, so the first client render matches the static, motion-free HTML and
 * kinetic behaviour only arms after hydration.
 */
export function useReducedEffects(): boolean {
  return useSyncExternalStore(subscribe, isReducedEffects, () => true);
}

/** Calls `onChange` whenever the effective state flips, outside React. */
export function watchReducedEffects(
  onChange: (reduced: boolean) => void,
): () => void {
  return subscribe(() => {
    onChange(isReducedEffects());
  });
}
