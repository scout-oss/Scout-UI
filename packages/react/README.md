# @scout-ui/react

React components for sticker-led interfaces. The v0.1 surface so far is
`Sticker`, `StickerButton`, `StickerBadge`, and `StickerTrail`.

The package supports the root import plus explicit public subpaths. Import
`@scout-ui/react/styles.css` for the public stylesheet entry.

```tsx
import "@scout-ui/react/styles.css";
import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";

<Sticker source={{ id: "spark", src: "/spark.webp" }} alt="Bright spark" />;
<StickerButton href="/docs" tone="ultraviolet">
  Read the docs
</StickerButton>;
<StickerBadge mode="select" selected={selected} onSelectedChange={setSelected}>
  Motion
</StickerBadge>;
```

Explicit server-compatible subpaths are also available:

```tsx
import { Sticker } from "@scout-ui/react/sticker";
import { StickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton } from "@scout-ui/react/sticker-button";
```

All three leaves and the root barrel are unmarked, SSR-safe modules. Static
serializable usage can render in a React Server Component; event handlers belong
below a consumer-authored Client Component boundary.

`StickerTrail` and `useStickerTrail` are re-exported from the standalone
`@scout-ui/sticker-trail` package, and its leaf is the one interactive entry:

```tsx
import { StickerTrail, useStickerTrail } from "@scout-ui/react";
// or, for the narrowest client boundary:
import { StickerTrail } from "@scout-ui/react/sticker-trail";
```

That subpath carries `"use client"`. Its Trail rules are already composed into
`@scout-ui/react/styles.css`, so a broad consumer needs one CSS import and must
not also import `@scout-ui/sticker-trail/styles.css`. See the standalone
package's README for the Trail API, presets, and behaviour.

`Sticker` accepts exactly one of `source` or `children`. Source-backed artwork
uses format-neutral image semantics and defaults to no wrapper outline so
official Scout UI assets do not receive a second cut line. Consumer-rendered
content defaults to the Scout cut-line treatment and either form can choose an
explicit `outline`.

`StickerButton` renders a native button or anchor. Loading belongs only to the
button branch. `StickerBadge` renders a span in static mode, an `aria-pressed`
button in select mode, or one accessible remove button in remove mode. If a tag
needs selection and removal together, compose sibling controls inside a named
group; never nest one button inside another.

The stylesheet exposes collision-resistant `--sui-*` custom properties and
paper/night, intensity, density, forced-colors, and reduced-motion behavior.
Consumers can override variables with plain CSS; no React theme provider,
Tailwind setup, CSS-in-JS runtime, or font download is required. The exported
`scoutUiTokens` metadata is generated from that same CSS source of truth.

Intentional component hooks include the `sui-sticker`, `sui-sticker-button`, and
`sui-sticker-badge` classes plus focused variables such as `--sui-sticker-size`,
`--sui-sticker-rotation`, `--sui-sticker-badge-rotation`, and
`--sui-sticker-badge-max-width`. Broader surface, text, focus, shadow, and
motion changes should use the shared semantic tokens.
