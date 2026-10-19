# Stage 1 — Design critique of the v0.1 docs site

Audited at `origin/main` 71a4bc7 (2026-10-19) on desktop (1440×900), mobile
(390×844) and the frozen Darwin/Linux release baselines.

## The defect hiding in plain sight

**Every heading and every paragraph on the release site renders in the browser's
default serif (Times).** The docs intend Arial Black display and Inter body
(Bricolage Grotesque per `SCOUT_UI_DESIGN_SYSTEM.md` §6.1), but:

- the docs declare `@layer scout-ui-docs.reset, …` and the package declares
  `@layer scout-ui.tokens, …`;
- dotted names nest, so all docs rules live in the top-level `scout-ui-docs`
  layer, which the bundled CSS declares **before** `scout-ui`;
- the package token `--sui-font-display: inherit` therefore beats the docs
  token, resolves to nothing at `:root`, and `font-family: var(…)` falls back to
  the UA default.

The frozen visual baselines (e.g.
`tests/browser/__screenshots__/darwin/docs-content-m16-visual.spec.ts/m16-home-hero-chromium-desktop.png`)
captured that serif rendering, so the qualification evidence encodes it. This is
reported separately to the release owner; the redesign fixes it only on the
design branch with a top-level `scout-ui-kinetic` layer ordered after
`scout-ui`.

## What makes the current site generic

1. **Type has no voice.** Even with the intended fonts, every heading uses one
   weight, one width, one tracking. The brand promise is tactile; the type is
   flat. The giant `UI THAT STICKS.` is a static two-line headline with a
   coloured second line — the most common hero pattern on the web.
2. **The hero demo is a framed box.** The live StickerTrail + StickerStack sit
   inside a tilted monitor frame on the right half. It reads as "embedded demo",
   not "this page is made of the library". The instruction ("move inside this
   bounded field") is literally taped on.
3. **Repetition instead of rhythm.** Below the hero there are eight sections
   (proof strip, field guide, handoff, pack, stack row, principles, open call,
   final) and five of them are the same shape: eyebrow → H2 → paragraph →
   bordered boxes. "Make something that sticks." appears twice.
4. **The field guide is a list of cards.** Five offset paper rectangles with a
   name, a sentence and two links. None of them shows the component. The spec
   called for "full-width alternating scenes"; the build shipped a card list.
5. **The component index is a uniform card grid** despite the copy claiming "not
   forced into an identical card grid". Signature and foundation items differ
   only by number.
6. **The sticker pack is a spreadsheet.** 25 tiles, each with a `<details>`
   disclosure. Nothing invites you to pick a sticker up, compare it or take it
   with you; the import path is buried in the disclosure.

## Where the hierarchy is weak

- The navbar (8 links + GitHub + Search + CTA) competes with the hero; at
  1024–1440px with real fonts the links overflow under the brand.
- Section headings are all the same size; nothing signals "this is the part that
  matters".
- Primary CTA ("Browse components") and secondary ("GitHub") have equal visual
  weight in both the hero and the final section.
- Component pages bury the name: a 5rem serif H1 next to a badge and code chip,
  then three equal buttons.

## Interactions that feel lifeless

- Hover on most surfaces is a 2px translate with a linear-ish ease; press
  feedback is inconsistent between docs buttons and package buttons.
- Copy Code / Copy Prompt / Share change their label text and nothing else.
- Preset buttons, contact-sheet tiles, and index cards have no press state.
- Route changes are instant cuts; nothing tells you that you arrived.
- No motion anywhere uses physics, although the brand language (§11.1) is
  written in springs.

## Wasted opportunities

- **The tagline is a physics description.** "UI that sticks" begs for type that
  you can pull off and that sticks back. The site never demonstrates sticking.
- **Bricolage Grotesque is a variable font** with `opsz`, `wdth` and `wght` axes
  — perfect for type that responds to pressure — and it is not loaded.
- **Stickers are physical objects**: peel, lift, carry, slap down, settle. That
  life-cycle is a ready-made motion grammar the site ignores.
- **The official pack is the most shareable asset** and has no "play" mode.
- **Eight components, zero live tiles on the index**. Visitors read about a peel
  instead of peeling.
