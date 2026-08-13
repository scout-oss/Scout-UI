import { StickerNavbar } from "@scout-ui/react/sticker-navbar";
import { Profiler, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/react/styles.css";
import "./fixture.css";

interface NavbarMetrics {
  childRenders: number;
  commits: number;
  listenerAdds: number;
  listenerRemoves: number;
  maxPendingFrames: number;
  pendingFrames: number;
  scrollSamples: number;
  strictEffectRuns: number;
}

type NavbarWindow = Window & {
  __navbarMetrics: NavbarMetrics;
  __resetNavbarMetrics: () => void;
};

const metrics: NavbarMetrics = {
  childRenders: 0,
  commits: 0,
  listenerAdds: 0,
  listenerRemoves: 0,
  maxPendingFrames: 0,
  pendingFrames: 0,
  scrollSamples: 0,
  strictEffectRuns: 0,
};

const scope = window as unknown as NavbarWindow;
scope.__navbarMetrics = metrics;
scope.__resetNavbarMetrics = () => {
  metrics.childRenders = 0;
  metrics.commits = 0;
  metrics.maxPendingFrames = metrics.pendingFrames;
  metrics.scrollSamples = 0;
};

function bumpMetric(key: "childRenders" | "commits" | "strictEffectRuns") {
  scope.__navbarMetrics[key] += 1;
}

// This development-only fixture instruments before React mounts. Production
// code remains free of test globals while the browser proof can observe frame
// coalescing and listener setup directly.
const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
const pendingHandles = new Set<number>();
window.requestAnimationFrame = (callback) => {
  let handle = 0;
  handle = nativeRequestAnimationFrame((timestamp) => {
    pendingHandles.delete(handle);
    metrics.pendingFrames = pendingHandles.size;
    callback(timestamp);
  });
  pendingHandles.add(handle);
  metrics.pendingFrames = pendingHandles.size;
  metrics.maxPendingFrames = Math.max(
    metrics.maxPendingFrames,
    metrics.pendingFrames,
  );
  return handle;
};
window.cancelAnimationFrame = (handle) => {
  pendingHandles.delete(handle);
  metrics.pendingFrames = pendingHandles.size;
  nativeCancelAnimationFrame(handle);
};

const nativeAddEventListener = window.addEventListener.bind(window);
const nativeRemoveEventListener = window.removeEventListener.bind(window);
window.addEventListener = ((
  ...args: Parameters<Window["addEventListener"]>
) => {
  if (args[0] === "scroll") metrics.listenerAdds += 1;
  nativeAddEventListener(...args);
}) as Window["addEventListener"];
window.removeEventListener = ((
  ...args: Parameters<Window["removeEventListener"]>
) => {
  if (args[0] === "scroll") metrics.listenerRemoves += 1;
  nativeRemoveEventListener(...args);
}) as Window["removeEventListener"];
nativeAddEventListener(
  "scroll",
  () => {
    metrics.scrollSamples += 1;
  },
  { passive: true },
);

const items = [
  { id: "start", label: "Start", href: "#navbar-start" },
  { id: "middle", label: "Middle", href: "#navbar-middle" },
  { id: "finish", label: "Finish", href: "#navbar-finish" },
] as const;

function RenderProbe() {
  bumpMetric("childRenders");
  return <a href="#navbar-start">COUNTED BRAND</a>;
}

function StrictEffectProbe() {
  useEffect(() => {
    bumpMetric("strictEffectRuns");
  }, []);
  return null;
}

function NavbarUnderTest({ lifecycle = false }: { lifecycle?: boolean }) {
  return (
    <StickerNavbar
      activeId="middle"
      action={<a href="#navbar-finish">Finish</a>}
      brand={lifecycle ? "LIFECYCLE BRAND" : <RenderProbe />}
      data-testid={lifecycle ? "lifecycle-navbar" : "render-count-navbar"}
      items={items}
      showScrollProgress
      sticky
      switcher={<button type="button">Workspace</button>}
    />
  );
}

function RenderCountPanel() {
  return (
    <Profiler
      id="navbar"
      onRender={() => {
        bumpMetric("commits");
      }}
    >
      <NavbarUnderTest />
    </Profiler>
  );
}

function LifecyclePanel() {
  const [mounted, setMounted] = useState(true);
  const [cycle, setCycle] = useState(0);

  return (
    <section>
      <button
        data-testid="navbar-toggle-mount"
        onClick={() => {
          setMounted((value) => !value);
        }}
        type="button"
      >
        {mounted ? "Unmount Navbar" : "Mount Navbar"}
      </button>
      <button
        data-testid="navbar-remount"
        onClick={() => {
          setCycle((value) => value + 1);
        }}
        type="button"
      >
        Remount Navbar
      </button>
      <output data-testid="navbar-cycle">{cycle}</output>
      {mounted ? (
        <div data-testid="navbar-mounted" key={cycle}>
          <StrictEffectProbe />
          <NavbarUnderTest lifecycle />
        </div>
      ) : null}
    </section>
  );
}

function InvalidRenderLinkPanel() {
  return (
    <section>
      <h2>Development renderLink diagnostic</h2>
      <StickerNavbar
        brand="INVALID LINK PROBE"
        data-testid="invalid-render-link-navbar"
        items={items.slice(0, 2)}
        renderLink={(item, linkProps) =>
          item.id === "start" ? (
            <button
              className={linkProps.className}
              data-invalid-navbar-link="button"
              type="button"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={linkProps.className}
              data-invalid-navbar-link="span"
            >
              {item.label}
            </span>
          )
        }
      />
    </section>
  );
}

function App() {
  return (
    <main className="sui-theme navbar-performance-fixture">
      <h1>Navbar progress and lifecycle instrumentation</h1>
      <RenderCountPanel />
      <LifecyclePanel />
      <InvalidRenderLinkPanel />
      <section id="navbar-start">
        <h2>Start</h2>
      </section>
      <section id="navbar-middle">
        <h2>Middle</h2>
      </section>
      <section id="navbar-finish">
        <h2>Finish</h2>
      </section>
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");
if (root === null)
  throw new Error("Navbar render-count fixture root is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
