"use client";

import { StickerPeel } from "@scout-ui/react";
import { StickerPeel as SubpathStickerPeel } from "@scout-ui/react/sticker-peel";
import { useState } from "react";

const origins = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

function Front({ label = "THE FIELD NOTE" }: { label?: string }) {
  return (
    <div className="peel-note-front">
      <span>SCOUT UI / M8</span>
      <strong>{label}</strong>
      <a href="#peel-fixture-end">Read the front link</a>
    </div>
  );
}

function Back({ label = "A SECOND LAYER" }: { label?: string }) {
  return (
    <div className="peel-note-back">
      <span>REVEALED</span>
      <strong>{label}</strong>
      <button type="button">Use the back action</button>
    </div>
  );
}

export function PeelSurfaces() {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [controlledRequests, setControlledRequests] = useState(0);
  const [refusedRequests, setRefusedRequests] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [runtimeDisabled, setRuntimeDisabled] = useState(false);

  return (
    <main className="sui-theme peel-gallery">
      <header className="peel-hero">
        <p>SCOUT UI ENGINEERING SURFACE</p>
        <h1>Lift the corner. Keep the meaning.</h1>
        <p>
          Semantic disclosure first; optional pointer drag is a tactile layer on
          top.
        </p>
      </header>

      <section aria-labelledby="peel-core-heading" className="peel-board">
        <h2 id="peel-core-heading">Core states</h2>
        <div className="peel-grid">
          <StickerPeel
            back={<Back />}
            data-testid="peel-closed"
            drag
            front={<Front />}
          />
          <StickerPeel
            back={<Back label="OPEN AND STABLE" />}
            data-testid="peel-open"
            defaultOpen
            drag
            front={<Front label="OPEN NOTE" />}
            origin="top-left"
          />
          <StickerPeel
            back={<Back label="DISABLED BACK" />}
            data-testid="peel-disabled"
            disabled
            front={<Front label="DISABLED" />}
          />
          <StickerPeel
            back={<Back label="NO DRAG REQUIRED" />}
            data-testid="peel-reduced"
            drag
            front={<Front label="STATIC MOTION POLICY" />}
            reducedMotion="always"
          />
        </div>
      </section>

      <section aria-labelledby="peel-origin-heading" className="peel-board">
        <h2 id="peel-origin-heading">Four authored origins</h2>
        <div className="peel-grid peel-origin-grid">
          {origins.map((origin) => (
            <SubpathStickerPeel
              back={<Back label={origin.toUpperCase()} />}
              data-testid={`peel-origin-${origin}`}
              drag
              front={<Front label={origin.toUpperCase()} />}
              key={origin}
              origin={origin}
              peelSize={44}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="peel-control-heading" className="peel-board">
        <h2 id="peel-control-heading">State and focus integrity</h2>
        <div className="peel-grid">
          <div>
            <button
              data-testid="controlled-external-toggle"
              onClick={() => {
                setControlledOpen((value) => !value);
              }}
              type="button"
            >
              External toggle
            </button>
            <p data-testid="controlled-callback-count">{controlledRequests}</p>
            <StickerPeel
              back={<Back label="CONTROLLED BACK" />}
              data-testid="peel-controlled"
              drag
              front={<Front label="CONTROLLED FRONT" />}
              onOpenChange={(nextOpen) => {
                setControlledRequests((value) => value + 1);
                setControlledOpen(nextOpen);
              }}
              open={controlledOpen}
              origin="bottom-right"
            />
          </div>
          <div>
            <p data-testid="refused-callback-count">{refusedRequests}</p>
            <StickerPeel
              back={<Back label="PARENT REFUSED" />}
              data-testid="peel-refused"
              front={<Front label="CONTROLLED REFUSAL" />}
              onOpenChange={() => {
                setRefusedRequests((value) => value + 1);
              }}
              open={false}
            />
          </div>
          <div>
            <button
              data-testid="runtime-disabled-toggle"
              onClick={() => {
                setRuntimeDisabled((value) => !value);
              }}
              type="button"
            >
              Toggle disabled
            </button>
            <StickerPeel
              back={<Back label="RUNTIME DISABLED BACK" />}
              data-testid="peel-runtime-disabled"
              disabled={runtimeDisabled}
              drag
              front={<Front label="RUNTIME DISABLED" />}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="peel-content-heading" className="peel-board">
        <h2 id="peel-content-heading">Content stability and reflow</h2>
        <div className="peel-grid">
          <div>
            <button
              data-testid="load-back-content"
              onClick={() => {
                setLoaded(true);
              }}
              type="button"
            >
              Resolve back content
            </button>
            <StickerPeel
              back={
                loaded ? (
                  <div data-testid="loaded-back-content">
                    Loaded content preserved in the open layer.
                  </div>
                ) : (
                  <div aria-live="polite" data-testid="loading-back-content">
                    Loading revealed details…
                  </div>
                )
              }
              data-testid="peel-loading"
              defaultOpen
              front={<Front label="ASYNC CONTENT" />}
            />
          </div>
          <StickerPeel
            back={
              <div>
                <strong>Readable revealed layer</strong>
                <p>
                  Longer consumer content remains ordinary flowing text. It is
                  never warped onto a permanently tilted plane, and it can wrap
                  at narrow widths without producing horizontal page overflow.
                </p>
              </div>
            }
            className="peel-long"
            data-testid="peel-long"
            front={
              <div>
                <strong>Long front content</strong>
                <p>
                  A few lines are supported even though StickerPeel is not a
                  container for long documents or required instructions.
                </p>
              </div>
            }
            origin="bottom-left"
            peelSize="clamp(2.75rem, 10vw, 4.5rem)"
          />
        </div>
      </section>
      <div id="peel-fixture-end" />
    </main>
  );
}
