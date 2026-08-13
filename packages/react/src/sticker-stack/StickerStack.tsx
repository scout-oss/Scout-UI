import type {
  HTMLAttributes,
  Key,
  KeyboardEvent,
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
  measureStackDrag,
  normalizeStackIndex,
  resolveStackIntent,
  resolveStackSwipe,
  stackGeometry,
  targetStackIndex,
  visibleStackIndexes,
  type StackAxis,
  type StackDirection,
  type StackGestureIntent,
  type StackPoint,
} from "./stack-math.js";

export interface StickerStackProps<T>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">, ScoutMotionPolicy {
  items: readonly T[];
  getKey: (item: T) => Key;
  renderItem: (
    item: T,
    context: { active: boolean; index: number },
  ) => ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  visibleCount?: 2 | 3 | 4 | 5;
  loop?: boolean;
  axis?: StackAxis;
  drag?: boolean;
  keyboard?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  empty?: ReactNode;
  disabled?: boolean;
}

interface StackTransition<T> {
  direction: StackDirection;
  outgoingIndex: number;
  outgoingItem: T;
  outgoingKey: Key;
  targetIndex: number;
}

interface StackDragSession {
  card: HTMLDivElement;
  extent: number;
  intent: StackGestureIntent;
  lastMeasurement: { offset: number; progress: number; velocity: number };
  lastTime: number;
  latest: StackPoint;
  pointerId: number;
  start: StackPoint;
}

const TRANSITION_MS = 260;

function isReducedMotion(policy: ScoutMotionPolicy["reducedMotion"]) {
  return (
    policy === "always" ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  );
}

function keyEquals(left: Key | null, right: Key) {
  return left !== null && String(left) === String(right);
}

