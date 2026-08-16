"use client";

import { useEffect, useState } from "react";

const storageKey = "scout-ui-docs:reduced-effects";
type Preference = "reduced" | "system";

function applyPreference(preference: Preference, osReduced: boolean) {
  const root = document.documentElement;
  root.dataset.suiDocsEffectsPreference = preference;
  root.dataset.suiDocsEffectsEffective =
    preference === "reduced" || osReduced ? "reduced" : "system";
}

export function EffectsControl() {
  const [preference, setPreference] = useState<Preference>("system");
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored = window.localStorage.getItem(storageKey);
    const initialPreference: Preference =
      stored === "reduced" ? "reduced" : "system";

    applyPreference(initialPreference, media.matches);
    const frame = window.requestAnimationFrame(() => {
      setPreference(initialPreference);
      setOsReduced(media.matches);
    });

    const handleChange = (event: MediaQueryListEvent) => {
      setOsReduced(event.matches);
      const current =
        document.documentElement.dataset.suiDocsEffectsPreference === "reduced"
          ? "reduced"
          : "system";
      applyPreference(current, event.matches);
    };
    media.addEventListener("change", handleChange);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const reduced = preference === "reduced";
  const effectiveReduced = reduced || osReduced;

  return (
    <button
      aria-describedby="effects-control-description"
      aria-pressed={reduced}
      className="sui-docs-effects-control"
      onClick={() => {
        const next: Preference = reduced ? "system" : "reduced";
        setPreference(next);
        window.localStorage.setItem(storageKey, next);
        applyPreference(next, osReduced);
      }}
      type="button"
    >
      <span aria-hidden="true">{effectiveReduced ? "—" : "✦"}</span>
      {reduced ? "Use system effects" : "Reduce effects"}
      <span
        className="sui-docs-visually-hidden"
        id="effects-control-description"
      >
        {osReduced
          ? "Your operating system requests reduced motion, so reduced effects remain active."
          : "Reduces decorative motion while preserving content and interface state."}
      </span>
    </button>
  );
}
