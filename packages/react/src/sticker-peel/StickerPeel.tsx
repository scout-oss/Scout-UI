import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from "react";
import { useEffect, useId, useRef, useState } from "react";

import {
  joinClassNames,
  type ScoutMotionPolicy,
  type ScoutStyleProperties,
} from "../shared-types.js";
import {
  normalizeDragThreshold,
  normalizePeelSize,
  progressFromMovement,
  resolvePeelIntent,
  shouldCommitOpen,
  type PeelPoint,
} from "./peel-math.js";

export interface StickerPeelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange">, ScoutMotionPolicy {
  front: ReactNode;
  back: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  origin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Numeric values are CSS pixels and clamp to the supported 36–320px range. */
  peelSize?: number | string;
  drag?: boolean;
  /** Normalized open threshold. Values outside the supported 0.1–0.9 range clamp. */
  dragThreshold?: number;
  revealLabel?: string;
  closeLabel?: string;
  disabled?: boolean;
}

interface DragSession {
  baseProgress: number;
  height: number;
  intent: "pending" | "peel" | "scroll";
  lastProgress: number;
  lastTime: number;
  latest: PeelPoint;
  origin: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  pointerId: number;
  progress: number;
  start: PeelPoint;
  startedOpen: boolean;
  velocity: number;
  width: number;
}

function hasDocument(): boolean {
  return typeof document !== "undefined";
}

