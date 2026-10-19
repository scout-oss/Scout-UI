/**
 * IntersectionObserver entries can be delivered after the page has already
 * scrolled on (busy main thread, fast programmatic scrolling). Entrances and
 * lazy mounts must only fire for elements that are on screen *now*, otherwise
 * an offscreen animation starts late and keeps running after scrolling stops.
 */
export function isOnScreen(element: Element, margin = 0): boolean {
  const box = element.getBoundingClientRect();
  return (
    box.bottom > -margin &&
    box.top < window.innerHeight + margin &&
    box.right > 0 &&
    box.left < window.innerWidth
  );
}

/**
 * "Skimming" = the page is moving faster than `SKIM_SPEED` px/s (a fling, a
 * jump, or a long smooth scroll). Entrances triggered while skimming resolve
 * instantly: nobody should wait for choreography they are flying past, and a
 * fast pass must never leave animations running after scrolling stops.
 */
const SKIM_SPEED = 4000;
const SKIM_HOLD = 160;
let lastY = 0;
let lastTime = 0;
let skimUntil = 0;
let listening = false;

function onScroll() {
  const now = performance.now();
  const y = window.scrollY;
  const speed = (Math.abs(y - lastY) / Math.max(now - lastTime, 1)) * 1000;
  if (speed > SKIM_SPEED) skimUntil = now + SKIM_HOLD;
  lastY = y;
  lastTime = now;
}

export function isSkimming(): boolean {
  if (typeof window === "undefined") return false;
  if (!listening) {
    listening = true;
    lastY = window.scrollY;
    lastTime = performance.now();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  return performance.now() < skimUntil;
}

/** Arms the skim tracker early so the first fast scroll is measured too. */
export function trackSkimming(): void {
  isSkimming();
}
