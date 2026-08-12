import {
  MAX_SPAWNS_PER_FRAME,
  instantVelocity,
  isDiscontinuity,
  planSegmentSpawns,
  pointDistance,
  resolveSpacing,
  smoothVelocity,
  valueInRange,
} from "./geometry.js";
import {
  acquireSlotIndex,
  createSlotRecords,
  resetSlotRecord,
  slotDrift,
  slotOpacity,
  slotProgress,
  slotScale,
  type TrailSlotRecord,
} from "./pool.js";
import { createRandom, createSourceSequencer } from "./sequence.js";
import type { ResolvedTrailOptions, StickerTrailController } from "./types.js";

/** Marks a pool node so the engine can adopt server-rendered slots. */
export const TRAIL_SLOT_ATTRIBUTE = "data-sui-trail-slot";

/** Maximum pointer travel, in pixels, still treated as a tap. */
const TAP_TRAVEL_LIMIT = 10;
/** Maximum press duration, in milliseconds, still treated as a tap. */
const TAP_DURATION_LIMIT = 500;

export type TrailEngineMode = "inert" | "continuous" | "tap";

export interface TrailEngineElements {
  container: HTMLElement;
  layer: HTMLElement;
}

export interface StickerTrailEngine extends StickerTrailController {
  destroy(): void;
  /** Current engine mode. Exposed for fixtures and tests, not for consumers. */
  readonly mode: TrailEngineMode;
}

function isDevelopment() {
  const scope = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };

  return scope.process?.env?.NODE_ENV !== "production";
}

function matches(query: string) {
  return (
    typeof window.matchMedia === "function" && window.matchMedia(query).matches
  );
}

/**
 * Create the imperative trail engine for one container/layer pair.
 *
 * Every browser capability query, listener, and observer is established here,
 * never at module evaluation, so the package stays safe to import on a server.
 */