export function StickerPeel(props: StickerPeelProps) {
  const {
    back,
    className,
    closeLabel = "Stick back",
    defaultOpen = false,
    disabled = false,
    drag = false,
    dragThreshold,
    front,
    id,
    onKeyDown,
    onOpenChange,
    open,
    origin = "top-right",
    peelSize,
    reducedMotion = "system",
    style,
    revealLabel = "Peel to reveal",
    ...elementProps
  } = props;

  const generatedId = useId();
  const rootId = id ?? `sui-peel-${generatedId.replaceAll(":", "")}`;
  const backId = `${rootId}-back`;
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const semanticOpen = isControlled ? open : uncontrolledOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const dragEscapeRef = useRef<
    ((event: globalThis.KeyboardEvent) => void) | null
  >(null);
  const suppressClickRef = useRef(false);
  const semanticOpenRef = useRef(semanticOpen);

  const writeProgress = (progress: number) => {
    const root = rootRef.current;
    if (root === null) return;
    const value = String(progress);
    root.style.setProperty("--sui-peel-progress", value);
    root.dataset.peelProgress = value;
  };

  const cancelFrame = () => {
    if (
      frameRef.current !== null &&
      typeof cancelAnimationFrame === "function"
    ) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
    rootRef.current?.setAttribute("data-peel-frame-pending", "false");
  };

  const releaseCapture = (session: DragSession) => {
    const toggle = toggleRef.current;
    if (toggle?.hasPointerCapture(session.pointerId) === true) {
      toggle.releasePointerCapture(session.pointerId);
    }
  };

  const restoreSemanticProgress = () => {
    writeProgress(semanticOpenRef.current ? 1 : 0);
  };

  const removeDragEscapeListener = () => {
    const listener = dragEscapeRef.current;
    if (listener !== null && hasDocument()) {
      document.removeEventListener("keydown", listener);
    }
    dragEscapeRef.current = null;
  };

  const cancelDrag = (suppressClick = false) => {
    const session = dragRef.current;
    if (session === null) return;
    cancelFrame();
    removeDragEscapeListener();
    releaseCapture(session);
    dragRef.current = null;
    rootRef.current?.setAttribute("data-dragging", "false");
    if (suppressClick) suppressClickRef.current = true;
    restoreSemanticProgress();
  };

  const focusToggleBeforeLayerChange = (nextOpen: boolean) => {
    if (!hasDocument()) return;
    const layerBecomingInactive = nextOpen ? frontRef.current : backRef.current;
    if (
      layerBecomingInactive !== null &&
      document.activeElement instanceof Node &&
      layerBecomingInactive.contains(document.activeElement)
    ) {
      toggleRef.current?.focus();
    }
  };

  const requestOpenChange = (nextOpen: boolean) => {
    if (disabled || nextOpen === semanticOpenRef.current) return;
    focusToggleBeforeLayerChange(nextOpen);
    if (!isControlled) {
      semanticOpenRef.current = nextOpen;
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const scheduleProgress = () => {
    if (frameRef.current !== null) return;
    rootRef.current?.setAttribute("data-peel-frame-pending", "true");
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      rootRef.current?.setAttribute("data-peel-frame-pending", "false");
      const session = dragRef.current;
      if (session === null || session.intent !== "peel") return;
      session.progress = progressFromMovement({
        baseProgress: session.baseProgress,
        current: session.latest,
        height: session.height,
        origin: session.origin,
        start: session.start,
        width: session.width,
      });
      writeProgress(session.progress);
    });
  };

  const motionIsReduced = () =>
    reducedMotion === "always" ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (
      disabled ||
      !drag ||
      motionIsReduced() ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }
    const root = rootRef.current;
    if (root === null) return;
    const bounds = root.getBoundingClientRect();
    const point = { x: event.clientX, y: event.clientY };
    // Safari does not consistently focus buttons on mouse press. An active
    // disclosure drag still needs an Escape target, so make the native grip
    // the explicit focus owner without moving the page.
    event.currentTarget.focus({ preventScroll: true });
    dragRef.current = {
      baseProgress: semanticOpenRef.current ? 1 : 0,
      height: bounds.height,
      intent: "pending",
      lastProgress: semanticOpenRef.current ? 1 : 0,
      lastTime: event.timeStamp,
      latest: point,
      origin,
      pointerId: event.pointerId,
      progress: semanticOpenRef.current ? 1 : 0,
      start: point,
      startedOpen: semanticOpenRef.current,
      velocity: 0,
      width: bounds.width,
    };
    const escapeDrag = (keyboardEvent: globalThis.KeyboardEvent) => {
      if (keyboardEvent.key !== "Escape" || dragRef.current === null) return;
      keyboardEvent.preventDefault();
      cancelDrag(true);
      toggleRef.current?.focus({ preventScroll: true });
    };
    dragEscapeRef.current = escapeDrag;
    document.addEventListener("keydown", escapeDrag);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const session = dragRef.current;
    if (session === null || event.pointerId !== session.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    session.latest = point;

    if (session.intent === "pending") {
      session.intent = resolvePeelIntent(
        session.origin,
        session.start,
        point,
        session.startedOpen,
      );
      if (session.intent === "scroll") {
        cancelDrag();
        return;
      }
      if (session.intent === "peel") {
        event.currentTarget.setPointerCapture(event.pointerId);
        rootRef.current?.setAttribute("data-dragging", "true");
      }
    }

    if (session.intent !== "peel") return;
    event.preventDefault();
    const progress = progressFromMovement({
      baseProgress: session.baseProgress,
      current: point,
      height: session.height,
      origin: session.origin,
      start: session.start,
      width: session.width,
    });
    const elapsed = Math.max(1, event.timeStamp - session.lastTime);
    const instantaneous = ((progress - session.lastProgress) / elapsed) * 1000;
    session.velocity = session.velocity * 0.7 + instantaneous * 0.3;
    session.lastProgress = progress;
    session.lastTime = event.timeStamp;
    scheduleProgress();
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const session = dragRef.current;
    if (session === null || event.pointerId !== session.pointerId) return;
    if (session.intent !== "peel") {
      dragRef.current = null;
      removeDragEscapeListener();
      return;
    }

    cancelFrame();
    session.progress = progressFromMovement({
      baseProgress: session.baseProgress,
      current: { x: event.clientX, y: event.clientY },
      height: session.height,
      origin: session.origin,
      start: session.start,
      width: session.width,
    });
    writeProgress(session.progress);
    releaseCapture(session);
    removeDragEscapeListener();
    dragRef.current = null;
    rootRef.current?.setAttribute("data-dragging", "false");
    suppressClickRef.current = true;
    requestOpenChange(
      shouldCommitOpen({
        progress: session.progress,
        threshold: normalizeDragThreshold(dragThreshold),
        velocity: session.velocity,
      }),
    );
    if (isControlled) restoreSemanticProgress();
  };

  const handlePointerCancel = () => {
    // Only one primary gesture can exist. A cancellation delivered to its
    // owning grip is authoritative even where synthetic-test pointer IDs vary
    // from the browser's native mouse pointer ID.
    if (dragRef.current !== null) cancelDrag(true);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }
    requestOpenChange(!semanticOpenRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Escape") return;
    if (dragRef.current !== null) {
      event.preventDefault();
      cancelDrag(true);
      toggleRef.current?.focus();
      return;
    }
    if (semanticOpenRef.current && !disabled) {
      event.preventDefault();
      toggleRef.current?.focus();
      requestOpenChange(false);
    }
  };

  useEffect(() => {
    semanticOpenRef.current = semanticOpen;
  }, [semanticOpen]);

  useEffect(() => {
    if (disabled && dragRef.current !== null) cancelDrag(true);
    // `cancelDrag` deliberately reads current refs rather than becoming an
    // effect dependency that would restart work on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => {
    const session = dragRef.current;
    if (session !== null && session.startedOpen !== semanticOpen) {
      // A controlled parent remains authoritative even mid-gesture. Cancel
      // the stale gesture before adopting the newly supplied semantic state.
      cancelDrag(true);
    } else if (session === null) {
      restoreSemanticProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanticOpen]);

  useEffect(
    () => () => {
      cancelFrame();
      removeDragEscapeListener();
      const session = dragRef.current;
      if (session !== null) releaseCapture(session);
      dragRef.current = null;
    },
    // Helpers use stable DOM refs and are intentionally not effect identities.
    [],
  );

  const mergedStyle: ScoutStyleProperties = {
    ...(style as CSSProperties),
    "--sui-peel-progress": semanticOpen ? 1 : 0,
    "--sui-peel-size": normalizePeelSize(peelSize),
  };

  return (
    // The disclosure group listens only for bubbling Escape from its own
    // descendants; it is not itself clickable or added to the tab order.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      {...elementProps}
      className={joinClassNames("sui-sticker-peel", className)}
      data-disabled={disabled ? "true" : "false"}
      data-drag-enabled={drag ? "true" : "false"}
      data-dragging="false"
      data-open={semanticOpen ? "true" : "false"}
      data-origin={origin}
      data-peel-frame-pending="false"
      data-peel-progress={semanticOpen ? "1" : "0"}
      data-reduced-motion={reducedMotion}
      id={rootId}
      onKeyDown={handleKeyDown}
      ref={rootRef}
      role="group"
      style={mergedStyle}
    >
      <div
        aria-hidden={semanticOpen ? true : undefined}
        className="sui-sticker-peel-layer sui-sticker-peel-front"
        data-active={semanticOpen ? "false" : "true"}
        inert={semanticOpen ? true : undefined}
        ref={frontRef}
      >
        {front}
      </div>
      <div
        aria-hidden={semanticOpen ? undefined : true}
        className="sui-sticker-peel-layer sui-sticker-peel-back"
        data-active={semanticOpen ? "true" : "false"}
        id={backId}
        inert={semanticOpen ? undefined : true}
        ref={backRef}
      >
        {back}
      </div>
      <button
        aria-controls={backId}
        aria-expanded={semanticOpen}
        className="sui-sticker-peel-toggle"
        data-testid="peel-toggle"
        disabled={disabled}
        onClick={handleClick}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={toggleRef}
        type="button"
      >
        <span aria-hidden="true" className="sui-sticker-peel-curl" />
        <span className="sui-sticker-peel-toggle-label">
          {semanticOpen ? closeLabel : revealLabel}
        </span>
      </button>
    </div>
  );
}