export function StickerStack<T>(props: StickerStackProps<T>) {
  const {
    axis = "x",
    className,
    defaultIndex = 0,
    disabled = false,
    drag = false,
    empty = null,
    getKey,
    id,
    index,
    keyboard = false,
    loop = false,
    nextLabel = "Next item",
    onIndexChange,
    onKeyDown,
    previousLabel = "Previous item",
    reducedMotion = "system",
    renderItem,
    style,
    visibleCount = 3,
    items,
    ...elementProps
  } = props;

  const generatedId = useId();
  const rootId = id ?? `sui-stack-${generatedId.replaceAll(":", "")}`;
  const stageId = `${rootId}-stage`;
  const isControlled = index !== undefined;
  const [uncontrolledState, setUncontrolledState] = useState(() => {
    const initialIndex = normalizeStackIndex(defaultIndex, items.length);
    const initialItem = items[initialIndex];
    return {
      index: initialIndex,
      key: initialItem === undefined ? null : getKey(initialItem),
    };
  });
  const [transition, setTransition] = useState<StackTransition<T> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<StackDragSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const transitionRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const keys = items.map((item) => getKey(item));
  const normalizedInputIndex = normalizeStackIndex(
    isControlled ? index : uncontrolledState.index,
    items.length,
  );
  let effectiveIndex = normalizedInputIndex;
  if (!isControlled && uncontrolledState.key !== null) {
    const retainedIndex = keys.findIndex((key) =>
      keyEquals(uncontrolledState.key, key),
    );
    if (retainedIndex >= 0) effectiveIndex = retainedIndex;
  }
  const activeItem = items[effectiveIndex];
  const activeKey = activeItem === undefined ? null : getKey(activeItem);
  const visualIndex =
    transition !== null && transition.targetIndex < items.length
      ? transition.targetIndex
      : effectiveIndex;

  const cancelFrame = () => {
    if (
      frameRef.current !== null &&
      typeof cancelAnimationFrame === "function"
    ) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
    rootRef.current?.setAttribute("data-stack-frame-pending", "false");
  };

  const resetDragVisual = () => {
    const root = rootRef.current;
    if (root === null) return;
    root.style.setProperty("--sui-stack-internal-drag-x", "0px");
    root.style.setProperty("--sui-stack-internal-drag-y", "0px");
    root.style.setProperty("--sui-stack-internal-drag-progress", "0");
    root.dataset.stackDragging = "false";
    root.dataset.stackDragProgress = "0";
  };

  const releaseCapture = (session: StackDragSession) => {
    if (session.card.hasPointerCapture(session.pointerId)) {
      session.card.releasePointerCapture(session.pointerId);
    }
  };

  const cancelDrag = () => {
    const session = dragRef.current;
    cancelFrame();
    if (session !== null) releaseCapture(session);
    dragRef.current = null;
    resetDragVisual();
  };

  const clearTransition = () => {
    if (transitionTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = null;
    transitionRef.current = false;
    setTransition(null);
  };

  const commitIndex = (targetIndex: number) => {
    const targetItem = items[targetIndex];
    if (targetItem === undefined) return;
    if (!isControlled) {
      setUncontrolledState({ index: targetIndex, key: getKey(targetItem) });
    }
    if (!isControlled && liveRef.current !== null) {
      liveRef.current.textContent = `Item ${String(targetIndex + 1)} of ${String(items.length)}`;
    }
    onIndexChange?.(targetIndex);
  };

  const requestNavigation = (direction: StackDirection) => {
    if (
      disabled ||
      items.length <= 1 ||
      transitionRef.current ||
      dragRef.current !== null
    ) {
      return;
    }
    const targetIndex = targetStackIndex(
      effectiveIndex,
      items.length,
      direction,
      loop,
    );
    if (
      targetIndex === effectiveIndex ||
      activeItem === undefined ||
      activeKey === null
    ) {
      resetDragVisual();
      return;
    }

    if (isReducedMotion(reducedMotion)) {
      commitIndex(targetIndex);
      resetDragVisual();
      return;
    }

    transitionRef.current = true;
    setTransition({
      direction,
      outgoingIndex: effectiveIndex,
      outgoingItem: activeItem,
      outgoingKey: activeKey,
      targetIndex,
    });
    commitIndex(targetIndex);
  };

  const scheduleDragWrite = () => {
    if (frameRef.current !== null) return;
    rootRef.current?.setAttribute("data-stack-frame-pending", "true");
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      rootRef.current?.setAttribute("data-stack-frame-pending", "false");
      const session = dragRef.current;
      const root = rootRef.current;
      if (session === null || session.intent !== "stack" || root === null)
        return;
      const measurement = measureStackDrag({
        axis,
        current: session.latest,
        extent: session.extent,
        lastOffset: session.lastMeasurement.offset,
        lastTime: session.lastTime,
        start: session.start,
        time: performance.now(),
      });
      session.lastMeasurement = measurement;
      session.lastTime = performance.now();
      const x = axis === "x" ? measurement.offset : 0;
      const y = axis === "y" ? measurement.offset : 0;
      root.style.setProperty("--sui-stack-internal-drag-x", `${String(x)}px`);
      root.style.setProperty("--sui-stack-internal-drag-y", `${String(y)}px`);
      root.style.setProperty(
        "--sui-stack-internal-drag-progress",
        String(measurement.progress),
      );
      root.dataset.stackDragProgress = String(measurement.progress);
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    if (
      disabled ||
      !drag ||
      items.length <= 1 ||
      transitionRef.current ||
      isReducedMotion(reducedMotion) ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX, y: event.clientY };
    dragRef.current = {
      card: event.currentTarget,
      extent: Math.max(1, axis === "x" ? bounds.width : bounds.height),
      intent: "pending",
      lastMeasurement: { offset: 0, progress: 0, velocity: 0 },
      lastTime: event.timeStamp,
      latest: point,
      pointerId: event.pointerId,
      start: point,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = dragRef.current;
    if (session === null || event.pointerId !== session.pointerId) return;
    session.latest = { x: event.clientX, y: event.clientY };
    if (session.intent === "pending") {
      session.intent = resolveStackIntent(axis, session.start, session.latest);
      if (session.intent === "scroll") {
        cancelDrag();
        return;
      }
      if (session.intent === "stack") {
        event.currentTarget.setPointerCapture(event.pointerId);
        rootRef.current?.setAttribute("data-stack-dragging", "true");
      }
    }
    if (session.intent !== "stack") return;
    event.preventDefault();
    scheduleDragWrite();
  };

  const finishPointer = (
    event: PointerEvent<HTMLDivElement>,
    cancelled: boolean,
  ) => {
    const session = dragRef.current;
    if (session === null || event.pointerId !== session.pointerId) return;
    session.latest = { x: event.clientX, y: event.clientY };
    cancelFrame();
    const measurement =
      session.intent === "stack"
        ? measureStackDrag({
            axis,
            current: session.latest,
            extent: session.extent,
            lastOffset: session.lastMeasurement.offset,
            lastTime: session.lastTime,
            start: session.start,
            time: event.timeStamp,
          })
        : session.lastMeasurement;
    const claimed = session.intent === "stack";
    releaseCapture(session);
    dragRef.current = null;
    resetDragVisual();
    if (!claimed || cancelled) return;
    event.preventDefault();
    suppressClickRef.current = measurement.progress >= 0.03;
    const direction = resolveStackSwipe(measurement);
    if (direction !== null) requestNavigation(direction);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      !keyboard ||
      disabled
    ) {
      return;
    }
    const direction =
      axis === "x"
        ? event.key === "ArrowRight"
          ? "next"
          : event.key === "ArrowLeft"
            ? "previous"
            : null
        : event.key === "ArrowDown"
          ? "next"
          : event.key === "ArrowUp"
            ? "previous"
            : null;
    if (direction === null) return;
    const target = targetStackIndex(
      effectiveIndex,
      items.length,
      direction,
      loop,
    );
    if (target === effectiveIndex) return;
    event.preventDefault();
    requestNavigation(direction);
  };

  const lastAnnouncementRef = useRef({
    count: items.length,
    index: effectiveIndex,
    key: activeKey === null ? null : String(activeKey),
  });
  useEffect(() => {
    const next = {
      count: items.length,
      index: effectiveIndex,
      key: activeKey === null ? null : String(activeKey),
    };
    const previous = lastAnnouncementRef.current;
    lastAnnouncementRef.current = next;
    if (
      items.length > 0 &&
      next.key !== null &&
      (next.key !== previous.key || next.index !== previous.index)
    ) {
      if (liveRef.current !== null) {
        liveRef.current.textContent = `Item ${String(effectiveIndex + 1)} of ${String(items.length)}`;
      }
    }
  }, [activeKey, effectiveIndex, items.length]);

  const observedIndexRef = useRef(effectiveIndex);
  useEffect(() => {
    if (observedIndexRef.current === effectiveIndex) return;
    observedIndexRef.current = effectiveIndex;
    if (dragRef.current !== null) cancelDrag();
    if (
      transitionRef.current &&
      transition !== null &&
      transition.targetIndex !== effectiveIndex
    ) {
      clearTransition();
    }
    // External controlled changes must release an in-flight gesture. The
    // cleanup functions intentionally read the current imperative session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIndex, transition]);

  useEffect(() => {
    if (transition === null) return;
    transitionTimerRef.current = window.setTimeout(
      clearTransition,
      TRANSITION_MS,
    );
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [transition]);

  const itemSignature = keys.map((key) => String(key)).join("\u001f");
  const itemSignatureRef = useRef(itemSignature);
  useEffect(() => {
    if (itemSignatureRef.current === itemSignature) return;
    itemSignatureRef.current = itemSignature;
    cancelDrag();
    if (transitionRef.current) clearTransition();
    // cancelDrag owns imperative pointer/frame cleanup and intentionally reads
    // the current session rather than participating in render dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSignature]);

  useEffect(() => {
    if (!disabled) return;
    cancelDrag();
    if (transitionRef.current) clearTransition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(
    () => () => {
      cancelFrame();
      const session = dragRef.current;
      if (session !== null) releaseCapture(session);
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    },
    [],
  );

  const canPrevious =
    !disabled &&
    items.length > 1 &&
    (transition !== null || loop || visualIndex > 0);
  const canNext =
    !disabled &&
    items.length > 1 &&
    (transition !== null || loop || visualIndex < items.length - 1);
  const visibleIndexes = visibleStackIndexes(
    visualIndex,
    items.length,
    visibleCount,
    loop,
  );
  const visibleCards = visibleIndexes.filter((itemIndex) => {
    if (transition === null) return true;
    const item = items[itemIndex];
    return (
      item === undefined || !keyEquals(transition.outgoingKey, getKey(item))
    );
  });

  return (
    // The root becomes an intentional keyboard target only when `keyboard`
    // opts in; nested controls are ignored by the handler.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      {...elementProps}
      aria-disabled={disabled || undefined}
      aria-label={elementProps["aria-label"] ?? "Sticker stack"}
      aria-roledescription="stack"
      role="group"
      className={joinClassNames("sui-sticker-stack", className)}
      data-axis={axis}
      data-disabled={disabled ? "true" : "false"}
      data-reduced-motion={reducedMotion}
      data-stack-frame-pending="false"
      data-stack-dragging="false"
      data-stack-drag-progress="0"
      data-transition={transition?.direction ?? "idle"}
      id={rootId}
      onKeyDown={handleKeyDown}
      ref={rootRef}
      style={style}
      tabIndex={
        keyboard && items.length > 0 && !disabled
          ? (elementProps.tabIndex ?? 0)
          : elementProps.tabIndex
      }
    >
      {items.length === 0 ? (
        <div className="sui-sticker-stack-empty" data-stack-empty="true">
          {empty}
        </div>
      ) : (
        <>
          <div className="sui-sticker-stack-stage" id={stageId}>
            {visibleCards.map((itemIndex, depth) => {
              const item = items[itemIndex];
              if (item === undefined) return null;
              const key = getKey(item);
              const active = itemIndex === visualIndex;
              const geometry = stackGeometry(key, depth, axis);
              const cardStyle = {
                "--sui-stack-internal-depth": geometry.depth,
                "--sui-stack-internal-offset-x": `${String(geometry.offsetX)}px`,
                "--sui-stack-internal-offset-y": `${String(geometry.offsetY)}px`,
                "--sui-stack-internal-rotation": `${String(geometry.rotation)}deg`,
                "--sui-stack-internal-z": geometry.zIndex,
              } as ScoutStyleProperties;
              return (
                <div
                  aria-hidden={active ? undefined : true}
                  className="sui-sticker-stack-card"
                  data-active={active ? "true" : "false"}
                  data-depth={depth}
                  data-item-index={itemIndex}
                  data-stack-card="true"
                  inert={active ? undefined : true}
                  key={key}
                  onClickCapture={(event) => {
                    if (!suppressClickRef.current) return;
                    suppressClickRef.current = false;
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onPointerCancel={(event) => {
                    finishPointer(event, true);
                  }}
                  onPointerDown={active ? handlePointerDown : undefined}
                  onPointerMove={active ? handlePointerMove : undefined}
                  onPointerUp={(event) => {
                    finishPointer(event, false);
                  }}
                  style={cardStyle}
                >
                  {renderItem(item, { active, index: itemIndex })}
                </div>
              );
            })}
            {transition !== null ? (
              <div
                aria-hidden="true"
                className="sui-sticker-stack-card sui-sticker-stack-card-outgoing"
                data-active="false"
                data-direction={transition.direction}
                data-item-index={transition.outgoingIndex}
                data-outgoing="true"
                data-stack-card="true"
                inert
                key={`outgoing-${String(transition.outgoingKey)}`}
              >
                {renderItem(transition.outgoingItem, {
                  active: false,
                  index: transition.outgoingIndex,
                })}
              </div>
            ) : null}
          </div>

          <div className="sui-sticker-stack-controls">
            <button
              aria-controls={stageId}
              aria-label={previousLabel}
              className="sui-sticker-stack-control sui-sticker-stack-control-previous"
              disabled={!canPrevious}
              onClick={() => {
                requestNavigation("previous");
              }}
              type="button"
            >
              <span aria-hidden="true">←</span>
            </button>
            <span aria-hidden="true" className="sui-sticker-stack-position">
              {visualIndex + 1} / {items.length}
            </span>
            <button
              aria-controls={stageId}
              aria-label={nextLabel}
              className="sui-sticker-stack-control sui-sticker-stack-control-next"
              disabled={!canNext}
              onClick={() => {
                requestNavigation("next");
              }}
              type="button"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sui-sticker-stack-live"
        ref={liveRef}
      >
        {""}
      </span>
    </div>
  );
}
