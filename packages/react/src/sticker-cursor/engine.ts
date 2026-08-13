import { type AssetRegistry, createAssetRegistry } from "./assets.js";
import {
  ECHO_LIFETIME_MS,
  type Hotspot,
  MAX_ECHO_NODES,
  approach,
  hasSettled,
  hotspotOffsetPercent,
  instantVelocity,
  normalizeHotspot,
  smoothVelocity,
  smoothingFactor,
  tiltFromVelocity,
} from "./cursor-math.js";
import {
  type CursorBypassReason,
  EDITABLE_SELECTOR,
  NATIVE_AFFORDANCE_SELECTOR,
  NATIVE_MEDIA_SELECTOR,
  NATIVE_STATE,
  canAttachCursor,
  isEditableInput,
  resolveCursorState,
} from "./state.js";

export interface ResolvedCursorVisual {
  readonly src: string;
  readonly hotspot: Hotspot;
}

export interface ResolvedCursorOptions {
  readonly visuals: ReadonlyMap<string, ResolvedCursorVisual>;
  readonly enabled: boolean;
  readonly size: number;
  readonly tilt: number;
  readonly smoothing: number;
  readonly clickFeedback: "none" | "press" | "echo";
  readonly hideNative: "when-ready" | "never";
  readonly stateAttribute: string;
  readonly disabledSelector: string | undefined;
  readonly reducedMotion: "system" | "always";
}

export interface CursorEngineElements {
  container: HTMLElement;
  layer: HTMLElement;
  visual: HTMLImageElement;
}

export interface StickerCursorEngine {
  destroy(): void;
  /** Current engine mode. Exposed for fixtures and tests, not for consumers. */
  readonly mode: "inert" | "active";
}

function matches(query: string) {
  return (
    typeof window.matchMedia === "function" && window.matchMedia(query).matches
  );
}

/** Attribute names are interpolated into selectors, so keep them well formed. */
function sanitizeAttribute(name: string) {
  return /^[a-z][a-z0-9-]*$/u.test(name) ? name : "data-sticker-cursor";
}

/**
 * Create the imperative cursor engine.
 *
 * Every browser capability query, listener, and observer is established here
 * rather than at module evaluation, so the package stays safe to import on a
 * server.
 */
