# @scout-ui/sticker-trail

A bounded, container-scoped sticker trail for React. Stickers appear along the
pointer path according to distance travelled and velocity, then fade away.

This is the standalone flagship package. It has no dependency on
`@scout-ui/react` or `@scout-ui/stickers`, so it works with your own artwork and
without the broader library. If you already use `@scout-ui/react`, the same
component is re-exported there and its CSS is already included.

## Install

```sh
npm install @scout-ui/sticker-trail react
```

React is a peer dependency and is not bundled. The package is ESM-only, safe to
evaluate during SSR, and carries a narrow `"use client"` boundary because its
entire public runtime is interactive.

## Use

```tsx
import { StickerTrail } from "@scout-ui/sticker-trail";
import "@scout-ui/sticker-trail/styles.css";

const stickers = [
  { id: "star", src: "/stickers/star.svg", width: 96, height: 96 },
  { id: "spark", src: "/stickers/spark.svg", width: 96, height: 96 },
];

export function Hero() {
  return (
    <StickerTrail preset="scout" stickers={stickers}>
      <h1>UI that sticks.</h1>
    </StickerTrail>
  );
}
```

Import this stylesheet only when installing the standalone package. A
`@scout-ui/react` consumer imports `@scout-ui/react/styles.css` instead, which
already contains these rules exactly once.

## Lower-level hook

When a wrapper element is not acceptable, drive your own container and layer:

```tsx
import { useStickerTrail } from "@scout-ui/sticker-trail";

const containerRef = useRef<HTMLDivElement>(null);
const layerRef = useRef<HTMLDivElement>(null);
const trail = useStickerTrail({ containerRef, layerRef, stickers });
```

The returned controller exposes `clear()`, `pause()`, and `resume()`.

## Presets

`calm`, `scout` (default), `dense`, `floaty`, and `chaos`. Presets set tuned
defaults; any explicit option overrides them, and the engine then clamps
everything to its own safety bounds. `chaos` widens scale and rotation variance
but never raises the active-node maximum above `dense`.

## Behaviour worth knowing

- Pointer movement never updates React state. Coordinates, velocity, and slot
  lifecycles live in an imperative engine driven by one animation frame.
- The node pool is fixed at `maxActive` and recycled; sustained movement does
  not grow the DOM. A pointer teleport or a return from a background tab resets
  the segment instead of backfilling it.
- Coordinates are container-local and stay correct when the container is
  positioned, padded, bordered, scrolled, or resized.
- The layer is decorative: `aria-hidden`, `pointer-events: none`, and never a
  tab stop. Controls and text underneath stay clickable and selectable.
- The trail is suppressed entirely under `prefers-reduced-motion`, under forced
  colors, and on coarse pointers. Touch devices can opt into `touch="tap"`,
  which spawns one sticker per deliberate tap and never captures the pointer or
  blocks scrolling.
- Server rendering emits a deterministic, inert pool, so hydration is stable.

## Styling

Public custom properties are documented; `--sui-trail-internal-*` variables are
engine-owned and may change without notice.

| Property            | Purpose                                 |
| ------------------- | --------------------------------------- |
| `--sui-trail-layer` | Stacking order of the decorative layer. |

React is a peer dependency and is never bundled. React DOM is neither bundled
nor required by the standalone package.

Only the root, `styles.css`, and `package.json` exports are public. Imports
through `src/`, `dist/`, or engine internals are unsupported.
