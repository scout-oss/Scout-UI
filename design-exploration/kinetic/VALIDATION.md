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

## Docs initial-JS budgets (gzip bytes)

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
