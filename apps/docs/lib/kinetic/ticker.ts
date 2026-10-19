/**
 * One shared requestAnimationFrame loop for every docs-level kinetic surface.
 *
 * Subscribers return `true` while they still need frames. The loop schedules a
 * frame only while at least one subscriber is awake, so a settled page has zero
 * pending frames (the M17 homepage runtime budget asserts exactly that).
 */
type FrameCallback = (deltaSeconds: number, now: number) => boolean;

const awake = new Set<FrameCallback>();
let handle = 0;
let last = 0;

function frame(now: number) {
  handle = 0;
  // Clamp large gaps (background tab, debugger) so springs never explode.
  const delta = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
  last = now;
  for (const callback of [...awake]) {
    if (!callback(delta, now)) awake.delete(callback);
  }
  if (awake.size > 0) {
    handle = window.requestAnimationFrame(frame);
  } else {
    last = 0;
  }
}

/** Wake a callback. It keeps receiving frames until it returns `false`. */
export function wake(callback: FrameCallback): void {
  awake.add(callback);
  if (handle === 0) handle = window.requestAnimationFrame(frame);
}

/** Remove a callback immediately and stop the loop when nothing is awake. */
export function sleep(callback: FrameCallback): void {
  awake.delete(callback);
  if (awake.size === 0 && handle !== 0) {
    window.cancelAnimationFrame(handle);
    handle = 0;
    last = 0;
  }
}
