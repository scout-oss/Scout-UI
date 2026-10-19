"use client";

import { Sticker } from "@scout-ui/react";
import type { StickerDefinition } from "@scout-ui/stickers";
import { useEffect, useRef, type CSSProperties } from "react";

import { createGrabIntent, VelocityTracker } from "../../lib/kinetic/grab";
import {
  isReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";
import { clamp } from "../../lib/kinetic/spring";
import {
  isOnScreen,
  isSkimming,
  trackSkimming,
} from "../../lib/kinetic/visibility";
import { sleep, wake } from "../../lib/kinetic/ticker";

/**
 * A desk of real stickers you can pick up and throw. Each sticker is the public
 * <Sticker> component; only the desk physics are docs-level.
 *
 * Physics: pointer-carried with a short lag, released with the flick velocity,
 * exponential friction, damped wall bounces, and spin inherited from impact.
 * The ticker sleeps as soon as everything rests. Stickers are decorative; the
 * Shuffle and Tidy buttons are the keyboard path and land stickers exactly on
 * authored targets by solving the glide distance for the launch velocity.
 */

const FRICTION = 3.4;
const SPIN_FRICTION = 4.5;
const RESTITUTION = 0.42;

interface Body {
  readonly element: HTMLDivElement;
  size: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  r: number;
  baseR: number;
  vx: number;
  vy: number;
  vr: number;
  held: boolean;
  targetX: number;
  targetY: number;
}

/** R2 low-discrepancy scatter: evenly "random", identical on every render. */
function scatter(index: number, seed = 0) {
  const g = 1.324_717_957_244_746;
  const x = (0.5 + (index + seed * 7) / g) % 1;
  const y = (0.5 + (index + seed * 7) / (g * g)) % 1;
  const r = (((index + seed) * 37) % 34) - 17;
  return { r, x, y };
}

const sizes = [7.5, 6.25, 8.5, 6.75, 7.25, 9, 6.5, 7.75];

export function StickerDesk({
  compact = false,
  label,
  stickers,
}: {
  /** Specimen-sized: fewer, smaller stickers and only the Shuffle control. */
  readonly compact?: boolean;
  readonly label: string;
  readonly stickers: readonly StickerDefinition[];
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const shuffleRef = useRef<HTMLButtonElement>(null);
  const tidyRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const elements = [
      ...board.querySelectorAll<HTMLDivElement>("[data-k-desk-item]"),
    ];
    let width = board.clientWidth;
    let height = board.clientHeight;
    let topZ = elements.length;
    let shuffleSeed = 0;

    const bodies: Body[] = elements.map((element) => ({
      baseR: Number(element.dataset.kRotation ?? 0),
      element,
      held: false,
      originX: 0,
      originY: 0,
      r: 0,
      size: element.offsetWidth,
      targetX: Number.NaN,
      targetY: Number.NaN,
      vr: 0,
      vx: 0,
      vy: 0,
      x: 0,
      y: 0,
    }));

    // Stickers keep their server-rendered percentage origin; physics only adds
    // a pixel offset, so hydration never moves anything.
    const measure = () => {
      width = board.clientWidth;
      height = board.clientHeight;
      for (const body of bodies) {
        body.size = body.element.offsetWidth;
        body.originX = body.element.offsetLeft;
        body.originY = body.element.offsetTop;
        body.x = clamp(body.x, -body.originX, width - body.size - body.originX);
        body.y = clamp(
          body.y,
          -body.originY,
          height - body.size - body.originY,
        );
        render(body);
      }
    };

    const render = (body: Body) => {
      body.element.style.transform = `translate3d(${body.x.toFixed(1)}px, ${body.y.toFixed(1)}px, 0) rotate(${(body.baseR + body.r).toFixed(2)}deg)`;
    };

    const tick = (delta: number) => {
      let moving = false;
      for (const body of bodies) {
        if (body.held) {
          moving = true;
          continue;
        }
        if (
          Math.abs(body.vx) < 2 &&
          Math.abs(body.vy) < 2 &&
          Math.abs(body.vr) < 1
        ) {
          body.vx = 0;
          body.vy = 0;
          body.vr = 0;
          continue;
        }
        moving = true;
        const decay = Math.exp(-FRICTION * delta);
        body.x += body.vx * delta;
        body.y += body.vy * delta;
        body.vx *= decay;
        body.vy *= decay;
        body.r += body.vr * delta;
        body.vr *= Math.exp(-SPIN_FRICTION * delta);

        const minX = -body.originX;
        const maxX = width - body.size - body.originX;
        const minY = -body.originY;
        const maxY = height - body.size - body.originY;
        if (body.x < minX || body.x > maxX) {
          body.x = clamp(body.x, minX, maxX);
          body.vr += body.vy * 0.09 * Math.sign(body.vx);
          body.vx = -body.vx * RESTITUTION;
        }
        if (body.y < minY || body.y > maxY) {
          body.y = clamp(body.y, minY, maxY);
          body.vr -= body.vx * 0.09 * Math.sign(body.vy);
          body.vy = -body.vy * RESTITUTION;
        }
        body.r = clamp(body.r, -40, 40);
        render(body);
      }
      return moving;
    };

    // Launch velocity that glides exactly `distance` under exponential
    // friction: distance = v / FRICTION.
    const glideTo = (body: Body, x: number, y: number, spin: number) => {
      if (isReducedEffects()) {
        body.x = x;
        body.y = y;
        body.r = 0;
        body.vx = 0;
        body.vy = 0;
        body.vr = 0;
        render(body);
        return;
      }
      body.vx = (x - body.x) * FRICTION;
      body.vy = (y - body.y) * FRICTION;
      body.vr = (spin - body.r) * SPIN_FRICTION;
      wake(tick);
    };

    const announce = (message: string) => {
      if (statusRef.current) statusRef.current.textContent = message;
    };

    const shuffle = () => {
      shuffleSeed += 1;
      bodies.forEach((body, index) => {
        const spot = scatter(index, shuffleSeed);
        const x = spot.x * (width - body.size) - body.originX;
        const y = spot.y * (height - body.size) - body.originY;
        window.setTimeout(
          () => {
            glideTo(body, x, y, spot.r - body.baseR);
          },
          isReducedEffects() ? 0 : index * 18,
        );
      });
      announce("Stickers shuffled across the desk.");
    };

    const tidy = () => {
      const columns = Math.max(3, Math.floor(width / 120));
      const cell = width / columns;
      const rows = Math.ceil(bodies.length / columns);
      const rowHeight = Math.min(cell, height / rows);
      bodies.forEach((body, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = column * cell + (cell - body.size) / 2 - body.originX;
        const y = row * rowHeight + (rowHeight - body.size) / 2 - body.originY;
        window.setTimeout(
          () => {
            glideTo(
              body,
              x,
              clamp(y, -body.originY, height - body.size - body.originY),
              -body.baseR,
            );
          },
          isReducedEffects() ? 0 : index * 14,
        );
      });
      announce("Stickers tidied into a grid.");
    };

    const cleanups: (() => void)[] = [];
    const tracker = new VelocityTracker();
    for (const body of bodies) {
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || isReducedEffects()) return;
        const startX = event.clientX - body.x;
        const startY = event.clientY - body.y;
        tracker.reset();
        tracker.push(event.clientX, event.clientY, event.timeStamp);
        let grabbing = false;

        const grab = () => {
          grabbing = true;
          body.held = true;
          body.vx = 0;
          body.vy = 0;
          body.element.setPointerCapture(event.pointerId);
          body.element.dataset.kHeld = "true";
          topZ += 1;
          body.element.style.zIndex = String(topZ);
          wake(tick);
        };
        const intent = createGrabIntent(event, grab, { holdMs: 160 });
        if (intent.held) grab();

        const onMove = (move: PointerEvent) => {
          if (!grabbing) {
            const decision = intent.move(move);
            if (decision === "scroll") {
              finish();
              return;
            }
            if (decision !== "grab") return;
            grab();
          }
          tracker.push(move.clientX, move.clientY, move.timeStamp);
          const minX = -body.originX;
          const maxX = width - body.size - body.originX;
          const minY = -body.originY;
          const maxY = height - body.size - body.originY;
          body.x = clamp(move.clientX - startX, minX, maxX);
          body.y = clamp(move.clientY - startY, minY, maxY);
          // Carried objects swing like they hang from the fingertip.
          const velocity = tracker.velocity();
          body.r += (clamp(velocity.x * 0.01, -22, 22) - body.r) * 0.25;
          render(body);
        };
        const onTouchMove = (touch: TouchEvent) => {
          if (grabbing && touch.cancelable) touch.preventDefault();
        };
        const finish = () => {
          intent.cancel();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", finish);
          window.removeEventListener("touchmove", onTouchMove);
          if (!grabbing) return;
          const velocity = tracker.velocity();
          body.held = false;
          delete body.element.dataset.kHeld;
          body.vx = clamp(velocity.x, -3200, 3200);
          body.vy = clamp(velocity.y, -3200, 3200);
          body.vr = clamp(velocity.x * 0.06, -480, 480);
          wake(tick);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", finish);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
      };
      body.element.addEventListener("pointerdown", onPointerDown);
      cleanups.push(() => {
        body.element.removeEventListener("pointerdown", onPointerDown);
      });
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(board);

    // Entrance: the pile is slapped down the first time it is seen.
    const intersection = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && isOnScreen(board)) {
          if (isSkimming()) board.dataset.kInstant = "true";
          board.dataset.kIn = "true";
          intersection.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    trackSkimming();
    intersection.observe(board);

    const shuffleButton = shuffleRef.current;
    const tidyButton = tidyRef.current;
    shuffleButton?.addEventListener("click", shuffle);
    tidyButton?.addEventListener("click", tidy);
    board.dataset.kLive = "true";

    const stopWatching = watchReducedEffects((reduced) => {
      if (!reduced) return;
      sleep(tick);
      for (const body of bodies) {
        body.held = false;
        body.vx = 0;
        body.vy = 0;
        body.vr = 0;
      }
    });

    return () => {
      sleep(tick);
      stopWatching();
      resize.disconnect();
      intersection.disconnect();
      shuffleButton?.removeEventListener("click", shuffle);
      tidyButton?.removeEventListener("click", tidy);
      delete board.dataset.kLive;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return (
    <div className="sui-k-desk" data-k-compact={compact ? "true" : undefined}>
      <div
        aria-label={label}
        className="sui-k-desk-board"
        ref={boardRef}
        role="img"
      >
        {stickers.map((sticker, index) => {
          const spot = scatter(index);
          const size =
            (sizes[index % sizes.length] ?? 7) * (compact ? 0.62 : 1);
          return (
            <div
              aria-hidden="true"
              className="sui-k-desk-item"
              data-k-desk-item
              data-k-rotation={spot.r}
              key={sticker.id}
              style={
                {
                  "--sui-k-x": spot.x.toFixed(4),
                  "--sui-k-y": spot.y.toFixed(4),
                  "--sui-k-size": `${String(size)}rem`,
                  "--sui-k-i": index,
                  transform: `rotate(${String(spot.r)}deg)`,
                } as CSSProperties
              }
            >
              <span className="sui-k-desk-sticker">
                <Sticker alt="" shadow="stuck" size="100%" source={sticker} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="sui-k-desk-tools">
        <button className="sui-k-chip" ref={shuffleRef} type="button">
          <span aria-hidden="true">↻</span> Shuffle the desk
        </button>
        {compact ? null : (
          <button className="sui-k-chip" ref={tidyRef} type="button">
            <span aria-hidden="true">▦</span> Tidy up
          </button>
        )}
        <p
          aria-live="polite"
          className="sui-docs-visually-hidden"
          ref={statusRef}
        />
      </div>
    </div>
  );
}
