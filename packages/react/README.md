# @scout-ui/react

React components for sticker-led interfaces. The v0.1 surface so far is
`Sticker`, `StickerButton`, `StickerBadge`, `StickerTrail`, `StickerCursor`, and
`StickerPeel`, and `StickerStack`.

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

`StickerPeel` is a progressively enhanced disclosure. Its leaf is a narrow
Client Component entry because it owns focus management and optional pointer
dragging; the root barrel itself remains unmarked.

```tsx
import { StickerPeel } from "@scout-ui/react/sticker-peel";

<StickerPeel
  front={<span>What is underneath?</span>}
  back={<a href="/answer">The revealed answer</a>}
  drag
  origin="top-right"
/>;
```

Both layers remain mounted, while the inactive layer is `inert` and hidden from
assistive technology. The named button is always the complete keyboard, touch,
and reduced-motion interaction; dragging begins only from that grip. `peelSize`
accepts a CSS length, or a number interpreted as pixels and clamped to 36–320px.
Use Peel for short secondary disclosures—not required notices, long documents,
or irreversible actions. Public styling hooks are `.sui-sticker-peel` and
`--sui-peel-size`, `--sui-peel-front`, `--sui-peel-back`,
`--sui-peel-underside`, and `--sui-peel-ink`.

`StickerStack` renders a bounded, accessible stack from consumer data. Its
interactive leaf is a narrow Client Component entry; the root barrel remains
unmarked.

```tsx
import { StickerStack } from "@scout-ui/react/sticker-stack";

<StickerStack
  items={notes}
  getKey={(note) => note.id}
  renderItem={(note, { active }) => (
    <article>
      <h2>{note.title}</h2>
      <button disabled={!active}>Pin note</button>
    </article>
  )}
  drag
  keyboard
/>;
```

The defaults are `visibleCount={3}`, `loop={false}`, `axis="x"`, `drag={false}`,
and `keyboard={false}`. Native previous/next buttons remain available even when
dragging or arrow-key navigation is enabled. Only the active card is exposed to
interaction and assistive technology; background cards are inert. Stable keys
preserve the active item through reordering, the rendered window stays bounded,
and pointer progress is written once per animation frame without React renders.
Use `empty` for the zero-item state and `disabled` to suspend every navigation
path. Public styling hooks include `.sui-sticker-stack` and
`--sui-stack-surface`, `--sui-stack-ink`, `--sui-stack-accent`,
`--sui-stack-control-surface`, `--sui-stack-card-min-inline`, and
`--sui-stack-card-min-block`.

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
