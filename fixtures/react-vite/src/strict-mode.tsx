import { StickerTrail, useStickerTrail } from "@scout-ui/sticker-trail";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/sticker-trail/styles.css";

/**
 * This entry is built in development mode on purpose: React only performs the
 * Strict Mode setup/cleanup/setup replay in a development build, and the
 * milestone requires that replay to be exercised rather than disabled.
 */

interface StrictWindow extends Window {
  __scoutUiStrictEffectRuns?: number;
}

const sources = [
  {
    id: "strict",
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#ff3d9a"/></svg>',
    )}`,
    width: 24,
    height: 24,
  },
];

/** Reports whether Strict Mode is genuinely double-invoking effects. */
function StrictModeProbe() {
  useEffect(() => {
    const scope = window as StrictWindow;
    scope.__scoutUiStrictEffectRuns =
      (scope.__scoutUiStrictEffectRuns ?? 0) + 1;
  }, []);

  return null;
}

function HookTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useStickerTrail({
    containerRef,
    layerRef,
    maxActive: 6,
    seed: "strict-hook",
    stickers: sources,
  });

  return (
    <div
      data-testid="strict-hook-trail"
      ref={containerRef}
      style={{ border: "2px solid #121116", minHeight: 160, padding: 16 }}
    >
      <p>Strict hook trail</p>
      <div
        aria-hidden="true"
        className="sui-trail-layer"
        ref={layerRef}
        role="presentation"
      />
    </div>
  );
}

function StrictApp() {
  const [mounted, setMounted] = useState(true);
  const [cycle, setCycle] = useState(0);

  return (
    <main>
      <h1>Strict mode trail consumer</h1>
      <button
        data-testid="strict-toggle"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount" : "Mount"}
      </button>
      <button
        data-testid="strict-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount
      </button>
      <p data-testid="strict-cycle">{cycle}</p>
      {mounted ? (
        <div data-testid="strict-mounted" key={cycle}>
          <StrictModeProbe />
          <StickerTrail
            data-testid="strict-trail"
            maxActive={6}
            seed="strict"
            stickers={sources}
            style={{ border: "2px solid #121116", minHeight: 160, padding: 16 }}
          >
            <p>Strict wrapper trail</p>
          </StickerTrail>
          <HookTrail />
        </div>
      ) : null}
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("Strict mode fixture root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <StrictApp />
  </StrictMode>,
);
