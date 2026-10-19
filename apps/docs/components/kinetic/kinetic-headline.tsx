"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { createGrabIntent, VelocityTracker } from "../../lib/kinetic/grab";
import {
  isCoarsePointer,
  isReducedEffects,
  useReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";
import { clamp, Spring, springs } from "../../lib/kinetic/spring";
import { sleep, wake } from "../../lib/kinetic/ticker";

/**
 * "Pressure-sensitive" display type. Each glyph of the giant word is a die-cut
 * letter sticker: it swells (variable wght/wdth) where the pointer presses,
 * can be peeled off and thrown, and always springs home and re-sticks.
 *
 * Accessibility: the heading's text is a visually hidden copy; the letter art
 * is aria-hidden and purely decorative. "Test the adhesive" is the keyboard
 * and assistive-technology path to the same moment. Nothing re-renders React
 * during interaction; all motion is imperative transforms on a shared ticker.
 */

interface LetterState {
  readonly element: HTMLSpanElement;
  readonly lift: HTMLSpanElement;
  readonly x: Spring;
  readonly y: Spring;
  readonly rotate: Spring;
  readonly raise: Spring;
  readonly pressure: Spring;
  centerX: number;
  centerY: number;
  grabbed: boolean;
  lastWeight: number;
}

// Authored, not random: the same throw every time keeps the moment designed.
const adhesiveImpulses = [
  [-620, -900, -260],
  [-240, -1250, 180],
  [140, -980, -320],
  [380, -1300, 240],
  [-120, -1100, -200],
  [520, -880, 300],
  [760, -1180, 420],
] as const;

const restRotation = [-3, 2, -1.5, 3, -2, 1, 7];

export function KineticHeadline({
  lead,
  word,
}: {
  /** Small applied-label line above the giant word. */
  readonly lead: string;
  /** The giant die-cut word. */
  readonly word: string;
}) {
  const artRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedEffects();
  const letters = Array.from(word);

  // Fit-to-measure, for every visitor (also reduced effects): the word is
  // sized for Bricolage's condensed width, but with `font-display: optional`
  // a slow first load keeps the wider fallback face. Shrink to fit; never
  // grow past the designed size.
  useEffect(() => {
    const art = artRef.current;
    const word = art?.querySelector<HTMLElement>(".sui-k-headline-word");
    if (!art || !word) return;
    // Stateless: the applied scale is read back from the element, so extra
    // effect instances (Strict Mode, Fast Refresh) can never disagree.
    const apply = () => {
      const fit = Number(word.style.getPropertyValue("--sui-k-fit")) || 1;
      const natural = word.offsetWidth / fit;
      const available = art.clientWidth;
      const next = Math.max(0.4, Math.min(1, available / natural));
      if (Math.abs(next - fit) < 0.002) return;
      word.style.setProperty("--sui-k-fit", next.toFixed(4));
    };
    apply();
    // Watch the word as well as the container: a font swap changes only the
    // word's width. Re-entry is stable because natural = width / fit.
    const observer = new ResizeObserver(apply);
    observer.observe(art);
    observer.observe(word);
    void document.fonts.ready.then(apply);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const art = artRef.current;
    if (!art || isReducedEffects()) return;
    const host = art.closest<HTMLElement>("[data-k-pressure-field]") ?? art;

    const elements = [
      ...art.querySelectorAll<HTMLSpanElement>("[data-k-letter]"),
    ];
    const states: LetterState[] = elements.map((element) => ({
      centerX: 0,
      centerY: 0,
      element,
      grabbed: false,
      lastWeight: -1,
      lift: element.querySelector<HTMLSpanElement>("[data-k-lift]") ?? element,
      pressure: new Spring(0, springs.pressure),
      raise: new Spring(0, springs.control),
      rotate: new Spring(0, springs.sticker),
      x: new Spring(0, springs.adhesive),
      y: new Spring(0, springs.adhesive),
    }));

    const coarse = isCoarsePointer();
    const pointer = { active: false, dirty: false, x: 0, y: 0 };
    let artRect = art.getBoundingClientRect();

    // Letter centres are cached relative to the art box, so pointer frames
    // only read one rect instead of one per glyph.
    const measure = () => {
      artRect = art.getBoundingClientRect();
      for (const state of states) {
        const box = state.element.getBoundingClientRect();
        state.centerX = box.left + box.width / 2 - artRect.left;
        state.centerY = box.top + box.height / 2 - artRect.top;
      }
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(art);
    void document.fonts.ready.then(measure);

    const render = (state: LetterState) => {
      const { x, y, rotate, raise, pressure } = state;
      state.element.style.transform = `translate3d(${x.value.toFixed(2)}px, ${y.value.toFixed(2)}px, 0) rotate(${rotate.value.toFixed(2)}deg)`;
      const lift = raise.value;
      state.lift.style.transform = `translate3d(${(-lift * 0.09).toFixed(3)}em, ${(-lift * 0.11).toFixed(3)}em, 0) scale(${(1 + lift * 0.07).toFixed(4)})`;
      // Quantise the axis write: sub-unit weight changes are invisible and
      // each write costs a glyph re-shape.
      const weight = Math.round(pressure.value * 30) / 30;
      if (weight !== state.lastWeight) {
        state.lastWeight = weight;
        state.element.style.setProperty("--sui-k-press", String(weight));
      }
    };

    const tick = (delta: number) => {
      let moving = false;
      const pointerMoved = pointer.dirty;
      pointer.dirty = false;
      if (pointerMoved && pointer.active && !coarse) {
        const rect = art.getBoundingClientRect();
        const px = pointer.x - rect.left;
        const py = pointer.y - rect.top;
        const radius = Math.max(rect.width * 0.2, 140);
        for (const state of states) {
          const distance = Math.hypot(
            px - state.centerX - state.x.value,
            (py - state.centerY - state.y.value) * 1.4,
          );
          const falloff = clamp(1 - distance / radius, 0, 1);
          state.pressure.target = falloff * falloff * (3 - 2 * falloff);
        }
      }
      for (const state of states) {
        const steps = [
          state.x.step(delta, 0.05, 1),
          state.y.step(delta, 0.05, 1),
          state.rotate.step(delta, 0.01, 0.1),
          state.raise.step(delta),
          state.pressure.step(delta),
        ];
        if (steps.some(Boolean) || state.grabbed) moving = true;
        render(state);
      }
      return moving || pointerMoved;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.active = true;
      pointer.dirty = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      wake(tick);
    };
    const onPointerLeave = () => {
      pointer.active = false;
      for (const state of states) state.pressure.target = 0;
      wake(tick);
    };

    const cleanups: (() => void)[] = [];
    const tracker = new VelocityTracker();

    for (const state of states) {
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const startX = event.clientX - state.x.value;
        const startY = event.clientY - state.y.value;
        tracker.reset();
        tracker.push(event.clientX, event.clientY, event.timeStamp);
        let grabbing = false;

        const grab = () => {
          grabbing = true;
          state.grabbed = true;
          state.element.setPointerCapture(event.pointerId);
          state.element.dataset.kGrabbed = "true";
          if (host !== art) host.dataset.kCarrying = "true";
          state.raise.target = 1;
          state.pressure.target = 1;
          state.x.config = springs.carry;
          state.y.config = springs.carry;
          wake(tick);
        };
        const intent = createGrabIntent(event, grab);
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
          state.x.target = move.clientX - startX;
          state.y.target = move.clientY - startY;
          const velocity = tracker.velocity();
          state.rotate.target = clamp(velocity.x * 0.012, -28, 28);
          wake(tick);
        };
        const onTouchMove = (touch: TouchEvent) => {
          // Once a letter is picked up, the finger owns it, not the page.
          if (grabbing && touch.cancelable) touch.preventDefault();
        };
        const finish = (release?: PointerEvent) => {
          intent.cancel();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", finish);
          window.removeEventListener("touchmove", onTouchMove);
          if (!grabbing) {
            // A tap without a drag: a quick "pop" of the sticker.
            if (release?.type === "pointerup") {
              state.raise.velocity += 9;
              state.rotate.velocity += (state.rotate.value >= 0 ? -1 : 1) * 160;
              wake(tick);
            }
            return;
          }
          const velocity = tracker.velocity();
          state.grabbed = false;
          delete state.element.dataset.kGrabbed;
          delete host.dataset.kCarrying;
          state.x.config = springs.adhesive;
          state.y.config = springs.adhesive;
          state.x.target = 0;
          state.y.target = 0;
          state.x.velocity = clamp(velocity.x, -4000, 4000);
          state.y.velocity = clamp(velocity.y, -4000, 4000);
          state.rotate.target = 0;
          state.rotate.velocity = clamp(velocity.x * 0.08, -600, 600);
          state.raise.target = 0;
          if (!pointer.active || coarse) state.pressure.target = 0;
          wake(tick);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", finish);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
      };
      state.element.addEventListener("pointerdown", onPointerDown);
      cleanups.push(() => {
        state.element.removeEventListener("pointerdown", onPointerDown);
      });
    }

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    // "Test the adhesive": the non-pointer path to the same physical moment.
    const onAdhesiveTest = () => {
      states.forEach((state, index) => {
        const [vx, vy, vr] = adhesiveImpulses[
          index % adhesiveImpulses.length
        ] ?? [0, -900, 0];
        window.setTimeout(() => {
          state.x.velocity += vx;
          state.y.velocity += vy;
          state.rotate.velocity += vr;
          state.raise.velocity += 7;
          wake(tick);
        }, index * 45);
      });
    };
    art.addEventListener("sui-k-adhesive-test", onAdhesiveTest);

    const stopOnReduce = watchReducedEffects((nowReduced) => {
      if (!nowReduced) return;
      sleep(tick);
      for (const state of states) {
        state.x.snap(0);
        state.y.snap(0);
        state.rotate.snap(0);
        state.raise.snap(0);
        state.pressure.snap(0);
        render(state);
      }
    });

    return () => {
      sleep(tick);
      stopOnReduce();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      art.removeEventListener("sui-k-adhesive-test", onAdhesiveTest);
      for (const cleanup of cleanups) cleanup();
    };
  }, [reduced]);

  return (
    <>
      <span className="sui-docs-visually-hidden">
        {lead} {word}
      </span>
      <span
        aria-hidden="true"
        className="sui-k-headline-art"
        data-k-live={reduced ? undefined : "true"}
        ref={artRef}
      >
        <span className="sui-k-headline-lead">
          {lead.split(" ").map((part, index) => (
            <span
              className="sui-k-label"
              key={part}
              style={{ "--sui-k-i": index } as CSSProperties}
            >
              {part}
            </span>
          ))}
        </span>
        <span className="sui-k-headline-word">
          {letters.map((letter, index) => (
            <span
              className="sui-k-letter-slot"
              // Letters repeat ("S"), so the index is the stable identity.
              key={index}
              style={
                {
                  "--sui-k-i": index,
                  "--sui-k-r": `${String(restRotation[index % restRotation.length] ?? 0)}deg`,
                } as CSSProperties
              }
            >
              <span className="sui-k-letter-sizer">{letter}</span>
              <span className="sui-k-letter" data-k-letter>
                <span className="sui-k-letter-shadow">{letter}</span>
                <span className="sui-k-letter-lift" data-k-lift>
                  <span className="sui-k-letter-cut">{letter}</span>
                  <span
                    className="sui-k-letter-face"
                    data-k-dot={letter === "." ? "true" : undefined}
                  >
                    {letter}
                  </span>
                </span>
              </span>
            </span>
          ))}
        </span>
      </span>
    </>
  );
}

/** Keyboard/AT path: fires the authored "peel everything and re-stick" throw. */
export function AdhesiveTestButton() {
  const reduced = useReducedEffects();
  return (
    <button
      className="sui-k-adhesive-button"
      disabled={reduced}
      hidden={reduced}
      onClick={(event) => {
        const art = event.currentTarget
          .closest("[data-k-pressure-field]")
          ?.querySelector(".sui-k-headline-art");
        art?.dispatchEvent(new CustomEvent("sui-k-adhesive-test"));
      }}
      type="button"
    >
      <span aria-hidden="true" className="sui-k-adhesive-icon">
        ✦
      </span>
      Test the adhesive
    </button>
  );
}
