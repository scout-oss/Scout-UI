# Scout UI v0.1 Alpha Package Preflight

**Milestone:** 11<br /> **Source baseline:**
`30abbc3d58eefa12266efd772c8d207eed80e419`<br /> **Status:** local alpha freeze;
packages remain unpublished, with publishable metadata guarded by Milestone 18
release workflows

This document explains the regression numbers enforced by `pnpm test:packages`.
Exact API and package-content inventories live in the machine-readable snapshots
under `tooling/package-preflight/snapshots/`.

## Method

The preflight deletes only generated `dist` directories and package-local
TypeScript build markers, bypasses the Turbo cache, rebuilds in dependency
order, and creates real `pnpm pack` tarballs. It installs those tarballs in
isolated copies of the Next.js and Vite fixtures outside the pnpm workspace
graph. No fixture imports workspace source.

Package metrics distinguish compressed npm tarball bytes from unpacked shipped
bytes. Vite probe metrics distinguish raw JavaScript from deterministic gzip
bytes. These are regression baselines for this repository and toolchain, not
claims about the final size of every consumer application.

JavaScript and declaration maps embed their referenced TypeScript source so they
remain useful outside the monorepo without shipping editable `src` trees. This
intentionally increases map bytes relative to the approved M10 artifacts.
JavaScript maps are validated against actual installed tarball inventories:
every source must be embedded or packaged, content arrays must align with source
arrays, and map file targets must match the generated JavaScript. Absolute,
escaping and private repository paths are rejected. Empty maps from empty
emitted modules remain valid. Node regression tests run through the private
fixture harness's `test` script, including the missing-source failure discovered
during M19 qualification. No budget or snapshot is automatically relaxed by this
validation.

## Approved M10 reference measurements

The first M11 audit measured the untouched M10 artifacts before README, map, or
preflight changes:

| Artifact                  | Packed/raw bytes | Gzip bytes |
| ------------------------- | ---------------: | ---------: |
| `@scout-ui/react` tarball |          103,034 |        n/a |
| Trail tarball             |           35,086 |        n/a |
| Stickers tarball          |           26,038 |        n/a |
| Sticker-only Vite probe   |           44,481 |     11,418 |
| Navbar Vite probe         |          120,558 |     31,214 |
| Navbar incremental cost   |           76,077 |     19,796 |

## Frozen M11 package baselines

| Package                   |  Packed | Unpacked |      JS |    CSS | Assets | Files | Packed budget | Unpacked budget |
| ------------------------- | ------: | -------: | ------: | -----: | -----: | ----: | ------------: | --------------: |
| `@scout-ui/react`         | 108,311 |  493,329 | 114,584 | 74,665 |      0 |    88 |       116,976 |         532,796 |
| `@scout-ui/sticker-trail` |  38,726 |  141,318 |  36,725 |  2,805 |      0 |    40 |        41,825 |         152,624 |
| `@scout-ui/stickers`      |  26,944 |  202,576 |  29,898 |      0 | 15,588 |   149 |        29,100 |         218,783 |

All values are bytes. Budgets add eight percent maintenance headroom, with a
small minimum allowance for package metadata. Maps, types, licenses, and
required attribution are never removed merely to meet a budget.

## Approved M19 JavaScript source-map repair allowance

The JavaScript maps previously referenced unavailable package sources. They now
embed the intended original package sources through `sourcesContent`. The extra
unpacked bytes are source-map/debugging payload only: executable JavaScript,
CSS, public APIs, exports and dependencies are unchanged. Declaration-map
handling is unchanged.

The explicitly approved limits below replace only the three unpacked-package
limits. They preserve the existing eight percent headroom convention over the
repaired measurements. The historical M11 baselines above remain recorded;
compressed tarball limits and all runtime bundle, docs, performance and visual
budgets remain unchanged.

| Package                   | Repaired unpacked bytes | Approved unpacked limit | Unchanged packed limit |
| ------------------------- | ----------------------: | ----------------------: | ---------------------: |
| `@scout-ui/react`         |                 609,502 |                 658,263 |                116,976 |
| `@scout-ui/sticker-trail` |                 169,229 |                 182,768 |                 41,825 |
| `@scout-ui/stickers`      |                 233,928 |                 252,643 |                 29,100 |

### M19 repair qualification, 2026-10-02

The isolated `m19-sourcemap-packaging-fix` worktree starts at
`f74c235397fc7a1163b55f4deda79d91e7bf9175`. Qualification remains **blocked**;
the repair is not committed, pushed, merged or published. M18 and M19 remain
open.

