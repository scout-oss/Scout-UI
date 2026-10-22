"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { isCoarsePointer, isReducedEffects } from "../../lib/kinetic/effects";
import { Spring, springs } from "../../lib/kinetic/spring";
import { sleep, wake } from "../../lib/kinetic/ticker";

/**
 * Magnetic attraction for a primary action: within `reach` px the wrapped
 * control leans toward the pointer (max `strength` of the distance), then
 * springs back when the pointer leaves. Fine pointers only; the hit target
 * never moves under a finger or for keyboard users.
 */
export function Magnetic({
  children,
  reach = 72,
  strength = 0.28,
}: {
  readonly children: ReactNode;
  readonly reach?: number;
  readonly strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || isCoarsePointer()) return;
    const x = new Spring(0, springs.control);
    const y = new Spring(0, springs.control);
    let center = { x: 0, y: 0 };
    let tracking = false;

    const tick = (delta: number) => {
      const moving = [x.step(delta, 0.05, 1), y.step(delta, 0.05, 1)].some(
        Boolean,
      );
      element.style.transform = `translate3d(${x.value.toFixed(2)}px, ${y.value.toFixed(2)}px, 0)`;
      return moving;
    };

    const onMove = (event: PointerEvent) => {
      if (isReducedEffects() || event.pointerType !== "mouse") return;
      if (!tracking) {
        const box = element.getBoundingClientRect();
        center = {
          x: box.left + box.width / 2 - x.value,
          y: box.top + box.height / 2 - y.value,
        };
        tracking = true;
      }
      const dx = event.clientX - center.x;
      const dy = event.clientY - center.y;
      const inside = Math.hypot(dx, dy) < reach + element.offsetWidth / 2;
      x.target = inside ? dx * strength : 0;
      y.target = inside ? dy * strength : 0;
      wake(tick);
    };
    const onLeave = () => {
      tracking = false;
      if (x.target === 0 && y.target === 0) return;
      x.target = 0;
      y.target = 0;
      wake(tick);
    };
    const zone = element.parentElement ?? element;
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onLeave, { passive: true });
    return () => {
      sleep(tick);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onLeave);
    };
  }, [reach, strength]);

  return (
    <span className="sui-k-magnetic" ref={ref}>
      {children}
    </span>
  );
}
