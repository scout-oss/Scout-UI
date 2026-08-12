import { StickerTrail } from "@scout-ui/sticker-trail";
import { Profiler, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/sticker-trail/styles.css";

/**
 * Built in development mode on purpose: React's `<Profiler>` only invokes
 * `onRender` in a development build, so a production bundle would report zero
 * commits and the proof would be vacuous. Deliberately not wrapped in
 * StrictMode, so commit counts stay exact.
 */

interface RenderWindow extends Window {
  __scoutUiTrailCommits?: number;
  __scoutUiTrailChildRenders?: number;
}

function bump(key: "__scoutUiTrailCommits" | "__scoutUiTrailChildRenders") {
  const scope = window as RenderWindow;
  scope[key] = (scope[key] ?? 0) + 1;
}

function RenderProbe() {
  bump("__scoutUiTrailChildRenders");
  return <p data-testid="render-probe">Underlying content</p>;
}

const sources = [
  {
    id: "render-count",
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#7c2cff"/></svg>',
    )}`,
    width: 24,
    height: 24,
  },
];

function RenderCountApp() {
  const [unrelated, setUnrelated] = useState(0);

  return (
    <main>
      <h1>Render count surface</h1>
      <button
        data-testid="force-rerender"
        onClick={() => {
          setUnrelated((value) => value + 1);
        }}
        type="button"
      >
        Force re-render: {unrelated}
      </button>
      {/*
        The Profiler commits once per commit of this subtree. Pointer movement
        and slot lifecycles must never produce one.
      */}
      <Profiler
        id="trail"
        onRender={() => {
          bump("__scoutUiTrailCommits");
        }}
      >
        <StickerTrail
          data-testid="render-count-trail"
          lifetime={5000}
          maxActive={12}
          seed="render-count"
          spacing={{ min: 20, max: 20 }}
          stickers={sources}
          style={{ border: "2px solid #121116", minHeight: 288, padding: 16 }}
        >
          <RenderProbe />
        </StickerTrail>
      </Profiler>
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("Render count fixture root element is missing");
}

createRoot(root).render(<RenderCountApp />);
