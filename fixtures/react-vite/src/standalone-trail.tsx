import { StickerTrail, useStickerTrail } from "@scout-ui/sticker-trail";
import { useRef } from "react";
import { createRoot } from "react-dom/client";

// The standalone consumer path. Nothing here imports @scout-ui/react,
// @scout-ui/stickers, or the broad stylesheet: the trail package must be
// completely self-sufficient, styles included.
import "@scout-ui/sticker-trail/styles.css";

const sources = [
  {
    id: "standalone",
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#7c2cff"/></svg>',
    )}`,
    width: 24,
    height: 24,
  },
];

function HookOnly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useStickerTrail({
    containerRef,
    layerRef,
    maxActive: 6,
    seed: "standalone-hook",
    stickers: sources,
  });

  return (
    <div
      data-testid="standalone-hook-trail"
      ref={containerRef}
      style={{ border: "2px solid #121116", minHeight: 200, padding: 16 }}
    >
      <p>Standalone hook trail</p>
      <div
        aria-hidden="true"
        className="sui-trail-layer"
        ref={layerRef}
        role="presentation"
      />
    </div>
  );
}

function StandaloneApp() {
  return (
    <main>
      <h1>Standalone trail consumer</h1>
      <StickerTrail
        data-testid="standalone-trail"
        maxActive={8}
        seed="standalone"
        spacing={{ min: 20, max: 20 }}
        stickers={sources}
        style={{ border: "2px solid #121116", minHeight: 200, padding: 16 }}
      >
        <p data-testid="standalone-content">
          Only @scout-ui/sticker-trail is installed on this page.
        </p>
      </StickerTrail>
      <HookOnly />
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("Standalone fixture root element is missing");
}

createRoot(root).render(<StandaloneApp />);
