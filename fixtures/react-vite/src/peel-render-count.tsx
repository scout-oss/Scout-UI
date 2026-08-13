import { StickerPeel } from "@scout-ui/react/sticker-peel";
import { Profiler, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/react/styles.css";

type PeelCounter =
  | "__scoutUiPeelChildRenders"
  | "__scoutUiPeelCommits"
  | "__scoutUiPeelStrictEffectRuns";

type PeelWindow = Window & Partial<Record<PeelCounter, number>>;

function bump(key: PeelCounter) {
  const scope = window as PeelWindow;
  scope[key] = (scope[key] ?? 0) + 1;
}

function RenderProbe() {
  bump("__scoutUiPeelChildRenders");
  return <p data-testid="peel-render-probe">Imperative drag content</p>;
}

function StrictEffectProbe() {
  useEffect(() => {
    bump("__scoutUiPeelStrictEffectRuns");
  }, []);
  return null;
}

const peelStyle = { minHeight: 220 } as const;

function RenderCountPanel() {
  const [unrelated, setUnrelated] = useState(0);
  return (
    <section>
      <h2>Render count</h2>
      <button
        data-testid="peel-force-rerender"
        onClick={() => {
          setUnrelated((value) => value + 1);
        }}
        type="button"
      >
        Force re-render: {unrelated}
      </button>
      <Profiler
        id="peel"
        onRender={() => {
          bump("__scoutUiPeelCommits");
        }}
      >
        <StickerPeel
          back={<button type="button">Back action</button>}
          data-testid="render-count-peel"
          drag
          front={<RenderProbe />}
          origin="top-left"
          style={peelStyle}
        />
      </Profiler>
    </section>
  );
}

function LifecyclePanel() {
  const [mounted, setMounted] = useState(true);
  const [cycle, setCycle] = useState(0);
  return (
    <section>
      <h2>Lifecycle</h2>
      <button
        data-testid="peel-toggle-mount"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount" : "Mount"}
      </button>
      <button
        data-testid="peel-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount
      </button>
      <p data-testid="peel-cycle">{cycle}</p>
      {mounted ? (
        <div data-testid="peel-mounted" key={cycle}>
          <StrictEffectProbe />
          <StickerPeel
            back="Lifecycle back"
            data-testid="lifecycle-peel"
            drag
            front="Lifecycle front"
            origin="top-left"
            style={peelStyle}
          />
        </div>
      ) : null}
    </section>
  );
}

function App() {
  return (
    <main>
      <h1>Peel render count and lifecycle</h1>
      <RenderCountPanel />
      <LifecyclePanel />
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");
if (root === null) throw new Error("Peel render-count fixture root is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
