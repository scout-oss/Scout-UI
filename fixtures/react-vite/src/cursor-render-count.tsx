import { StickerCursor } from "@scout-ui/react/sticker-cursor";
import { Profiler, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/react/styles.css";

/**
 * Built in development mode on purpose. React's `<Profiler>` only invokes
 * `onRender` in a development build, and Strict Mode only replays effect
 * setup/cleanup there — both are needed to verify the cursor honestly against a
 * real packed tarball. Each instrument asserts it is live before any conclusion
 * is drawn, so neither can pass vacuously.
 */

type CursorCounter =
  | "__scoutUiCursorChildRenders"
  | "__scoutUiCursorCommits"
  | "__scoutUiCursorStrictEffectRuns";

type CursorWindow = Window & Partial<Record<CursorCounter, number>>;

function bump(key: CursorCounter) {
  const scope = window as CursorWindow;
  scope[key] = (scope[key] ?? 0) + 1;
}

function svg(fill: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="${fill}"/></svg>`,
  )}`;
}

const visuals = {
  active: { source: { id: "active", src: svg("#ff3d9a") } },
  default: { source: { id: "default", src: svg("#7c2cff") } },
  hover: { source: { id: "hover", src: svg("#d4ff5f") } },
};

const boxStyle = {
  border: "2px solid #121116",
  minHeight: 260,
  padding: 16,
} as const;

function RenderProbe() {
  bump("__scoutUiCursorChildRenders");
  return <p data-testid="cursor-render-probe">Underlying content</p>;
}

/** Reports whether Strict Mode is genuinely double-invoking effects. */
function StrictEffectProbe() {
  useEffect(() => {
    bump("__scoutUiCursorStrictEffectRuns");
  }, []);

  return null;
}

function RenderCountPanel() {
  const [unrelated, setUnrelated] = useState(0);

  return (
    <section>
      <h2>Render count</h2>
      <button
        data-testid="cursor-force-rerender"
        onClick={() => {
          setUnrelated((value) => value + 1);
        }}
        type="button"
      >
        Force re-render: {unrelated}
      </button>
      {/*
        The Profiler commits once per commit of this subtree. Pointer movement,
        state resolution, and echo lifecycles must never produce one.
      */}
      <Profiler
        id="cursor"
        onRender={() => {
          bump("__scoutUiCursorCommits");
        }}
      >
        <StickerCursor
          clickFeedback="echo"
          data-testid="render-count-cursor"
          style={boxStyle}
          visuals={visuals}
        >
          <RenderProbe />
          <button
            data-sticker-cursor="hover"
            data-testid="cursor-hover-target"
            type="button"
          >
            Hover state target
          </button>
        </StickerCursor>
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
        data-testid="cursor-toggle"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount" : "Mount"}
      </button>
      <button
        data-testid="cursor-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount
      </button>
      <p data-testid="cursor-cycle">{cycle}</p>
      {mounted ? (
        <div data-testid="cursor-mounted" key={cycle}>
          <StrictEffectProbe />
          <StickerCursor
            clickFeedback="echo"
            data-testid="lifecycle-cursor"
            style={boxStyle}
            visuals={visuals}
          >
            <p>Strict lifecycle cursor</p>
          </StickerCursor>
        </div>
      ) : null}
    </section>
  );
}

function App() {
  return (
    <main>
      <h1>Cursor render count and lifecycle</h1>
      <RenderCountPanel />
      <LifecyclePanel />
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("Cursor render-count fixture root element is missing");
}

// Strict Mode wraps the whole tree, matching the arrangement already proven
// to trigger React's development-build setup/cleanup replay.
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