- Packed preflight, isolated Next/Vite consumers, declaration maps, public API,
  exports, content inventories and all size budgets pass. Unresolved JavaScript
  references are React `16 -> 0`, Trail `7 -> 0`, Stickers `27 -> 0`; embedded
  source coverage is `0 -> 16/16`, `0 -> 7/7`, `0 -> 27/27`. All 50 embedded
  sources match their intended package source files exactly. No unsafe source
  references or credential material were detected.
- Comparing actual old/new tarballs proves all 218 non-JavaScript-map files
  (including executable JS, CSS, declarations, declaration maps, assets and
  manifests) are byte-identical. JavaScript map structures differ only in
  `sourcesContent`, including the valid empty-module maps.
- Real normal and `CI=true` CRA/CRACO builds succeed. Fresh pre-repair builds
  emit 15 Scout UI source-map warnings each; repaired builds emit zero each.
- The Chrome 154 packed CRA runtime trial passes mouse/keyboard Button
  activation, Badge selection, Peel reveal, router navigation and direct SVG
  import. The Trail pool stays at 24 nodes. **Runtime FAIL:** the official
  definition-based SVG does not decode in Sticker or active Trail nodes. CRA's
  SVGR handling emits JavaScript as `wonky-star.086d0222f4fa50d255b2.svg` (1,629
  bytes). That malformed file is byte-identical in fresh pre-repair and repaired
  builds: this is a pre-existing consumer integration issue, not a map
  regression. No consumer workaround or runtime change was applied.
- Format, lint, typecheck, unit tests (306 Vitest plus 10 source-map regression
  cases), build, asset validation, release-policy tests, packed preflight,
  packed fixture checks, docs budgets, aggregate `check` and stable release
  dry-run pass. The dry-run prospectively produces `0.1.0` for all three
  packages, including the three repair PATCH Changesets plus the initial MINOR
  Changeset, without changing workspace versions/changelogs or publishing.
- **Security FAIL:** `pnpm audit --audit-level high` exits 1 with 1 critical, 6
  high and 6 moderate findings. The critical finding flags existing Next
  `16.3.3`; high findings flag existing `fast-uri` `3.1.6` and `brace-expansion`
  `1.1.18`/`5.0.9`. No dependency, lockfile, audit exception or security
  threshold was changed. These are audit findings, not a claim that application
  exploitability has been demonstrated.
- API/content snapshots, visual baselines, exports, dependencies, PR #9 and
  release branch remain untouched. The original M19 worktree retains its four
  original Markdown changes with identical hashes; `scout-in` remains clean.

Local generated evidence lives under `.artifacts/sourcemap-fix/`: full
`regression-*.log` files, `security-audit.json`, `final-audit.json`, both
old/new CRA build logs and `scout-consumer/output/playwright/`. These ignored
artifacts are not shipped in package tarballs. The separate stable dry-run
report is `.artifacts/release/stable/report.json`. Do not commit this repair
until the remaining security and consumer-runtime gates are genuinely green.

## Frozen M11 Vite probes

| Probe                               | Raw bytes | Gzip bytes | Raw budget | Gzip budget |
| ----------------------------------- | --------: | ---------: | ---------: | ----------: |
| Sticker through broad React root    |    44,417 |     11,417 |     47,971 |      12,331 |
| Peel through broad React root       |    52,361 |     13,668 |     56,550 |      14,762 |
| Navbar explicit leaf                |   120,094 |     31,209 |    129,702 |      33,706 |
| Navbar incremental over Sticker     |    75,677 |     19,792 |     81,732 |      21,376 |
| Trail through broad React root      |    58,593 |     15,647 |     63,281 |      16,899 |
| Standalone Trail                    |    57,954 |     15,407 |     62,591 |      16,640 |
| One direct sticker definition/asset |     1,731 |        915 |      2,243 |       1,427 |

The Sticker-only probe must contain no Navbar, Ribbon, scroll-progress, Radix
Dialog, Cursor, Peel, Stack, Trail, or official sticker-pack implementation
markers. The Navbar probe deliberately retains Radix Dialog `1.1.23`; its cost
is documented rather than hidden.

## Updating the freeze

After M11, a public contract change requires this sequence:

1. update the authoritative specification;
2. update implementation and packed fixtures;
3. add a Changeset describing release and migration intent;
4. review package/API/content and size changes;
5. run `pnpm test:packages:update` intentionally;
6. rerun `pnpm test:packages` without update mode.

Unsupported deep imports through `src`, `dist`, or implementation files are not
part of the freeze.
