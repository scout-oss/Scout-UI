"use client";

import { StickerTrail } from "@scout-ui/react";
import { Profiler, useState } from "react";

import { probeSources } from "../trail/trail-sources";

interface RenderCountWindow extends Window {
  __scoutUiTrailCommits?: number;
  __scoutUiTrailChildRenders?: number;
}

function record(key: "__scoutUiTrailCommits" | "__scoutUiTrailChildRenders") {
  if (typeof window === "undefined") {
    return;
  }

  const scope = window as RenderCountWindow;
  scope[key] = (scope[key] ?? 0) + 1;
}

/**
 * Renders inside the trail's children, so it increments only if the trail
 * component itself re-rendered.
 */
function RenderProbe() {
  record("__scoutUiTrailChildRenders");
  return <p data-testid="render-probe">Underlying content</p>;
}

export function RenderCountTrail() {
  const [unrelated, setUnrelated] = useState(0);

  return (
    <section aria-labelledby="render-count-heading">
      <h2 id="render-count-heading">Render count</h2>
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
          record("__scoutUiTrailCommits");
        }}
      >
        <StickerTrail
          className="trail-box"
          data-testid="render-count-trail"
          lifetime={5000}
          maxActive={12}
          seed="render-count"
          spacing={{ min: 20, max: 20 }}
          stickers={probeSources}
        >
          <RenderProbe />
        </StickerTrail>
      </Profiler>
    </section>
  );
}
