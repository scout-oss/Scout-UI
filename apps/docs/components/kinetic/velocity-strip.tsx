"use client";

import { useEffect, useRef } from "react";

import {
  isReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";
import { sleep, wake } from "../../lib/kinetic/ticker";

/**
 * A strip of motion verbs that travels only while the page scrolls. Scroll
 * velocity becomes momentum: the tape drifts, leans with speed, coasts, and
 * comes to a complete stop — never an endless ambient marquee. Decorative and
 * hidden from assistive technology; the verbs are listed in the motion guide.
 */
export function VelocityStrip({
  words,
}: {
  readonly words: readonly string[];
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const track = trackRef.current;
    if (!strip || !track) return;

    let visible = false;
    let offset = 0;
    let velocity = 0;
    let lean = 0;
    let lastScroll = window.scrollY;
    let period = track.scrollWidth / 2;

    const tick = (delta: number) => {
      if (!visible) {
        // Offscreen tape never coasts: park it and release the frame loop.
        velocity = 0;
        lean = 0;
        track.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0)`;
        return false;
      }
      offset = (offset + velocity * delta) % period;
      if (offset > 0) offset -= period;
      // Exponential friction: a flick coasts well under a second, then stops.
      velocity *= Math.exp(-delta * 6);
      lean +=
        (Math.max(-8, Math.min(8, velocity / 90)) - lean) *
        Math.min(1, delta * 12);
      track.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0) skewX(${(-lean).toFixed(2)}deg)`;
      if (Math.abs(velocity) < 10 && Math.abs(lean) < 0.05) {
        velocity = 0;
        lean = 0;
        track.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0)`;
        return false;
      }
      return true;
    };

    const onScroll = () => {
      const current = window.scrollY;
      const deltaScroll = current - lastScroll;
      lastScroll = current;
      if (!visible || isReducedEffects()) return;
      velocity = Math.max(-2600, Math.min(2600, velocity - deltaScroll * 9));
      wake(tick);
    };

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    });
    intersection.observe(strip);
    const resize = new ResizeObserver(() => {
      period = track.scrollWidth / 2;
    });
    resize.observe(track);
    window.addEventListener("scroll", onScroll, { passive: true });
    const stopWatching = watchReducedEffects((reduced) => {
      if (!reduced) return;
      sleep(tick);
      velocity = 0;
      lean = 0;
      track.style.transform = "";
    });

    return () => {
      sleep(tick);
      stopWatching();
      intersection.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const run = [...words, ...words];
  return (
    <div aria-hidden="true" className="sui-k-velocity" ref={stripRef}>
      <div className="sui-k-velocity-track" ref={trackRef}>
        {[0, 1].map((copy) => (
          <span className="sui-k-velocity-run" key={copy}>
            {run.map((word, index) => (
              <span
                className="sui-k-velocity-word"
                data-tone={index % 4}
                // The run repeats words by design; position is the identity.
                key={`${word}-${String(index)}`}
              >
                {word}
                <span className="sui-k-velocity-dot">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
