"use client";

import { StickerTrail } from "@scout-ui/react/sticker-trail";
import { useState } from "react";

const sources = [
  {
    id: "boundary",
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#1664ff"/></svg>',
    )}`,
    width: 24,
    height: 24,
  },
];

/**
 * Exercises the React package's client leaf with the production Trail API.
 * The reported value is the rendered pool size, which proves the leaf resolved,
 * hydrated, and produced a real bounded pool.
 */
export function ClientBoundaryCheck({
  initialLabel,
}: {
  initialLabel: string;
}) {
  const [activations, setActivations] = useState(0);

  return (
    <section aria-labelledby="client-boundary-heading">
      <h2 id="client-boundary-heading">{initialLabel}</h2>
      <StickerTrail
        className="trail-box trail-box-compact"
        data-testid="client-entry-trail"
        maxActive={6}
        seed="boundary"
        stickers={sources}
      >
        <p data-testid="client-entry-value">client trail ready</p>
      </StickerTrail>
      <button
        type="button"
        onClick={() => {
          setActivations((value) => value + 1);
        }}
      >
        Activations: {activations}
      </button>
    </section>
  );
}
