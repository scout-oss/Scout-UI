import type { StickerPeelOrigin } from "./peel-math.js";

/**
 * Physically modelled peel for `appearance="realistic"`.
 *
 * Geometry: the peel corner C is lifted to the tip T. The fold line is the
 * perpendicular bisector of C→T (through M, with unit normal n pointing from C
 * toward T). The front stays stuck on the side of the fold away from C; the
 * peeled part is reflected across the fold and shown as the sticker's paper
 * backside. Everything is written imperatively (clip-path polygons and a
 * gradient) from coalesced frames; React never re-renders for geometry.
 */
export interface Vec {
  x: number;
  y: number;
}

export interface PeelGeometry {
  /** Still-stuck front, in root coordinates. Empty when fully peeled. */
  front: Vec[];
  /** Reflected backside flap, in root coordinates (may leave the box). */
  flap: Vec[];
  fold: Vec;
  normal: Vec;
  tip: Vec;
  /** Distance from the corner to the tip, in px. */
  lift: number;
  /** 0 at rest on the corner, 1 when the front is fully peeled away. */
  reach: number;
}

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;

export function peelCorner(
  origin: StickerPeelOrigin,
  w: number,
  h: number,
): Vec {
  return {
    x: origin.endsWith("right") ? w : 0,
    y: origin.startsWith("bottom") ? h : 0,
  };
}

/** Sutherland–Hodgman against one half-plane: keeps (p − m)·n ≥ 0. */
export function clipHalfPlane(poly: readonly Vec[], m: Vec, n: Vec): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (a === undefined || b === undefined) continue;
    const da = (a.x - m.x) * n.x + (a.y - m.y) * n.y;
    const db = (b.x - m.x) * n.x + (b.y - m.y) * n.y;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

export function reflectAcross(p: Vec, m: Vec, n: Vec): Vec {
  const d = 2 * ((p.x - m.x) * n.x + (p.y - m.y) * n.y);
  return { x: p.x - d * n.x, y: p.y - d * n.y };
}

/** Tip position for a normalized reach along the peel diagonal. */
export function tipForReach(
  origin: StickerPeelOrigin,
  w: number,
  h: number,
  reach: number,
): Vec {
  const c = peelCorner(origin, w, h);
  const dx = w - 2 * c.x;
  const dy = h - 2 * c.y;
  const length = Math.hypot(dx, dy) || 1;
  // Twice the diagonal clears the whole sticker; a slight sideways drift keeps
  // the fold from looking mechanically symmetric.
  const s = reach * 2.08 * length;
  const ux = dx / length;
  const uy = dy / length;
  return { x: c.x + ux * s - uy * s * 0.07, y: c.y + uy * s + ux * s * 0.07 };
}

