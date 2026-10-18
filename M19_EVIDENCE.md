# M19 repository-side release-candidate evidence

Status: **Repository-side qualification at `6de9c75` is not clean: M19-001 is
resolved; the full local Darwin Chromium matrix had an intermittent Navbar
outside-click failure (M19-002), since classified as a test-timing race with a
test-only fix proposed in PR #35. M18 and M19 remain OPEN.** The external
release gates 025–029 are BLOCKED pending separate authorization and were not
run. No publication, tag, release, deployment or other external mutation
occurred.

This document supersedes the 3 October qualification of `f74c235`, which stopped
at M19-001 (published JavaScript source maps). That defect, and the CRA/CRACO
SVG and dependency-advisory blockers found afterwards, were repaired in PR #22
and are re-verified below against current `main`.

## Identity and isolation

- Source SHA: `6de9c75fee13934fe8ce86a1d7b963f4c43ae241` (`origin/main`; merge
  of PR #33 on top of PR #22's merge `7434d32`).
- Changes since the previous qualification source `f74c235`: `6ccafb3`,
  `175d17d`, `7680b9a`, `2ca4581`, `5741038`, `305052c`, `774012a`, `fcac07e`,
  `424a1a6`, `02d50a4` (PR #22) and `7085c0f` (PR #33).
- Working branch: `m19-qualification-rerun`, a fresh git worktree created from
  `origin/main` with no `node_modules`, `dist`, `.next` or Turbo output.
- The earlier `m19-final-qa-release-candidate` checkout, including its
  uncommitted documents, was not modified; these two documents started as copies
  of its files.
- Frozen lockfile install from the shared pnpm content store. Every Turbo run
  used `TURBO_FORCE=true` and `TURBO_CACHE=local:` (0 cache hits). Docs builds
  used `SCOUT_UI_DOCS_ORIGIN=https://design.scoutapp.in`.
- Browser runs used `--update-snapshots=none`. No snapshot, baseline, budget or
  assertion was updated or relaxed.
- `scout-in` is clean at `170f55c` and was only read.

Environment: macOS 26.6.2 (25G83), arm64; Node 24.10.0; pnpm 11.21.0; Playwright
1.62.1 (Chromium 151.0.7922.34). The release workflow pins Node 24.18.0; this
local run does not claim that exact patch or a Linux execution.

Logs and reproduction inputs are under the ignored `.artifacts/m19-rerun/`
directory (`results.tsv`, `logs/`, `tarballs/`, `source-map-audit.json`,
`independent-consumers/`). None is committed.

## Remote state observed read-only

GitHub Actions on `6de9c75` (push): CI `39105333777` success (Quality and
packages), Security `39105333771` success (CodeQL; Dependency Review is PR-only
and skipped on push), Visual `39105333775` success (Linux visual contract),
Browser `39105333783` success (Interaction and accessibility matrix: 547 fixture
and 132 docs tests passed, 0 failed, retries allowed by CI config but no flaky
results reported).

Release PR `39105333785` **failed**: `HttpError: Bad credentials` while creating
or updating the version PR. The `RELEASE_PR_TOKEN` secret is invalid or expired.
As a result PR #9 (`changeset-release/main`) is still at `d3ac35b`, last updated
15 September, and does not include the four patch Changesets that landed in PR
#22. A maintainer must rotate the secret; nobody should edit PR #9 by hand.

Docs Production `39101733868` (`7434d32`) is waiting for environment approval
and `39105570098` (`6de9c75`) is pending. Neither was approved. There are no
tags, no GitHub releases and no npm publication.

## Root qualification commands

| Command                                   | Result                                                        |
| ----------------------------------------- | ------------------------------------------------------------- |
| `corepack pnpm install --frozen-lockfile` | PASS                                                          |
| `corepack pnpm format`                    | PASS                                                          |
| `corepack pnpm lint`                      | PASS, 13 tasks, 0 cached                                      |
| `corepack pnpm typecheck`                 | PASS, 8 tasks, 0 cached; includes public type tests           |
| `corepack pnpm test`                      | PASS, 306 Vitest + 23 Node tests                              |
| `corepack pnpm build`                     | PASS, 46 static pages; Pagefind indexed 36 HTML files         |
| `corepack pnpm lint:assets`               | PASS                                                          |
| `corepack pnpm test:release`              | PASS, 9 tests and 8 workflow policies                         |
| `corepack pnpm test:packages`             | PASS, snapshots verified, including JavaScript-map validation |
| `corepack pnpm test:fixtures`             | PASS, packed Next/Vite, 40 code samples, artwork decode, CRA  |
| `corepack pnpm test:docs-budgets`         | PASS, all 12 measured routes                                  |
| `corepack pnpm audit --audit-level high`  | PASS, 0 critical, 0 high, 8 moderate                          |
| `corepack pnpm release:dry-run`           | PASS, versions 0.1.0, `distTag: none`, nothing published      |
| `corepack pnpm check`                     | PASS, aggregate rerun with cache bypass                       |

Unit totals: React 99, Trail 83, Stickers 1, test utilities 7, docs 116;
fixture-harness/package-preflight Node tests 14 (including the JavaScript-map
regressions); glob-matcher compatibility 9.

## M19-001 resolution: JavaScript source maps

**Resolved.** `175d17d` embeds original sources in published JavaScript maps,
`2ca4581` extends packed-package preflight to every JavaScript-family map, and
the Engineering Spec and `PACKAGE_PREFLIGHT.md` document the contract. Patch
Changesets exist for all three packages.

Independent check: the three 0.0.0 tarballs were installed into separate
consumers outside the repository tree, and a separate script
(`.artifacts/m19-rerun/map-audit.mjs`) inspected every installed `*.js.map` and
`*.mjs.map`:

| Installed package         | JS maps | Sources | Embedded | Missing or absolute |
| ------------------------- | ------: | ------: | -------: | ------------------: |
| `@scout-ui/react`         |      21 |      16 |       16 |                   0 |
| `@scout-ui/sticker-trail` |       9 |       7 |        7 |                   0 |
| `@scout-ui/stickers`      |      30 |      28 |       28 |                   0 |

(Maps of type-only modules have no sources.) Previously 50 of these references
were unresolvable. The packed CRA/CRACO build now reports **0**
`Failed to parse source map` warnings in both normal and CI mode, and the
harness asserts zero.

## Public contracts and independent installs

Exactly three public manifests are publishable, ESM-only and explicitly public;
all other workspaces remain private. `public-api.json` is unchanged since
`f74c235`, and package preflight verifies exports, declarations, maps, peers,
client boundaries and the exact tarball inventory.

Three temporary consumers, each outside any ancestor `node_modules`, installed
only the package under test and its legitimate dependencies, then passed:

- React: eight root exports, Button subpath, static SSR with no browser globals
  or official pack, PNG source, private deep import rejected.
- Trail: standalone SSR with a consumer WebP source; neither `@scout-ui/react`
  nor `@scout-ui/stickers` resolvable; private deep import rejected.
- Stickers: root and definition imports, 25 definitions, CC0 licence, React not
  resolvable, private deep import rejected.

A first attempt placed these consumers inside the worktree's ignored
`.artifacts/` directory. There the Stickers "React absent" assertion failed only
because Node resolved `react` from the repository root's `node_modules`; moved
outside the repository, all three pass. Log:
`.artifacts/m19-rerun/logs/independent-consumers.log`.

## Scout-like CRA/CRACO consumer

The fixture is now checked in at `tooling/fixtures/cra-consumer` and runs as
part of `test:fixtures`: React/React DOM 19.0.0, react-scripts 5.0.1, CRACO
7.1.0, React Router 7.18.4, Tailwind 3.4.17, PostCSS 8.5.28. It installs the
packed tarballs with a frozen lockfile.

Result: normal and CI builds PASS with 0 source-map warnings; every official
artwork response is `image/svg+xml` and decodes; the runtime exercises a counter
button (click and Enter), a selection Badge, Peel, router navigation, and a
24-node Trail pool that emits and stays at 24 nodes. Report:
`.artifacts/cra-consumer/report.json`.

Fixture-only audit (`tooling/fixtures/cra-consumer`): 0 critical, 0 high, 2
moderate (sprintf-js, postcss-selector-parser), 1 low (@tootallnate/once). The
fixture deliberately removes webpack-dev-server, so `craco start` is unavailable
there; only `craco build` is part of the contract. This is a fixture limitation,
not a package limitation.

## Exact tarballs and size measurements

Source tarballs (version 0.0.0; not release artifacts):

| Filename                           | Packed bytes | Unpacked bytes | Files | SHA-256                                                            |
| ---------------------------------- | -----------: | -------------: | ----: | ------------------------------------------------------------------ |
| `scout-ui-react-0.0.0.tgz`         |       107466 |         609502 |    88 | `408bf553829d3d5b06c36d273707f5168e2039ddf03c8bad2636a03f17ad723a` |
| `scout-ui-sticker-trail-0.0.0.tgz` |        36902 |         169229 |    40 | `8ab08939515cc0305d2c6e168048bbf6d2d0e030fbe05bd19e034b570c8991a7` |
| `scout-ui-stickers-0.0.0.tgz`      |        28976 |         241974 |   151 | `e69c89d10e4ada43af38ea187e64a494fea206cda96d98f24e930761a4681ac1` |

All three hashes equal those recorded by the PR #22 integration qualification at
`5741038`; the later PR #22 and PR #33 commits changed only private tooling,
fixtures, tests and docs, so the public packages are byte-identical.

Isolated Changesets dry-run tarballs (not the merged release candidate):

| Filename                           | Packed bytes | SHA-256                                                            |
| ---------------------------------- | -----------: | ------------------------------------------------------------------ |
| `scout-ui-react-0.1.0.tgz`         |       107467 | `35adf69f09f60bf1843530ff147f6a1a872eea727f4e0926f9975334b0d20419` |
| `scout-ui-sticker-trail-0.1.0.tgz` |        36904 | `ad5fcea4ca46bbc06504d8cefaf3e6963e131e2cf96680b90239d9bc29045dc1` |
| `scout-ui-stickers-0.1.0.tgz`      |        28972 | `00ff108ebf69a383f80cf849b0e83c86f8a376b5fc3bb59d65c93c736c9a18b9` |

`changeset status --verbose` resolves all three packages to 0.1.0 from the
initial minor Changeset plus the source-map patches (and the Stickers
bundler-safe URL patch). The dry run verifies changelogs, the exact React to
Trail 0.1.0 dependency, Next/Vite and docs installs from those tarballs, the
production canonical origin, no publication and `distTag: none`.

All package and bundle budgets pass. PR #22 raised the three unpacked-byte
budgets (React 532796 → 658263, Trail 152624 → 182768, Stickers 218783 → 252643)
for embedded map sources; packed budgets are unchanged. Representative raw/gzip
bytes: Sticker root 44486/11422, Cursor 56811/15037, Stack 56610/14753, Navbar
120492/31184, broad Trail 58632/15639, standalone Trail 57993/15400, single
sticker 1744/917. Report: `.artifacts/package-preflight/report.json`.

All 12 docs route budgets pass. Home: 773078 raw / 238145 gzip; component pages
773645 / 238345; Trail playground 781185 raw; Stickers 788991 raw. Pagefind
1.5.2 index/runtime: 715551/45555 bytes. Shiki worker: 173573 bytes. Pagefind
and Shiki are absent from initial route scripts.

## Browser, visual, accessibility and performance

All runs: production builds (`next start` for docs and the packed Next fixture;
`vite preview` for the packed Vite fixture), one worker,
`--update-snapshots=none`. The interaction runs also pass `--ignore-snapshots`,
as in the Browser workflow; screenshot contracts run separately in the Visual
set.

| Run                                   | Projects                   | Passed | Failed | Skipped by project rules |
| ------------------------------------- | -------------------------- | -----: | -----: | -----------------------: |
| Fixture interaction and accessibility | all 8                      |    544 |  **3** |                      669 |
| Docs interaction and accessibility    | all 8                      |    132 |      0 |                      668 |
| Fixture visual, Darwin baselines      | 4 Chromium visual projects |     43 |      0 |                      129 |
| Consumer visual, Darwin baselines     | chromium-desktop           |      4 |      0 |                        0 |
| Docs visual, Darwin baselines         | 4 Chromium visual projects |     89 |      0 |                      443 |

Per project (fixture passed/failed, docs passed): chromium-desktop 136/1, 95;
firefox-desktop 64/0, 4; webkit-desktop 64/0, 4; chromium-tablet 54/0, 4;
webkit-mobile 55/0, 4; chromium-reduced-motion 55/1, 8; chromium-coarse-pointer
57/1, 5; chromium-forced-colors 59/0, 8. The Linux Browser workflow on the same
SHA reports the same totals with 0 failures (547 and 132 passed).

Automated axe tests: 106 fixture and 21 docs, all passing, with no critical or
serious violation. Keyboard, focus trap/return, reduced motion, forced colors,
coarse pointer/touch and 320 px reflow assertions pass in their projects. All
136 Darwin screenshot comparisons match, and the 377 tracked baselines (Darwin,
Linux, Win32, `_original-platform`) are byte-identical after the run.

Performance and cleanup (Chromium, this Mac): Cursor 30 s sustained movement
with 0 React commits, 0 long tasks, frame p95 17.5 ms, listeners/observers equal
before and after; Trail p95 17.0 ms, peak 9 of 24 active nodes, 0 idle nodes
after expiry, ceiling run 48/48 bounded; Navbar 0 React commits during progress,
0 pending frames at rest; Stack at most 4 rendered and 1 outgoing card; Peel and
Stack 0 frames after settle. Listener and observer counts match before and after
every run. These are machine-specific reference numbers, not cross-browser
claims.

### M19-002: intermittent Navbar outside-click dismissal (classified: test race)

`navbar.spec.ts:241` ("Escape, explicit close, and outside interaction close and
return focus") failed in chromium-desktop, chromium-reduced-motion and
chromium-coarse-pointer. In each failure the Escape and Close-button steps pass;
on the third opening, a pointer click on the overlay 5 px inside its bottom-left
corner leaves the Radix Dialog open after 5 s. The same test passed in Firefox,
WebKit, chromium-tablet and webkit-mobile in the same run, and on Linux CI.
Artifacts: `.artifacts/m19-rerun/failures/fixture-interaction/`.

Characterization (no test, timeout, retry setting or product code was changed on
this branch):

- Not a regression from PR #22 or #33. At `f74c235` (scratch worktree, same
  command) it failed in chromium-tablet and chromium-reduced-motion on the first
  pass. Repeated 10 times per Chromium project: `f74c235` 39/40, `6de9c75`
  40/40. The Radix Dialog (1.1.23) and DismissableLayer (1.1.19) versions are
  the same at both commits.
- A standalone script replaying the test's exact sequence against the packed
  Next fixture failed 2 of 2 while the full matrix was loading the machine, and
  passed 20 of 20 immediately and 20 of 20 after a 300 ms pause when the machine
  was idle.
- In the failing trace the overlay click arrives about 9 ms after the dialog
  becomes visible. The overlay is the hit target, focus is on the Close button
  and `body` has `pointer-events: none`, which is the expected modal state.
- A manual check on the production docs (in-app Chromium, 375×812) at human
  speed closed the menu with Escape, the Close button and an overlay click, and
  returned focus to the trigger each time.
- A second complete fixture interaction run afterwards (17.6 min) reported 547
  passed, 0 failed, 669 skipped. **Caveat:** a diagnostic Next server started
  for the replay above was still bound to port 4310, so the harness's own Next
  server failed with `EADDRINUSE` and the run's Next-fixture pages were served
  by that stale process from the same packed-consumer directory while the
  harness rebuilt it. Treat this run as unreliable characterization only. The
  first, failing run, the visual runs and the 10× repeats show no `EADDRINUSE`
  and are unaffected.

Root cause (diagnosed after this qualification run):

- Radix Dialog sets `deferPointerDownOutside`, and DismissableLayer attaches its
  document `pointerdown` listener in a `setTimeout(0)` queued from the
  passive-effect flush, 1–2 ms before Dialog autofocus. If the main thread is
  busy, Chromium dispatches the test's synthetic overlay pointerdown ahead of
  that timer, and the outside click is ignored.
- An instrumented replay recorded the listener-attach and pointerdown times. In
  60 of 60 runs the Dialog closed exactly when the listener was attached before
  the pointerdown. Failing runs had the pointerdown 5–17 ms too early.
- The window is about 10–17 ms after the dialog opens, which a person cannot
  hit, and the deferral is intentional Radix behaviour that stops the opening
  click from dismissing the dialog. Classification: **test-timing race, not a
  product defect.** No spec or component change is needed.
- Uniform slowdown does not reproduce it: CDP CPU throttling (4×–20×) and
  saturating all 10 cores both passed 30/30 unfixed.

Proposed fix: PR #35 (`m19-002-navbar-dismiss`, test-only). Before the overlay
click, the test waits until focus is inside the Dialog (proving Radix's listener
timer is already queued), then lets a same-delay page timer run. No assertion,
timeout or retry setting changes. With the race forced through the real harness
(temporary instrumented spec, 20× on two projects), the unfixed test passed 17
and failed 23; the fixed test passed 40 of 40. The full `navbar.spec.ts` passed
on all 8 projects (154 passed), and the fixed test passed 80 of 80 on repeat.

This branch still records the failure as executed: gates 002 and 015 stay FAIL
for this run. A clean matrix rerun after PR #35 lands is needed to clear them.

## Asset, runtime and security audits

The 25 SVGs and the asset manifest are unchanged since `f74c235`; asset
validation and its negative sanitization tests pass. No asset was downloaded,
imported, redesigned or copied from Scout.

A scan of all 61 installed JS/CSS files and their maps across the three packages
found no `fetch`, XHR, WebSocket, `sendBeacon`, EventSource, analytics or
telemetry, remote imports, absolute local paths or credential patterns.
Consumer-provided image URLs still load through native image elements.

Root audit: 0 critical, 0 high, 8 moderate, all in development tooling:

- colord GHSA-2wm5-q62r-hmrv (Stylelint)
- vitest and @vitest/mocker GHSA-82fw-gwwq-j7x9 (test tooling)
- fast-uri GHSA-hrr3-gc8f-f4qj (Stylelint → ajv)
- brace-expansion GHSA-q2hr-2g5m-vwhr, two versions (ESLint tooling)
- sprintf-js GHSA-hp3w-g68c-fv3c (Changesets → js-yaml)
- postcss-selector-parser GHSA-rj75-hqrm-r3gf (Stylelint)

The last two were published after PR #22's audit (which recorded 6 moderate). No
audit fix or dependency change was made.

## Docs, support, known limitations and prospective notes

Docs unit tests (116), generated-code compilation (40 deterministic samples in
packed Next and Vite consumers), the production build, Pagefind (36 indexed
pages through the layout-independent indexer from PR #22) and the route budgets
pass. The docs browser suite (132 interaction and 89 visual tests) covers
search, playground controls, Copy Code, Copy AI Prompt (including the PR #33
timer-race fix), share URLs, examples and source links, and passes with 0
failures.

Production-like review (gate 010): the production build was served locally with
`next start` and reviewed in the in-app Chromium browser at 1280×900 and at
375×812 (mobile emulation). Checked: home, a component page and playground,
Stickers, the Trail playground and the mobile navigation; search opened from the
header and returned 12 Pagefind results for "trail"; Share showed its documented
fallback ("Clipboard unavailable. Select and copy the link below.") because the
pane grants no clipboard permission; the Source link targets
`packages/react/src/sticker-peel/StickerPeel.tsx` on `main`; eight main routes
return 200; no horizontal overflow at 375 px; every loaded resource came from
the local origin. This is not a Vercel preview, a production deployment or a
physical-device review; the production deployment is still awaiting approval.

`M17_KNOWN_LIMITATIONS.md`, `SUPPORT.md`, `SECURITY.md`, the READMEs, the
release guide/checklist and the Changesets were reviewed again. The Stickers
README now documents the private ESM URL module used for CRA 5 compatibility.
Existing caveats remain: best-effort support, consumer responsibility for custom
theme/artwork accessibility, WebKit versus branded Safari, emulation versus
physical Windows High Contrast, missing screen-reader session details and
machine-specific performance measurements. No caveat contradicts a public claim.

Prospective RC notes: eight accessible sticker components; standalone bounded
Trail; a React-free 25-sticker CC0 pack; ESM and React 19; minimal client
boundaries; provider/Tailwind/CSS-in-JS independence; docs, playgrounds and
local code and prompt generation; JavaScript source maps with embedded sources;
official artwork URLs that CRA 5/CRACO emit as decodable SVG files. Nothing is
published.

Migration notes: M11 established a local alpha API freeze, not a public alpha
publication, so there is no published-alpha migration to claim. Consumers use
supported root/subpath/CSS imports and React 19; private `src`/`dist` imports
are unsupported. The source-map and asset-URL repairs need no application
change. Final changelogs and registry state must be reviewed at release.

## Preservation

This qualification changed only `M19_ACCEPTANCE_GATES.md` and `M19_EVIDENCE.md`.
No package, test, snapshot, baseline, budget, lockfile or workflow file changed;
`git status` after all runs shows only these two documents, and the 377
baselines and three preflight snapshots match `6de9c75`. Since `f74c235`, PR #22
intentionally changed Stickers runtime source, the three unpacked-size budgets
and the Stickers tarball inventory (two private files); `public-api.json`, the
React and Trail sources, the 25 SVGs and the visual baselines are unchanged. No
Changeset is needed for evidence-only files.

## External blockers

- Rotate `RELEASE_PR_TOKEN` so the Release PR workflow can refresh PR #9 with
  the four pending patch Changesets.
- M18 closure: npm scope/bootstrap, trusted publishers, public canary and
  provenance.
- Merge of the refreshed version PR, the exact versioned 0.1.0 candidate, stable
  publication, public consumer verification, production docs deployment and
  maintainer promotion approval.

None of these was attempted. Dry-run artifacts are not release artifacts.
