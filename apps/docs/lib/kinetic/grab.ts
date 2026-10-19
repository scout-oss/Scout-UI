/**
 * Touch-safe grab intent shared by draggable docs surfaces.
 *
 * Mouse and pen grab immediately. Touch never steals a vertical page scroll:
 * the object is grabbed only after a horizontal-dominant move, or after the
 * finger rests for `holdMs` (a long-press "pick up"). Elements using this
 * helper set `touch-action: pan-y` so the browser keeps vertical panning.
 */
export interface GrabIntent {
  /** Feed every pointermove. Returns "grab", "scroll", or "pending". */
  move(event: PointerEvent): "grab" | "pending" | "scroll";
  /** True once the long-press timer has fired. */
  readonly held: boolean;
  cancel(): void;
}

export function createGrabIntent(
  start: PointerEvent,
  onHold: () => void,
  { holdMs = 220, slop = 8 } = {},
): GrabIntent {
  const immediate = start.pointerType !== "touch";
  let held = immediate;
  let decided: "grab" | "scroll" | null = immediate ? "grab" : null;
  const timer = immediate
    ? 0
    : window.setTimeout(() => {
        if (decided === null) {
          held = true;
          decided = "grab";
          onHold();
        }
      }, holdMs);

  return {
    get held() {
      return held;
    },
    move(event) {
      if (decided !== null) return decided;
      const dx = event.clientX - start.clientX;
      const dy = event.clientY - start.clientY;
      if (Math.hypot(dx, dy) < slop) return "pending";
      window.clearTimeout(timer);
      decided = Math.abs(dx) > Math.abs(dy) * 1.2 ? "grab" : "scroll";
      return decided;
    },
    cancel() {
      window.clearTimeout(timer);
      decided = "scroll";
    },
  };
}

/**
 * Tracks pointer velocity in px/s from the last ~80ms of samples, so a throw
 * reflects the flick at release rather than the whole drag.
 */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = [];

  reset(): void {
    this.samples = [];
  }

  push(x: number, y: number, t: number): void {
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - (this.samples[0]?.t ?? t) > 80) {
      this.samples.shift();
    }
  }

  velocity(): { x: number; y: number } {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    if (!first || !last || last.t - first.t < 1) return { x: 0, y: 0 };
    const dt = (last.t - first.t) / 1000;
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
  }
}