export function peelGeometry(
  origin: StickerPeelOrigin,
  w: number,
  h: number,
  tip: Vec,
): PeelGeometry {
  const c = peelCorner(origin, w, h);
  const vx = tip.x - c.x;
  const vy = tip.y - c.y;
  const lift = Math.hypot(vx, vy);
  const rect: Vec[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const diagonal = Math.hypot(w, h) || 1;
  if (lift < 0.5) {
    return {
      flap: [],
      fold: c,
      front: rect,
      lift: 0,
      normal: { x: 0, y: 0 },
      reach: 0,
      tip: c,
    };
  }
  const n = { x: vx / lift, y: vy / lift };
  const m = { x: c.x + vx / 2, y: c.y + vy / 2 };
  const front = clipHalfPlane(rect, m, n);
  const peeled = clipHalfPlane(rect, m, { x: -n.x, y: -n.y });
  const flap = peeled.map((point) => reflectAcross(point, m, n));
  const reach = Math.min(
    1,
    Math.max(0, dot({ x: m.x - c.x, y: m.y - c.y }, n) / diagonal),
  );
  return { flap, fold: m, front, lift, normal: n, reach, tip };
}

const polygon = (points: readonly Vec[], dx = 0, dy = 0) =>
  points.length < 3
    ? "polygon(0 0, 0 0, 0 0)"
    : `polygon(${points.map((p) => `${(p.x + dx).toFixed(2)}px ${(p.y + dy).toFixed(2)}px`).join(", ")})`;

interface RendererNodes {
  root: HTMLElement;
  front: HTMLElement;
  flap: HTMLElement;
  shadow: HTMLElement;
}

export interface RealisticPeel {
  /** Snap or spring the tip to a semantic state. */
  settle(open: boolean, immediate?: boolean): void;
  /** Hover/focus affordance: lift the closed corner a little further. */
  hover(active: boolean): void;
  /** Start a drag from a client point. */
  beginDrag(clientX: number, clientY: number): void;
  /** Move the tip with the pointer (1:1, frame-coalesced by the caller). */
  dragTo(clientX: number, clientY: number): void;
  destroy(): void;
}

const REST = 0.055;
const HOVER = 0.11;
const STIFFNESS = 320;
const DAMPING = 26;

export function createRealisticPeel(
  nodes: RendererNodes,
  origin: StickerPeelOrigin,
  reducedMotion: () => boolean,
): RealisticPeel {
  let w = nodes.root.clientWidth;
  let h = nodes.root.clientHeight;
  let open = false;
  let hovering = false;
  let tip = tipForReach(origin, w, h, REST);
  let target = tip;
  let velocity: Vec = { x: 0, y: 0 };
  let frame = 0;
  let last = 0;
  let dragStart: { client: Vec; tip: Vec } | null = null;

  const restReach = () => (open ? 1 : hovering ? HOVER : REST);

  const render = () => {
    const g = peelGeometry(origin, w, h, tip);
    nodes.front.style.clipPath = polygon(g.front);
    // Flap and shadow layers are 3× the box (inset: -100%) so the reflected
    // paper can hang outside the sticker; polygons are offset into that space.
    nodes.flap.style.clipPath = polygon(g.flap, w, h);
    nodes.shadow.style.clipPath = polygon(
      g.flap,
      w + g.normal.x * 3 + 2,
      h + g.normal.y * 3 + 5,
    );
    // Fully peeled: the paper leaves the surface.
    const fade = Math.min(1, Math.max(0, (1 - g.reach) / 0.14));
    nodes.flap.style.opacity = String(fade);
    nodes.shadow.style.opacity = String(fade * Math.min(1, g.lift / 40));
    if (g.lift > 0.5) {
      const angle = (Math.atan2(g.normal.x, -g.normal.y) * 180) / Math.PI;
      const theta = (angle * Math.PI) / 180;
      const length =
        Math.abs(3 * w * Math.sin(theta)) + Math.abs(3 * h * Math.cos(theta));
      const start = {
        x: 1.5 * w - (Math.sin(theta) * length) / 2,
        y: 1.5 * h + (Math.cos(theta) * length) / 2,
      };
      const along = (p: Vec) =>
        dot({ x: p.x + w - start.x, y: p.y + h - start.y }, g.normal);
      const fold = along(g.fold);
      const end = along(g.tip);
      const curl = Math.max(6, Math.min(26, (end - fold) * 0.22));
      nodes.flap.style.setProperty(
        "--sui-peel-internal-shading",
        `linear-gradient(${angle.toFixed(2)}deg, rgb(0 0 0 / 30%) ${fold.toFixed(1)}px, rgb(0 0 0 / 8%) ${(fold + curl * 0.35).toFixed(1)}px, rgb(255 255 255 / 70%) ${(fold + curl).toFixed(1)}px, rgb(255 255 255 / 0%) ${(fold + curl * 2.6).toFixed(1)}px, rgb(0 0 0 / 10%) ${end.toFixed(1)}px)`,
      );
    }
    nodes.root.dataset.peelReach = g.reach.toFixed(3);
  };

  const step = (now: number) => {
    frame = 0;
    const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
    last = now;
    let remaining = dt;
    while (remaining > 0) {
      const sub = Math.min(remaining, 1 / 240);
      velocity = {
        x:
          velocity.x +
          (-STIFFNESS * (tip.x - target.x) - DAMPING * velocity.x) * sub,
        y:
          velocity.y +
          (-STIFFNESS * (tip.y - target.y) - DAMPING * velocity.y) * sub,
      };
      tip = { x: tip.x + velocity.x * sub, y: tip.y + velocity.y * sub };
      remaining -= sub;
    }
    const settled =
      Math.hypot(tip.x - target.x, tip.y - target.y) < 0.3 &&
      Math.hypot(velocity.x, velocity.y) < 2;
    if (settled) {
      tip = target;
      velocity = { x: 0, y: 0 };
      last = 0;
    }
    render();
    if (!settled) frame = requestAnimationFrame(step);
  };

  const springTo = (next: Vec, immediate: boolean) => {
    target = next;
    if (immediate || reducedMotion()) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      tip = next;
      velocity = { x: 0, y: 0 };
      render();
      return;
    }
    if (frame === 0) frame = requestAnimationFrame(step);
  };

  const resize = new ResizeObserver(() => {
    w = nodes.root.clientWidth;
    h = nodes.root.clientHeight;
    springTo(tipForReach(origin, w, h, restReach()), true);
  });
  resize.observe(nodes.root);
  render();

  return {
    beginDrag(clientX, clientY) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      velocity = { x: 0, y: 0 };
      dragStart = { client: { x: clientX, y: clientY }, tip };
    },
    destroy() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      nodes.front.style.clipPath = "";
    },
    dragTo(clientX, clientY) {
      if (dragStart === null) return;
      tip = {
        x: dragStart.tip.x + clientX - dragStart.client.x,
        y: dragStart.tip.y + clientY - dragStart.client.y,
      };
      target = tip;
      render();
    },
    hover(active) {
      hovering = active;
      if (dragStart !== null || open) return;
      springTo(tipForReach(origin, w, h, restReach()), false);
    },
    settle(nextOpen, immediate = false) {
      open = nextOpen;
      dragStart = null;
      springTo(tipForReach(origin, w, h, restReach()), immediate);
    },
  };
}
