"use client";

import { StickerCursor } from "@scout-ui/react";
import type { StickerSource } from "@scout-ui/react";
import { useState } from "react";

import { brokenSource, cursorSources } from "../cursor/cursor-sources";

/**
 * Surfaces that deliberately host an asset which cannot decode. They live on
 * their own route because the resulting 404 is expected here and would
 * otherwise fail the clean-diagnostics assertions on the main cursor surface.
 */
export function CursorAssetSurfaces() {
  // Widened deliberately: the surface swaps between a valid and a broken
  // source, which the `as const` literal type would otherwise forbid.
  const [source, setSource] = useState<StickerSource>(cursorSources.default);

  return (
    <>
      <section aria-labelledby="readiness-heading">
        <h2 id="readiness-heading">Asset readiness</h2>
        <button
          data-testid="readiness-break"
          onClick={() => {
            setSource(brokenSource);
          }}
          type="button"
        >
          Swap to a broken source
        </button>
        <button
          data-testid="readiness-restore"
          onClick={() => {
            setSource(cursorSources.default);
          }}
          type="button"
        >
          Restore a valid source
        </button>
        <StickerCursor
          className="cursor-box cursor-box-compact"
          data-testid="readiness-cursor"
          visuals={{ default: { source } }}
        >
          <p>Native cursor stays until this artwork decodes.</p>
        </StickerCursor>
      </section>

      <section aria-labelledby="broken-heading">
        <h2 id="broken-heading">Broken default</h2>
        <StickerCursor
          className="cursor-box cursor-box-compact"
          data-testid="broken-cursor"
          visuals={{ default: { source: brokenSource } }}
        >
          <p>A default that never decodes must leave the native cursor.</p>
        </StickerCursor>
      </section>
    </>
  );
}
