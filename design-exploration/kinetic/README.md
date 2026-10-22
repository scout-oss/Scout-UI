# Kinetic design exploration — "Pressure-sensitive"

**Status:** design exploration on branch `design/kinetic-overhaul` (worktree,
off `origin/main` 71a4bc7). Not part of the v0.1 release candidate. Nothing is
committed, pushed, merged, published or deployed without explicit approval.

| Document                                           | Stage                         |
| -------------------------------------------------- | ----------------------------- |
| [01-CRITIQUE.md](01-CRITIQUE.md)                   | 1 — audit of the v0.1 site    |
| [02-RESEARCH.md](02-RESEARCH.md)                   | 2 — references and techniques |
| [03-DIRECTION.md](03-DIRECTION.md)                 | 3 — creative direction        |
| [PUBLIC_API_PROPOSALS.md](PUBLIC_API_PROPOSALS.md) | proposals needing approval    |
| [VALIDATION.md](VALIDATION.md)                     | 5–6 — evidence                |

## Scope boundaries

- **Docs app only** (`apps/docs`). No file under `packages/` changed; public
  component props, behaviour, accessibility contracts and package APIs are
  untouched. Package size budgets and API snapshots are therefore unaffected.
- **Frozen release baselines untouched.** New candidate screenshots live in
  `tests/browser-kinetic/__screenshots__/`, run by a separate config
  (`apps/docs/playwright.kinetic.config.ts`) that neither the fixture nor the
  docs release configs can discover.
- **`../scout-in` read-only** — consulted for fonts/visual language only.
- New docs-only dependencies: `@fontsource-variable/bricolage-grotesque` and
  `@fontsource-variable/inter` 5.3.0 (OFL-1.1, font files only, no JS).

## Where the code lives

```text
apps/docs/lib/kinetic/        ticker (shared, self-sleeping rAF), spring,
                              reduced-effects store, grab intent + velocity,
                              on-screen / skim detection
apps/docs/components/kinetic/ KineticHeadline, VelocityStrip, SpecimenSheet,
                              SpecimenStage, StickerDesk, Magnetic,
                              RevealObserver, SplitWords, SplitChars
apps/docs/components/kinetic/collage-trail.tsx
                              docs-level printed-matter collage trail (hero)
apps/docs/public/collage/     12 original collage stickers (WebP + SVG source)
tooling/docs-collage/         generator for the collage stickers (sharp/rsvg)
apps/docs/app/kinetic.css     top-level `scout-ui-kinetic` cascade layer:
                              tokens, motion grammar, all new layouts
```

## Running it

```bash
pnpm --filter @scout-ui/docs build
pnpm exec playwright test --config apps/docs/playwright.kinetic.config.ts
```

## Known follow-ups (post-approval)

- Remove the orphaned v0.1 homepage/pinboard rules from `globals.css`
  (deliberately left in place so the redesign stays trivially revertible).
- Approve or discard the candidate baselines, then decide how they replace the
  v0.1 docs baselines in a release that intends to ship the redesign.
- The v0.1 docs visual suites will fail on this branch by design (new design);
  they must not be updated to accept it on a release branch.
