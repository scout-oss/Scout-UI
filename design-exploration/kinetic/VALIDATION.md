# Stages 5–6 — Refinement and validation evidence

Environment: macOS (Darwin), Node 24.10.0, pnpm 11.21.0, Playwright 1.62.1
(Chromium 151), production `next build --webpack` + `next start`, one worker.
Branch `design/kinetic-overhaul` off `origin/main` 71a4bc7, uncommitted.

## Results

| Check                                                                                     | Result                                                                                       |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm --filter @scout-ui/docs lint` (ESLint + Stylelint)                                  | PASS                                                                                         |
| `pnpm --filter @scout-ui/docs typecheck` (app, type tests, browser tests)                 | PASS                                                                                         |
| `pnpm --filter @scout-ui/docs test` (Vitest)                                              | PASS — 7 files, 116 tests                                                                    |
| `prettier --check .`                                                                      | PASS                                                                                         |
| `pnpm --filter @scout-ui/docs build` + Pagefind                                           | PASS — 46 static pages, 36 indexed                                                           |
| Docs route budgets (`tooling/docs-performance`)                                           | PASS — 12/12 routes (table below)                                                            |
| v0.1 docs **behaviour** suite (copy-code, docs, m16, m17, playground, prompt; 8 projects) | PASS — **132 passed / 0 failed** (same count as M19 qualification), twice on the final logic |
| M17 homepage runtime test, repeated ×5 after the fix                                      | PASS ×5 — 0 running animations, 0 pending frames, CLS 0, 0 long tasks                        |
| Kinetic suite (`playwright.kinetic.config.ts`, 7 projects)                                | PASS — **37 passed / 0 failed**                                                              |
| Frozen release baselines (`tests/browser/__screenshots__`)                                | Untouched (`git status` clean for `tests/browser`)                                           |
| `packages/*`                                                                              | No file changed → package budgets, API snapshots, consumer fixtures unaffected               |

Not run: the v0.1 docs **visual** suites. They compare against the frozen v0.1
look and are expected to fail on a redesign branch; they were deliberately not
run with any update flag. Fixture-harness suites were not run because no package
changed.

## Collage trail (ugly.cash-style, added after the first commit)

| Check                                                                              | Result                                                                                          |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Scripted sweep (same path used to measure ugly.cash)                               | 48 live at saturation, 12 distinct artworks, unique z per sticker (newest on top)               |
| 1.1s after the pointer stops                                                       | 0 visible stickers, 0 pending frames, 0 running animations                                      |
| Kinetic suite incl. 5 collage tests (3 desktop engines, touch tap, reduced motion) | PASS — 42 passed / 0 failed                                                                     |
| React commits during the sweep                                                     | 0 (DevTools-hook probe)                                                                         |
| Primary actions stay hit-testable above the collage                                | PASS (`elementFromPoint`)                                                                       |
| Artwork weight                                                                     | 12 WebP, 232 KB total, fetched only after the first pointer interaction; not part of initial JS |

| Route                       | main (M19 evidence) |           This branch |  Budget |
| --------------------------- | ------------------: | --------------------: | ------: |
| `/`                         |             238 145 |               249 430 | 285 000 |
| `/components`               |                   — |               223 509 | 285 000 |
| `/components/*` (5 routes)  |             238 345 |               239 222 | 285 000 |
| `/playground/sticker-trail` |                   — |               238 663 | 320 000 |
| `/stickers`                 |       788 991 (raw) | 251 808 (816 285 raw) | 285 000 |
| `/examples`                 |                   — |               194 839 | 285 000 |
| `/guides/accessibility`     |                   — |               195 590 | 245 000 |

Homepage +11.3 KB gzip for the hero engine, desk, specimen sheet, velocity strip
and shared spring/ticker — with no animation library. Pagefind and Shiki remain
absent from initial scripts (Pagefind 715 694 / 45 555 bytes; Shiki worker 173
573 bytes). Fonts (not JS): Bricolage 131 KB + Inter 48 KB woff2, preloaded,
`font-display: optional`.

## Kinetic suite coverage (`tests/browser-kinetic/kinetic-behavior.spec.ts`)

- Hero `h1` keeps the accessible name "UI THAT STICKS."; letter art is
  `aria-hidden`.
- Pointer pressure, carry and throw: **zero React commits** (DevTools-hook
  probe), letter returns to exactly `translate3d(0,0,0) rotate(0)`, rAF loop
  drains to 0 — Chromium, Firefox and WebKit desktop.
- "Test the adhesive" via keyboard; settles to 0 frames and 0 animations.
- Touch: letters keep `touch-action: pan-y` (vertical scroll never stolen).
- `/`, `/components`, `/stickers` under OS reduced motion: 0 running animations,
  reveals never armed, axe clean.
- Footer "Reduce effects" persists across reload and disarms kinetic motion.
- 320px reflow without horizontal overflow on the three new surfaces.
- Velocity strip: coasts, stops, releases frames; scroll causes only the bounded
  one-time specimen mounts (≤ 8 commits), never per-frame renders.
- Desk: labelled `role="img"`, decorative items, keyboard Shuffle/Tidy with
  polite announcements, settles to 0 frames.
- Inspector: selection state, copy-import writes the exact public import,
  playground deep link carries an encoded config.
- Specimen sheet: 8 specimens with headings and playground links; axe clean in
  default and **forced-colors**; engines mount only near the viewport.
- Candidate baselines (separate folder): hero, specimens, drawer, rules/final,
  components index, sticker drawer, component title, mobile hero.

## Defects found and fixed during refinement

1. Release fonts fell back to Times (cascade-layer nesting) — fixed on this
   branch with a top-level `scout-ui-kinetic` layer; reported for the RC.
2. Real fonts made the desktop navbar overflow under the brand — compacted in
   docs CSS; package fix proposed (P1).
3. Word-split titles broke contiguous title text in server HTML (SEO / three
   release tests) — titles now keep one text node with a decorative split layer.
4. Late IntersectionObserver entries during fast/smooth scrolling started
   offscreen entrances that were still running after scrolling stopped — added
   live on-screen checks and speed-based "skimming" (entrances resolve instantly
   above 4000 px/s; lazy mounts wait for the skim to end).
5. Specificity let entrance rules beat the instant override (twice) — fixed.
6. Font swap reflowed the control rail after first paint — fonts now
   `optional` + preloaded.
7. "Customized" vs "Canonical" badge width re-wrapped the rail title, moving
   following content 36px — badge width stabilised.
8. Stored "Reduce effects" was applied after the reveal observer armed —
   preference now read directly and changes disarm live.
9. Forced-colors contrast failure on the ultraviolet verb chip — system colours.
10. Hero hint promised grabbing while reduced effects made letters inert —
    hidden when reduced.

## Known limitations / follow-ups

- A visitor with a stored "Reduce effects" preference (but no OS setting) still
  sees the first-paint CSS entrance on reload, because the preference is applied
  after hydration (pre-existing behaviour of `EffectsControl`). A pre-paint
  inline script would fix it; needs a hydration-warning decision.
- `globals.css` still contains the orphaned v0.1 homepage/pinboard rules
  (intentionally, for a trivially revertible diff).
- Candidate baselines exist for Darwin only; Linux CI baselines would be
  generated on approval.
- Live studio sites were analysed via fetched content and HTTP; heavy WebGL
  references could not be rendered while the browser pane was hidden.

## Round 4 — navbar, turning smiley, footer, new art everywhere (2026-10-20)

| Check                                                                                                       | Result                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Docs lint, typecheck, unit tests (116; 52 codegen/prompt snapshots updated for the intended own-art output) | PASS                                                                                                              |
| Docs route budgets                                                                                          | PASS 12/12 — home 245 092 gzip (down from 249 430: the playground no longer bundles official sticker definitions) |
| v0.1 docs behaviour suite (8 projects)                                                                      | 131 passed / 1 failed — see "search race" below; forced-colors project 8/8 after fixes                            |
| Kinetic suite (7 projects, incl. new navbar/smiley/footer tests)                                            | PASS 50/50 against regenerated candidate baselines                                                                |
| WebKit hero test after the ResizeObserver fix                                                               | PASS 5/5 (was a reproducible "ResizeObserver loop" page error)                                                    |

Release-test file touched intentionally:
`tests/browser/playground-behavior.spec.ts` locates the Sticker preview by its
default artwork id; the default changed from `sunny-smile` to `pixel-heart` at
the user's request (one locator, same assertion).

**Search race (pre-existing, not hidden):** `docs-behavior.spec.ts:121` clicks
`getByRole("link", { name: /installation/iu })` right after typing. Once
Pagefind results render, two links match (the Installation guide and the Guides
index "01 Installation") on both `origin/main` and this branch (identical result
sets, captured in both builds). Measured: main 0/20, this branch 1/10 — the
heavier homepage only shifts timing. Suggested maintainer fix: target the result
by href or an exact name. The test was not modified.

## Round 5 — realistic peel, enamel/foil badges, deck stack, dark gallery (2026-10-21)

Package opt-ins (`StickerPeel appearance="realistic"`, `StickerBadge finish`,
`StickerStack appearance="deck"`) ship in `@scout-ui/react` with unchanged
defaults; the docs showcase pages (home, components, stickers, playground index)
move to a dark gallery art direction in `apps/docs/app/gallery.css`.

| Check                                                              | Result                                                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `@scout-ui/react` lint, typecheck, unit tests                      | PASS — 107/107 (new realistic-peel geometry, deck and finish tests)                             |
| Package preflight (`pnpm test:packages`)                           | PASS against re-baselined tarball and size snapshots (see below); public API snapshot unchanged |
| Package fixture browser suite (frozen v0.1 visuals)                | PASS 590/590 — defaults render exactly as before                                                |
| Docs lint, typecheck, unit tests                                   | PASS — 116; codegen/prompt snapshots updated only for the new registry defaults                 |
| Docs route budgets                                                 | PASS 12/12                                                                                      |
| v0.1 docs behaviour specs (non-visual, 8 projects)                 | PASS 132/132                                                                                    |
| axe (9 routes + search and mobile menu) default / forced / reduced | 0 violations in all three modes                                                                 |
| Kinetic suite                                                      | PASS 50/50 against regenerated candidate baselines                                              |

The frozen v0.1 docs visual specs (`*-visual.spec.ts`) fail by design against
the redesign, as in earlier rounds; their baselines were not touched.

**Size re-baselines needing release sign-off**
(`tooling/package-preflight/snapshots/size-budgets.json`):
`nonNavbarInteractive` gzip 14 762 → 15 501 B, raw 56 550 → 58 411 B;
`@scout-ui/react` packed 116 976 → 121 866 B, unpacked 658 263 → 677 715 B.
Tarball contents gain `dist/sticker-peel/peel-realistic.*` (4 files).

Defects found and fixed during this round:

- Enamel badge background dropped entirely: a bare colour in a non-final
  `background` layer (via `var()`) invalidates the declaration at computed time.
  Wrapped in `linear-gradient()`.
- Gallery accent token reused the existing per-specimen `--sui-k-accent` name;
  renamed `--sui-k-lit` (violet-on-black contrast failure).
- Dark-gallery text leaked into the playground's light panels; scoped out.
- Forced colours: gallery tokens remap to system colours; smoked-glass navbar
  pills get Canvas/Highlight; the mobile Customize label inherits.
- WebKit collage ribbon under-stamped (19/20) because a blurred shadow under
  each giant letter repainted per stamp; the blur was removed.
- Hero CTAs as full pills put the corner hit-point outside the shape; squarer
  radius restores the whole box as the target.
- `preflight` fixture regression from commit 83616f6 (example imported a
  docs-only module); examples now inline own-art sources.
