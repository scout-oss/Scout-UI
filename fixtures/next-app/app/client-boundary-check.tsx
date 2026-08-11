"use client";

import { stickerTrailVersion } from "@scout-ui/react/sticker-trail";
import { useState } from "react";

export function ClientBoundaryCheck({
  initialLabel,
}: {
  initialLabel: string;
}) {
  const [activations, setActivations] = useState(0);

  return (
    <section aria-labelledby="client-boundary-heading">
      <h2 id="client-boundary-heading">{initialLabel}</h2>
      <p data-testid="client-entry-value">{stickerTrailVersion}</p>
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
