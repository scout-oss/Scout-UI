"use client";

import { useEffect, useRef } from "react";

import {
  isReducedEffects,
  watchReducedEffects,
} from "../../lib/kinetic/effects";
import { sleep, wake } from "../../lib/kinetic/ticker";

/**
 * Docs-level "collage" trail: large printed-matter stickers stamped densely
 * along the pointer path, newest always on top, each cut after exactly one
 * second — no entrance, no rotation, no fade. A deliberately different grammar
 * from the public StickerTrail (see PUBLIC_API_PROPOSALS.md P9); it uses the
 * docs-only collage artwork in /public/collage.
 *
 * Engineering: a fixed pool of <img> nodes; pointer samples are buffered in
 * the event handler and stamped once per frame (one rect read per frame);
 * only transform/visibility/z-index are written; the shared ticker sleeps as
 * soon as the last sticker expires. Decorative and aria-hidden; reduced
 * effects disables it entirely.
 */

const POOL_SIZE = 48;
const LIFETIME_MS = 1000;
const SPACING_PX = 20;
const MAX_STAMPS_PER_FRAME = 8;

export const collageStickers = [
  "ticket-stub",
  "mixtape",
  "airmail-envelope",
  "postage-stamp",
  "embroidered-patch",
  "instant-photo",
  "floppy-disk",
  "receipt",
  "name-tag",
  "fragile-label",
  "foil-seal",
  "pixel-heart",
] as const;

const sources = collageStickers.map((id) => `/collage/${id}.webp`);

interface Slot {
  readonly node: HTMLImageElement;
  birth: number;
  live: boolean;
}

export function CollageTrailLayer({
  size = 200,
}: {
  /** Desktop sticker size in px; narrow regions scale it down. */
  readonly size?: number;
}) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;

    let armed = false;
    let slots: Slot[] = [];
    let z = 1;
    let bag: number[] = [];
    let lastSource = -1;
    let previous: { x: number; y: number } | null = null;
    let carried = 0;
    const pending: { x: number; y: number; t: number }[] = [];

    // A shuffled bag never shows the same artwork twice in a row.
    const nextSource = () => {
      if (bag.length === 0) {
        bag = sources.map((_, index) => index);
        for (let i = bag.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j] ?? 0, bag[i] ?? 0];
        }
        if (bag[bag.length - 1] === lastSource) bag.reverse();
      }
      lastSource = bag.pop() ?? 0;
      return lastSource;
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      // Warm the decode cache so the first stamps never flash empty frames.
      for (const src of sources) {
        const image = new Image();
        image.src = src;
        void image.decode().catch(() => undefined);
      }
      slots = Array.from({ length: POOL_SIZE }, () => {
        const node = document.createElement("img");
        node.alt = "";
        node.decoding = "async";
        node.draggable = false;
        node.className = "sui-k-collage-sticker";
        layer.append(node);
        return { birth: 0, live: false, node };
      });
    };

    const stamp = (x: number, y: number, now: number, stickerSize: number) => {
      // Reuse a free slot, else recycle the oldest live one.
      let slot = slots.find((candidate) => !candidate.live);
      if (!slot) {
        slot = slots.reduce((oldest, candidate) =>
          candidate.birth < oldest.birth ? candidate : oldest,
        );
      }
      const src = sources[nextSource()] ?? "";
      if (slot.node.getAttribute("src") !== src) slot.node.src = src;
      slot.node.style.width = `${String(stickerSize)}px`;
      // 2D translate on purpose: placed stickers never move, so 48 compositor
      // layers would only cost memory.
      slot.node.style.transform = `translate(${(x - stickerSize / 2).toFixed(1)}px, ${(y - stickerSize / 2).toFixed(1)}px)`;
      z += 1;
      slot.node.style.zIndex = String(z);
      slot.node.style.visibility = "visible";
      slot.birth = now;
      slot.live = true;
    };

    const tick = () => {
      const now = performance.now();
      if (pending.length > 0) {
        const rect = host.getBoundingClientRect();
        const stickerSize = Math.round(
          Math.min(size, Math.max(96, rect.width * 0.32)),
        );
        let stamps = 0;
        for (const point of pending) {
          const x = point.x - rect.left;
          const y = point.y - rect.top;
          if (!previous) {
            stamp(x, y, now, stickerSize);
            stamps += 1;
            previous = { x, y };
            continue;
          }
          const dx = x - previous.x;
          const dy = y - previous.y;
          const distance = Math.hypot(dx, dy);
          let travelled = SPACING_PX - carried;
          while (travelled <= distance && stamps < MAX_STAMPS_PER_FRAME) {
            const t = travelled / distance;
            stamp(previous.x + dx * t, previous.y + dy * t, now, stickerSize);
            stamps += 1;
            travelled += SPACING_PX;
          }
          carried =
            stamps >= MAX_STAMPS_PER_FRAME
              ? 0
              : distance - (travelled - SPACING_PX);
          previous = { x, y };
        }
        pending.length = 0;
      }
      let live = false;
      for (const slot of slots) {
        if (!slot.live) continue;
        if (now - slot.birth >= LIFETIME_MS) {
          // The signature hard cut: no fade, the sticker is simply gone.
          slot.live = false;
          slot.node.style.visibility = "hidden";
        } else {
          live = true;
        }
      }
      return live;
    };

    const enqueue = (event: PointerEvent) => {
      if (isReducedEffects()) return;
      // While a headline letter is being carried, the letter is the focus.
      if (host.dataset.kCarrying === "true") {
        previous = null;
        return;
      }
      arm();
      const samples =
        typeof event.getCoalescedEvents === "function"
          ? event.getCoalescedEvents()
          : [];
      for (const sample of samples.length > 0 ? samples : [event]) {
        pending.push({
          t: sample.timeStamp,
          x: sample.clientX,
          y: sample.clientY,
        });
      }
      wake(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      enqueue(event);
    };
    // Touch: a tap stamps one sticker; scrolling is never intercepted.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      previous = null;
      enqueue(event);
    };
    const onPointerLeave = () => {
      previous = null;
      carried = 0;
    };

    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerdown", onPointerDown, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);
    const stopWatching = watchReducedEffects((reduced) => {
      if (!reduced) return;
      sleep(tick);
      pending.length = 0;
      for (const slot of slots) {
        slot.live = false;
        slot.node.style.visibility = "hidden";
      }
    });

    return () => {
      sleep(tick);
      stopWatching();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerleave", onPointerLeave);
      for (const slot of slots) slot.node.remove();
    };
  }, [size]);

  return (
    <div
      aria-hidden="true"
      className="sui-k-collage-layer"
      data-pagefind-ignore
      ref={layerRef}
    />
  );
}
