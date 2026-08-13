import { StickerStack } from "@scout-ui/react/sticker-stack";
import { Profiler, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/react/styles.css";
import "./fixture.css";

type StackCounter =
  | "__scoutUiStackChildRenders"
  | "__scoutUiStackCommits"
  | "__scoutUiStackIndexChanges"
  | "__scoutUiStackStrictEffectRuns";

type StackWindow = Window & Partial<Record<StackCounter, number>>;

const items = Array.from({ length: 20 }, (_, index) => ({
  id: `stack-${String(index)}`,
  title: `Story ${String(index + 1)}`,
}));

function bump(key: StackCounter) {
  const scope = window as StackWindow;
  scope[key] = (scope[key] ?? 0) + 1;
}

function RenderProbe({ title }: { title: string }) {
  bump("__scoutUiStackChildRenders");
  return (
    <article>
      <h2>{title}</h2>
      <button type="button">Card action</button>
    </article>
  );
}

function StrictEffectProbe() {
  useEffect(() => {
    bump("__scoutUiStackStrictEffectRuns");
  }, []);
  return null;
}

function RenderCountPanel() {
  const [unrelated, setUnrelated] = useState(0);
  return (
    <section>
      <h2>Render count</h2>
      <button
        data-testid="stack-force-rerender"
        onClick={() => {
          setUnrelated((value) => value + 1);
        }}
        type="button"
      >
        Force re-render: {unrelated}
      </button>
      <Profiler
        id="stack"
        onRender={() => {
          bump("__scoutUiStackCommits");
        }}
      >
        <StickerStack
          data-testid="render-count-stack"
          drag
          getKey={(item) => item.id}
          items={items}
          onIndexChange={() => {
            bump("__scoutUiStackIndexChanges");
          }}
          renderItem={(item) => <RenderProbe title={item.title} />}
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
        data-testid="stack-toggle-mount"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount" : "Mount"}
      </button>
      <button
        data-testid="stack-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount
      </button>
      <p data-testid="stack-cycle">{cycle}</p>
      {mounted ? (
        <div data-testid="stack-mounted" key={cycle}>
          <StrictEffectProbe />
          <StickerStack
            data-testid="lifecycle-stack"
            drag
            getKey={(item) => item.id}
            items={items}
            renderItem={(item) => item.title}
          />
        </div>
      ) : null}
    </section>
  );
}

function App() {
  return (
    <main>
      <h1>Stack render count and lifecycle</h1>
      <RenderCountPanel />
      <LifecyclePanel />
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");
if (root === null)
  throw new Error("Stack render-count fixture root is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