export function createStickerCursorEngine(
  { container, layer, visual }: CursorEngineElements,
  options: ResolvedCursorOptions,
): StickerCursorEngine {
  const lifecycle = new AbortController();
  const stateAttribute = sanitizeAttribute(options.stateAttribute);
  const nativeStateSelector = `[${stateAttribute}="${NATIVE_STATE}"]`;
  const stateSelector = `[${stateAttribute}]`;
  const availableStates = new Set(options.visuals.keys());
  const defaultVisual = options.visuals.get("default");

  let pointerListeners: AbortController | null = null;
  let mode: "inert" | "active" = "inert";
  let destroyed = false;

  let frameHandle = 0;
  let lastFrameTime = 0;
  let hasSample = false;
  let inside = false;

  let sampleClientX = 0;
  let sampleClientY = 0;
  let targetX = 0;
  let targetY = 0;
  let renderedX = 0;
  let renderedY = 0;
  let velocityX = 0;
  let tilt = 0;
  let targetTilt = 0;

  let pressed = false;
  let currentState = "default";
  let currentSrc = "";
  let bypassed = false;

  let geometryDirty = true;
  let originX = 0;
  let originY = 0;

  // ------------------------------------------------------------- assets ---

  const assets: AssetRegistry = createAssetRegistry({
    onSettled: () => {
      if (destroyed) {
        return;
      }

      // Readiness may have changed in either direction; re-apply without ever
      // touching React. `force` skips the per-target cache, which is keyed on
      // the target rather than on readiness.
      applyVisual(currentState, true);
      if (inside && !bypassed) {
        setVisible(isReady());
      }
      updateNativeCursorPolicy();
    },
  });

  /** Ready means the default artwork decoded: it is the guaranteed fallback. */
  function isReady() {
    return defaultVisual !== undefined && assets.isReady(defaultVisual.src);
  }

  // ----------------------------------------------------------- geometry ---

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

  // -------------------------------------------------------------- visual ---

  function writeHotspot(hotspot: Hotspot) {
    const offset = hotspotOffsetPercent(hotspot);
    const style = visual.style;
    style.setProperty(
      "--sui-sticker-cursor-internal-hotspot-x",
      `${offset.x.toFixed(3)}%`,
    );
    style.setProperty(
      "--sui-sticker-cursor-internal-hotspot-y",
      `${offset.y.toFixed(3)}%`,
    );
  }

  /**
   * Swap the displayed artwork.
   *
   * A state whose artwork has not decoded yet falls back to the default rather
   * than showing nothing, so a slow or failed secondary asset can never leave
   * the region without a visible cursor.
   */
  function applyVisual(state: string, force = false) {
    if (!force && state === currentState) {
      return;
    }

    currentState = state;
    const requested = options.visuals.get(state) ?? defaultVisual;
    const usable =
      requested !== undefined && assets.isReady(requested.src)
        ? requested
        : defaultVisual !== undefined && assets.isReady(defaultVisual.src)
          ? defaultVisual
          : undefined;

    layer.setAttribute("data-state", state);

    if (usable === undefined) {
      visual.removeAttribute("src");
      currentSrc = "";
      return;
    }

    if (usable.src !== currentSrc) {
      visual.setAttribute("src", usable.src);
      currentSrc = usable.src;
    }

    // The hotspot always follows the artwork actually being displayed, so a
    // fallback cannot leave the previous state's hotspot in place.
    writeHotspot(usable.hotspot);
  }

  function setVisible(visible: boolean) {
    layer.setAttribute("data-visible", visible ? "true" : "false");
  }

  /**
   * The native cursor is hidden only while every condition holds at once:
   * attached, inside, not bypassed, artwork decoded, and the policy allows it.
   */
  function updateNativeCursorPolicy() {
    const hide =
      mode === "active" &&
      inside &&
      !bypassed &&
      isReady() &&
      options.hideNative === "when-ready";

    container.setAttribute("data-native-hidden", hide ? "true" : "false");
  }

  // ---------------------------------------------------------------- echo ---

  interface EchoSlot {
    element: HTMLElement;
    animation: Animation | null;
    busy: boolean;
  }

  const echoes: EchoSlot[] = [];

  function createEchoPool() {
    if (options.clickFeedback !== "echo") {
      return;
    }

    for (let index = 0; index < MAX_ECHO_NODES; index += 1) {
      const element = document.createElement("span");
      element.className = "sui-sticker-cursor-echo";
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("data-sui-cursor-echo", "");
      layer.append(element);
      echoes.push({ animation: null, busy: false, element });
    }
  }

  function spawnEcho() {
    if (options.clickFeedback !== "echo" || echoes.length === 0) {
      return;
    }

    // Reuse the first free slot, otherwise recycle slot zero. The pool never
    // grows, so sustained clicking cannot increase DOM count.
    const slot = echoes.find((candidate) => !candidate.busy) ?? echoes[0];
    if (slot === undefined) {
      return;
    }

    slot.animation?.cancel();
    slot.busy = true;
    slot.element.style.setProperty(
      "--sui-sticker-cursor-internal-x",
      `${renderedX.toFixed(2)}px`,
    );
    slot.element.style.setProperty(
      "--sui-sticker-cursor-internal-y",
      `${renderedY.toFixed(2)}px`,
    );

    if (typeof slot.element.animate !== "function") {
      slot.busy = false;
      return;
    }

    const animation = slot.element.animate(
      [
        { offset: 0, opacity: 0.55, scale: "0.4" },
        { offset: 1, opacity: 0, scale: "1.6" },
      ],
      { duration: ECHO_LIFETIME_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );

    slot.animation = animation;
    animation.addEventListener(
      "finish",
      () => {
        slot.busy = false;
      },
      { once: true },
    );
    animation.addEventListener(
      "cancel",
      () => {
        slot.busy = false;
      },
      { once: true },
    );
  }

  function clearEchoes() {
    for (const slot of echoes) {
      slot.animation?.cancel();
      slot.animation = null;
      slot.busy = false;
    }
  }

  // ------------------------------------------------------ state resolution ---

  function resolveBypass(target: Element): CursorBypassReason | undefined {
    if (
      options.disabledSelector !== undefined &&
      options.disabledSelector.length > 0 &&
      target.closest(options.disabledSelector) !== null
    ) {
      return "disabled-selector";
    }

    // Checked independently of the nearest annotated ancestor so that a nested
    // custom state can never escape an explicit native region.
    if (target.closest(nativeStateSelector) !== null) {
      return "native-region";
    }

    if (target.closest(NATIVE_AFFORDANCE_SELECTOR) !== null) {
      return "native-region";
    }

    if (target.closest(NATIVE_MEDIA_SELECTOR) !== null) {
      return "media";
    }

    const editable = target.closest(EDITABLE_SELECTOR);
    if (editable !== null) {
      if (editable instanceof HTMLInputElement) {
        return isEditableInput(editable.getAttribute("type"))
          ? "editable"
          : undefined;
      }

      return "editable";
    }

    // `resize` is a computed style, not a selector, so it cannot be matched by
    // `closest`. Reading it is only affordable because resolution is cached per
    // target below; otherwise this would be a layout read on every move.
    if (
      target instanceof HTMLElement &&
      target !== document.documentElement &&
      getComputedStyle(target).resize !== "none"
    ) {
      return "resize-handle";
    }

    return undefined;
  }

  function resolveFromTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return resolveCursorState({
        attributeState: undefined,
        availableStates,
        bypass: undefined,
        pressed,
      });
    }

    const annotated = target.closest(stateSelector);
    const attributeState = annotated?.getAttribute(stateAttribute) ?? undefined;

    return resolveCursorState({
      attributeState,
      availableStates,
      bypass: resolveBypass(target),
      pressed,
    });
  }

  let cachedTarget: EventTarget | null = null;
  let cachedPressed = false;

  /**
   * Resolution is cached per (target, pressed) pair. A pointer move usually
   * stays over the same element, so the ancestor walk and the one computed
   * style read happen on element changes rather than on every sample.
   */
  function applyResolution(target: EventTarget | null, force = false) {
    if (!force && target === cachedTarget && pressed === cachedPressed) {
      return;
    }

    cachedTarget = target;
    cachedPressed = pressed;

    const resolution = resolveFromTarget(target);

    if (resolution.kind === "bypass") {
      // Always refresh the reason: moving straight from one bypass region into
      // a different one keeps `bypassed` true, and guarding this write would
      // leave the previous region's reason reported.
      layer.setAttribute("data-bypass", resolution.reason);

      if (!bypassed) {
        bypassed = true;
        setVisible(false);
        updateNativeCursorPolicy();
      }
      return;
    }

    if (bypassed) {
      bypassed = false;
      layer.removeAttribute("data-bypass");
    }

    applyVisual(resolution.state);
    setVisible(isReady());
    updateNativeCursorPolicy();
  }

  // ----------------------------------------------------------- frame loop ---

  function schedule() {
    if (frameHandle !== 0 || destroyed || mode !== "active") {
      return;
    }

    frameHandle = window.requestAnimationFrame(frame);
  }

  function frame(now: number) {
    frameHandle = 0;

    if (geometryDirty) {
      refreshGeometry();
    }

    targetX = sampleClientX - originX;
    targetY = sampleClientY - originY;

    const deltaMs = lastFrameTime === 0 ? 16 : now - lastFrameTime;
    lastFrameTime = now;

    const previousX = renderedX;
    const factor = smoothingFactor(options.smoothing, deltaMs);
    renderedX = approach(renderedX, targetX, factor);
    renderedY = approach(renderedY, targetY, factor);

    velocityX = smoothVelocity(
      velocityX,
      instantVelocity(renderedX - previousX, deltaMs),
    );
    targetTilt = tiltFromVelocity(velocityX, options.tilt);
    tilt = approach(tilt, targetTilt, factor);

    const style = visual.style;
    style.setProperty(
      "--sui-sticker-cursor-internal-x",
      `${renderedX.toFixed(2)}px`,
    );
    style.setProperty(
      "--sui-sticker-cursor-internal-y",
      `${renderedY.toFixed(2)}px`,
    );
    style.setProperty(
      "--sui-sticker-cursor-internal-tilt",
      `${tilt.toFixed(3)}deg`,
    );

    // The loop exists to converge, not to idle. Once position and rotation have
    // both arrived it stops scheduling entirely; a new sample restarts it.
    const positionDelta = Math.hypot(targetX - renderedX, targetY - renderedY);
    if (hasSettled(positionDelta, targetTilt - tilt, false)) {
      velocityX = 0;
      tilt = targetTilt;
      lastFrameTime = 0;
      return;
    }

    schedule();
  }

  // -------------------------------------------------------------- pointer ---

  function onPointerMove(event: PointerEvent) {
    // The only work a pointer move performs: capture the newest sample, resolve
    // the state, and request one frame. No React state is touched.
    sampleClientX = event.clientX;
    sampleClientY = event.clientY;

    if (!hasSample) {
      // The first sample after entry establishes position directly, so the
      // cursor never animates across the page from a stale location.
      if (geometryDirty) {
        refreshGeometry();
      }
      renderedX = sampleClientX - originX;
      renderedY = sampleClientY - originY;
      targetX = renderedX;
      targetY = renderedY;
      velocityX = 0;
      tilt = 0;
      lastFrameTime = 0;
      hasSample = true;
    }

    applyResolution(event.target);
    schedule();
  }

  function onPointerEnter(event: PointerEvent) {
    inside = true;
    hasSample = false;
    markGeometryDirty();
    onPointerMove(event);
  }

  function onPointerLeave() {
    inside = false;
    hasSample = false;
    pressed = false;
    bypassed = false;
    velocityX = 0;
    cachedTarget = null;
    cachedPressed = false;
    layer.removeAttribute("data-bypass");
    layer.setAttribute("data-pressed", "false");
    setVisible(false);
    updateNativeCursorPolicy();
    clearEchoes();

    if (frameHandle !== 0) {
      window.cancelAnimationFrame(frameHandle);
      frameHandle = 0;
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || bypassed) {
      return;
    }

    pressed = true;
    if (options.clickFeedback === "press" || options.clickFeedback === "echo") {
      layer.setAttribute("data-pressed", "true");
    }
    spawnEcho();
    applyResolution(event.target);
    schedule();
  }

  function onPointerUp(event: PointerEvent) {
    if (!pressed) {
      return;
    }

    pressed = false;
    layer.setAttribute("data-pressed", "false");
    applyResolution(event.target);
    schedule();
  }

  // --------------------------------------------------------- capabilities ---

  function detachPointerListeners() {
    pointerListeners?.abort();
    pointerListeners = null;
  }

  function attachPointerListeners() {
    const controller = new AbortController();
    pointerListeners = controller;
    const listener = { passive: true, signal: controller.signal } as const;

    container.addEventListener("pointerenter", onPointerEnter, listener);
    container.addEventListener("pointermove", onPointerMove, listener);
    container.addEventListener("pointerleave", onPointerLeave, listener);
    container.addEventListener("pointerdown", onPointerDown, listener);
    container.addEventListener("pointerup", onPointerUp, listener);
    container.addEventListener("pointercancel", onPointerLeave, listener);
  }

  function applyMode() {
    const next = canAttachCursor({
      enabled: options.enabled && defaultVisual !== undefined,
      finePointer: matches("(pointer: fine)"),
      hover: matches("(hover: hover)"),
      reducedMotion:
        options.reducedMotion === "always" ||
        matches("(prefers-reduced-motion: reduce)"),
    })
      ? "active"
      : "inert";

    if (next === mode) {
      return;
    }

    mode = next;
    layer.setAttribute("data-mode", mode);

    if (mode === "inert") {
      // A capability change mid-session must return the native cursor at once.
      detachPointerListeners();
      onPointerLeave();
      return;
    }

    markGeometryDirty();
    attachPointerListeners();
  }

  // ------------------------------------------------------------------ init ---

  createEchoPool();
  layer.setAttribute("data-mode", "inert");
  layer.setAttribute("data-visible", "false");
  layer.setAttribute("data-pressed", "false");
  container.setAttribute("data-native-hidden", "false");
  writeHotspot(defaultVisual?.hotspot ?? normalizeHotspot(undefined));
  visual.style.setProperty(
    "--sui-sticker-cursor-internal-size",
    `${String(options.size)}px`,
  );

  const signal = lifecycle.signal;

  const resizeObserver = new ResizeObserver(markGeometryDirty);
  resizeObserver.observe(container);

  window.addEventListener("resize", markGeometryDirty, {
    passive: true,
    signal,
  });
  window.addEventListener("scroll", markGeometryDirty, {
    capture: true,
    passive: true,
    signal,
  });
  window.addEventListener(
    "blur",
    () => {
      // Focus left the window: the last coordinates are no longer trustworthy.
      onPointerLeave();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") {
        onPointerLeave();
      } else {
        markGeometryDirty();
      }
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
    assets.load([...options.visuals.values()].map(({ src }) => src));
  }

  applyMode();

  return {
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      detachPointerListeners();
      lifecycle.abort();
      resizeObserver.disconnect();
      assets.dispose();
      clearEchoes();

      if (frameHandle !== 0) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = 0;
      }

      for (const slot of echoes) {
        slot.element.remove();
      }
      echoes.length = 0;

      // The native cursor must be back before the component disappears.
      container.removeAttribute("data-native-hidden");
      layer.removeAttribute("data-mode");
      layer.removeAttribute("data-bypass");
      layer.setAttribute("data-visible", "false");
      visual.removeAttribute("src");
    },
    get mode() {
      return mode;
    },
  };
}