export function createStickerTrailEngine(
  { container, layer }: TrailEngineElements,
  options: ResolvedTrailOptions,
): StickerTrailEngine {
  const lifecycle = new AbortController();
  const random = createRandom(options.seed);
  const sequencer = createSourceSequencer(
    options.stickers.length,
    options.sequence,
    random,
  );
  const records: TrailSlotRecord[] = [];
  const nodes: HTMLImageElement[] = [];

  let pointerListeners: AbortController | null = null;
  let ownsPool = false;
  let mode: TrailEngineMode = "inert";
  let destroyed = false;

  let frameHandle = 0;
  let pendingSample = false;
  let pendingTap = false;
  // Samples are stored in viewport coordinates and converted to container-local
  // coordinates inside the frame, after any pending geometry refresh. Converting
  // in the event handler would use a stale origin on the first sample after a
  // scroll, resize, or pointer entry.
  let sampleClientX = 0;
  let sampleClientY = 0;
  let sampleX = 0;
  let sampleY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let hasLastSample = false;
  let carried = 0;
  let velocity = 0;
  let activeCount = 0;

  let geometryDirty = true;
  let originX = 0;
  let originY = 0;
  let visible = true;
  let paused = false;

  let pressX = 0;
  let pressY = 0;
  let pressTime = 0;
  let pressing = false;

  if (isDevelopment() && options.stickers.length === 0 && options.enabled) {
    console.warn(
      "[@scout-ui/sticker-trail] `stickers` is empty, so the trail will render nothing.",
    );
  }

  // ---------------------------------------------------------------- pool ---

  function ensurePool() {
    const existing = layer.querySelectorAll<HTMLImageElement>(
      `[${TRAIL_SLOT_ATTRIBUTE}]`,
    );

    if (existing.length === options.maxActive) {
      // Adopt the server-rendered pool so hydration is not disturbed.
      ownsPool = false;
      nodes.push(...existing);
    } else {
      ownsPool = true;
      for (const node of existing) {
        node.remove();
      }

      for (let index = 0; index < options.maxActive; index += 1) {
        const node = document.createElement("img");
        node.className = "sui-trail-item";
        node.alt = "";
        node.decoding = "async";
        node.draggable = false;
        node.setAttribute(TRAIL_SLOT_ATTRIBUTE, "");
        node.setAttribute("data-active", "false");
        layer.append(node);
        nodes.push(node);
      }
    }

    records.push(...createSlotRecords(nodes.length));
  }

  function preloadSources() {
    for (const sticker of options.stickers) {
      const image = new Image();
      image.decoding = "async";
      image.src = sticker.src;
    }
  }

  // ------------------------------------------------------------ geometry ---

  function refreshGeometry() {
    const rect = container.getBoundingClientRect();
    // Absolutely positioned layers resolve against the padding box, so the
    // border must be subtracted; a scrolling container shifts its own content.
    originX = rect.left + container.clientLeft - container.scrollLeft;
    originY = rect.top + container.clientTop - container.scrollTop;
    geometryDirty = false;
  }

  function markGeometryDirty() {
    geometryDirty = true;
  }

  // ------------------------------------------------------------ lifecycle ---

  function deactivate(index: number) {
    const record = records[index];
    const node = nodes[index];
    if (record === undefined || node === undefined || !record.active) {
      return;
    }

    resetSlotRecord(record);
    activeCount -= 1;
    node.setAttribute("data-active", "false");
    node.removeAttribute("data-exit");
    node.style.setProperty("--sui-trail-internal-opacity", "0");
    // `src` is intentionally retained: the slot is fully inert while inactive,
    // and keeping the decoded image avoids a re-decode on every recycle.
  }

  function activate(x: number, y: number, now: number) {
    const sourceIndex = sequencer.next();
    const source = options.stickers[sourceIndex];
    if (source === undefined) {
      return;
    }

    const index = acquireSlotIndex(records);
    const record = records[index];
    const node = nodes[index];
    if (record === undefined || node === undefined) {
      return;
    }

    if (record.active) {
      deactivate(index);
    }

    record.active = true;
    record.birth = now;
    record.lifetime = options.lifetime;
    record.sourceIndex = sourceIndex;
    record.x = x;
    record.y = y;
    record.size = valueInRange(options.size, random());
    record.rotation = valueInRange(options.rotation, random());
    record.scaleBase = valueInRange(options.scale, random());
    record.drift = options.drift;
    record.exit = options.exit;
    activeCount += 1;

    if (node.getAttribute("src") !== source.src) {
      node.setAttribute("src", source.src);
    }

    node.setAttribute("data-exit", record.exit);
    node.setAttribute("data-active", "true");

    const style = node.style;
    style.setProperty("--sui-trail-internal-x", `${String(Math.round(x))}px`);
    style.setProperty("--sui-trail-internal-y", `${String(Math.round(y))}px`);
    style.setProperty(
      "--sui-trail-internal-size",
      `${String(Math.round(record.size))}px`,
    );
    style.setProperty(
      "--sui-trail-internal-rotation",
      `${String(Math.round(record.rotation))}deg`,
    );

    writeSlot(index, now);
  }

  /** The only per-frame writes: lifecycle-derived scale, opacity, and drift. */
  function writeSlot(index: number, now: number) {
    const record = records[index];
    const node = nodes[index];
    if (record === undefined || node === undefined) {
      return;
    }

    const progress = slotProgress(record, now);
    if (progress >= 1) {
      deactivate(index);
      return;
    }

    const style = node.style;
    style.setProperty(
      "--sui-trail-internal-scale",
      slotScale(record, progress).toFixed(3),
    );
    style.setProperty(
      "--sui-trail-internal-opacity",
      slotOpacity(progress).toFixed(3),
    );

    if (record.exit === "float") {
      style.setProperty(
        "--sui-trail-internal-drift",
        `${slotDrift(record, progress).toFixed(2)}px`,
      );
    }
  }

  function clearAll() {
    for (let index = 0; index < records.length; index += 1) {
      deactivate(index);
    }

    carried = 0;
    velocity = 0;
    hasLastSample = false;
    pendingSample = false;
    pendingTap = false;
  }

  // ----------------------------------------------------------- frame loop ---

  function schedule() {
    if (frameHandle !== 0 || destroyed) {
      return;
    }

    frameHandle = window.requestAnimationFrame(frame);
  }

  /** Convert the stored viewport sample using the freshly refreshed origin. */
  function projectSample() {
    sampleX = sampleClientX - originX;
    sampleY = sampleClientY - originY;
  }

  function consumeSample(now: number) {
    projectSample();

    if (!hasLastSample) {
      lastX = sampleX;
      lastY = sampleY;
      lastTime = now;
      hasLastSample = true;
      carried = 0;
      return;
    }

    const travelled = pointDistance(sampleX - lastX, sampleY - lastY);
    const deltaTime = now - lastTime;

    // A teleport or a resumed tab restarts the segment from the new point
    // instead of interpolating an arbitrarily long history.
    if (isDiscontinuity(travelled, deltaTime)) {
      lastX = sampleX;
      lastY = sampleY;
      lastTime = now;
      carried = 0;
      velocity = 0;
      return;
    }

    velocity = smoothVelocity(velocity, instantVelocity(travelled, deltaTime));

    if (visible && !paused) {
      const plan = planSegmentSpawns({
        carried,
        fromX: lastX,
        fromY: lastY,
        maxSpawns: MAX_SPAWNS_PER_FRAME,
        spacing: resolveSpacing(
          options.spacing,
          velocity,
          options.velocityFactor,
        ),
        toX: sampleX,
        toY: sampleY,
      });

      for (const point of plan.points) {
        activate(point.x, point.y, now);
      }

      carried = plan.carried;
    } else {
      carried = 0;
    }

    lastX = sampleX;
    lastY = sampleY;
    lastTime = now;
  }

  function frame(now: number) {
    frameHandle = 0;

    if (geometryDirty) {
      refreshGeometry();
    }

    if (pendingTap) {
      pendingTap = false;
      if (visible && !paused) {
        projectSample();
        activate(sampleX, sampleY, now);
      }
    }

    if (pendingSample) {
      pendingSample = false;
      consumeSample(now);
    }

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      if (record?.active === true) {
        writeSlot(index, now);
      }
    }

    // Pending work is always consumed above, and only an event can set it
    // again — and every event schedules its own frame. So the loop continues
    // solely to finish the lives of active slots, and stops at rest.
    if (activeCount > 0) {
      schedule();
    }
  }

  // -------------------------------------------------------------- pointer ---

  function recordSample(event: PointerEvent) {
    // Viewport coordinates only. The frame projects them once the geometry is
    // guaranteed fresh.
    sampleClientX = event.clientX;
    sampleClientY = event.clientY;
  }

  function onPointerMove(event: PointerEvent) {
    // The only work a pointer move performs: capture the newest sample and
    // request one frame. No state update, no DOM write, no layout read.
    recordSample(event);
    pendingSample = true;
    schedule();
  }

  function onPointerEnter(event: PointerEvent) {
    markGeometryDirty();
    recordSample(event);
    hasLastSample = false;
    carried = 0;
    velocity = 0;
    pendingSample = true;
    schedule();
  }

  function onPointerLeave() {
    hasLastSample = false;
    pendingSample = false;
    carried = 0;
    velocity = 0;
  }

  function onPointerDown(event: PointerEvent) {
    pressing = true;
    pressX = event.clientX;
    pressY = event.clientY;
    pressTime = event.timeStamp;
  }

  function onPointerUp(event: PointerEvent) {
    if (!pressing) {
      return;
    }

    pressing = false;
    const travelled = pointDistance(
      event.clientX - pressX,
      event.clientY - pressY,
    );

    // A drag or a long press is a scroll or a gesture, not a tap.
    if (
      travelled > TAP_TRAVEL_LIMIT ||
      event.timeStamp - pressTime > TAP_DURATION_LIMIT
    ) {
      return;
    }

    recordSample(event);
    pendingTap = true;
    schedule();
  }

  function onPointerCancel() {
    pressing = false;
    pendingTap = false;
    onPointerLeave();
  }

  // --------------------------------------------------------- capabilities ---

  function resolveMode(): TrailEngineMode {
    if (!options.enabled || options.stickers.length === 0) {
      return "inert";
    }

    if (
      options.reducedMotion === "always" ||
      matches("(prefers-reduced-motion: reduce)")
    ) {
      return "inert";
    }

    if (matches("(pointer: fine)") && matches("(hover: hover)")) {
      return "continuous";
    }

    return options.touch === "tap" ? "tap" : "inert";
  }

  function detachPointerListeners() {
    pointerListeners?.abort();
    pointerListeners = null;
    clearAll();
  }

  function attachPointerListeners(next: TrailEngineMode) {
    const controller = new AbortController();
    pointerListeners = controller;
    const listener = { passive: true, signal: controller.signal } as const;

    if (next === "continuous") {
      container.addEventListener("pointerenter", onPointerEnter, listener);
      container.addEventListener("pointermove", onPointerMove, listener);
      container.addEventListener("pointerleave", onPointerLeave, listener);
      container.addEventListener("pointercancel", onPointerCancel, listener);
    } else {
      container.addEventListener("pointerdown", onPointerDown, listener);
      container.addEventListener("pointerup", onPointerUp, listener);
      container.addEventListener("pointercancel", onPointerCancel, listener);
    }
  }

  function applyMode() {
    const next = resolveMode();
    if (next === mode) {
      return;
    }

    detachPointerListeners();
    mode = next;
    layer.setAttribute("data-mode", mode);

    if (mode !== "inert") {
      markGeometryDirty();
      attachPointerListeners(mode);
    }
  }

  // ----------------------------------------------------------------- init ---

  ensurePool();
  layer.setAttribute("data-mode", "inert");

  const signal = lifecycle.signal;
  const resizeObserver = new ResizeObserver(markGeometryDirty);
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry !== undefined) {
      visible = entry.isIntersecting;
    }
  });
  intersectionObserver.observe(container);

  window.addEventListener("resize", markGeometryDirty, {
    passive: true,
    signal,
  });
  window.addEventListener("scroll", markGeometryDirty, {
    capture: true,
    passive: true,
    signal,
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      // Returning from a background tab must not replay a stale segment.
      hasLastSample = false;
      pendingSample = false;
      carried = 0;
      velocity = 0;
      markGeometryDirty();
    },
    { signal },
  );

  if (typeof window.matchMedia === "function") {
    for (const query of [
      "(prefers-reduced-motion: reduce)",
      "(pointer: fine)",
      "(hover: hover)",
    ]) {
      window
        .matchMedia(query)
        .addEventListener("change", applyMode, { signal });
    }
  }

  if (options.enabled) {
    preloadSources();
  }

  applyMode();

  return {
    clear: clearAll,
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      detachPointerListeners();
      lifecycle.abort();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      if (frameHandle !== 0) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = 0;
      }

      for (const node of nodes) {
        if (ownsPool) {
          node.remove();
        } else {
          node.setAttribute("data-active", "false");
          node.removeAttribute("data-exit");
          node.removeAttribute("style");
        }
      }

      layer.removeAttribute("data-mode");
      nodes.length = 0;
      records.length = 0;
      activeCount = 0;
    },
    get mode() {
      return mode;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
  };
}
