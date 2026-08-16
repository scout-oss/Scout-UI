# Scout UI Design Context

Scout UI is an open-source React design library whose visual identity is
controlled chaos: editorial composition, tactile sticker surfaces, crisp
paper/ink contrast, hard offset depth, bounded rotation, and saturated accents.

## Product direction

The documentation product should feel like an editorial sticker book and a
serious technical reference at the same time. Reading structure stays calm and
predictable. Expression appears as a local interruption in heroes, preview
boards, contact sheets, navigation accents, and section transitions.

## Foundations

- Paper: `#F7F5EF`
- Ink: `#121116`
- Night: `#0B0A0E`
- Ultraviolet: `#7C2CFF`
- Acid: `#D4FF5F`
- Cyan: `#61DBE8`
- Hot pink: `#FF3D9A`
- Cobalt: `#1664FF`
- Orange: `#FF7A1A`

Target typography is Bricolage Grotesque for display, Inter for body/UI, and
Geist Mono for code. Until reviewed local font assets are available, use the
documented CSS variables with robust system fallbacks and no runtime font CDN.

## Layout and interaction

- Use an approximately 1240px maximum composition width.
- Use 12/8/4-column desktop/tablet/mobile grids with generous page edges.
- Keep technical body copy near a 680–760px readable width.
- Use hard shadows and strong outlines to communicate physical state.
- Keep motion local, bounded, optional, and safe under reduced motion.
- Preserve native semantics, obvious focus, forced-colors structure, touch
  targets, 320px reflow, and 200% zoom.

## Preferred patterns

- Paper editorial reading surfaces alternating with night preview boards.
- An authored component pinboard, never eight identical SaaS cards.
- StickerNavbar as the public navigation primitive.
- Page-edge sticker tabs on desktop and a conventional disclosure on mobile.
- Deterministic posters before client preview activation.

## Constraints

Must use frozen public package imports and preserve the M11 API snapshot. Keep
`../scout-in` read-only. M12 may establish typed registry infrastructure, but
must not implement M13 schemas, presets, control rendering, URL state, or share
serialization.

Avoid glassmorphism, soft generic gradients, pastel SaaS cards, excessive
rounded pills, site-wide cursor/trail effects, private source imports, external
runtime fonts, and unreviewed assets.

## M12 decision record

The authoritative Scout UI specifications already provide a complete visual
direction, so no credit-consuming 21st generation was used. M12 applies that
direction directly: calm structure, expressive interruption, server HTML first,
and the smallest practical client boundaries.
