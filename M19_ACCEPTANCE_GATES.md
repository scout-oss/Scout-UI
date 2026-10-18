# M19 release-candidate qualification gates

Overall: **OPEN — repository qualification not clean: M19-002 (intermittent
Navbar outside-click test failure in the local Darwin Chromium matrix,
classified as a test-timing race; fix proposed in PR #35) needs a clean matrix
rerun** at `6de9c75` (current `main`, including PR #22 and PR #33). M19-001
(published JavaScript source maps) is resolved and re-verified. M18 external
release closure, the exact versioned candidate, publication and maintainer
promotion remain BLOCKED pending separate authorization. M18 and M19 remain
OPEN.

Statuses are `PASS`, `FAIL`, `NOT EXECUTED`, or `BLOCKED`. Every status below is
from this rerun unless the evidence column says otherwise; a prior milestone
result does not substitute for a fresh M19 run. See `M19_EVIDENCE.md`.

| Gate | Contract                                                                      | Status       | Evidence (this rerun)                                                                   |
| ---- | ----------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| 001  | Clean expected baseline, isolated M19 branch and clean reference repo         | PASS         | Fresh worktree from `origin/main` `6de9c75`; scout-in clean at `170f55c`                |
| 002  | Complete clean checkout matrix with caches bypassed                           | FAIL         | All root commands PASS with 0 Turbo cache hits; browser matrix had 3 failures (M19-002) |
| 003  | Eight components meet the complete master quality contract                    | BLOCKED      | Navbar behaviour correct (M19-002 is a test race); needs a clean rerun after PR #35     |
| 004  | Exactly three independent installable public packages                         | PASS         | Three isolated consumers outside the repo tree                                          |
| 005  | Exports, declarations, maps, ESM, peers, RSC and tarball contents             | PASS         | Preflight PASS; installed-map audit 0 of 51 sources missing (M19-001 resolved)          |
| 006  | Packed Next and Vite production builds and server import evaluation           | PASS         | `test:fixtures`; hydration covered by the browser matrix                                |
| 007  | Separate Scout-like CRA/CRACO consumer qualification                          | PASS         | Normal and CI builds, 0 source-map warnings, SVGs decode, runtime controls              |
| 008  | At least 24 cleared coherent assets; current 25 unchanged                     | PASS         | 25 SVGs unchanged since `f74c235`; `lint:assets` PASS                                   |
| 009  | Docs, playground, code, prompt, share, search, examples and source links      | PASS         | Docs unit 116, docs browser 132 + 89, 0 failures                                        |
| 010  | Production-like desktop and mobile docs review                                | PASS         | Local `next start`, 1280×900 and 375×812; not a deployed preview                        |
| 011  | No critical/serious automated accessibility violation; keyboard and semantics | PASS         | 127 axe tests pass; keyboard/semantics assertions pass                                  |
| 012  | Reduced motion, forced colors, touch, zoom/reflow and focus                   | PASS         | Project-specific assertions pass; M19-002 tracked under 015                             |
| 013  | Existing human screen-reader evidence accurately reviewed                     | PASS         | M17 VoiceOver/Safari and NVDA/Firefox results; not re-run                               |
| 014  | New human release-candidate screen-reader smoke                               | NOT EXECUTED | Requires a human tester                                                                 |
| 015  | Full Chromium, Firefox and WebKit interaction matrix                          | FAIL         | Fixture 544 passed / 3 failed (M19-002, test race; fix in PR #35); docs 132 / 0         |
| 016  | Darwin visual comparison, unchanged platform baselines                        | PASS         | 136 comparisons match; 377 baselines byte-identical                                     |
| 017  | Genuine Linux Visual evidence at the qualified source SHA                     | PASS         | Visual `39105333775` success on `6de9c75` (observed, not dispatched)                    |
| 018  | Bounded resources, cleanup and no high-frequency React commits                | PASS         | Performance specs: 0 React commits, 0 long tasks, resources restored                    |
| 019  | Package and docs size budgets measured and recorded                           | PASS         | Package preflight and 12 docs route budgets                                             |
| 020  | No unresolved release-blocking package defect                                 | PASS         | No package defect: M19-001 resolved, M19-002 classified as a test race                  |
| 021  | No runtime telemetry or executable networking                                 | PASS         | 61 installed JS/CSS files and maps scanned; docs review loaded only local resources     |
| 022  | Known limitations and support policy reviewed without unsupported claims      | PASS         | Re-reviewed; no contradiction                                                           |
| 023  | Prospective release and alpha-migration notes prepared accurately             | PASS         | Updated for map and asset-URL repairs                                                   |
| 024  | Non-publishing release dry run, versions, ranges and changelogs               | PASS         | 0.1.0 for all three, `distTag: none`                                                    |
| 025  | Exact merged versioned 0.1.0 candidate qualification                          | BLOCKED      | Needs authorization; PR #9 stale (Release PR token invalid)                             |
| 026  | Public canary, provenance, installs and unchanged latest                      | BLOCKED      | Needs authorization; not run                                                            |
| 027  | Stable publication, provenance, public consumers and production docs          | BLOCKED      | Needs authorization; Docs Production awaiting approval                                  |
| 028  | Release candidate size/performance evidence published with release            | BLOCKED      | Needs a release; not run                                                                |
| 029  | Maintainers explicitly approve promotion, tag and release                     | BLOCKED      | Needs maintainer approval                                                               |
| 030  | API/package/visual snapshots and public runtime source unchanged              | PASS         | This run changed only the two evidence documents                                        |
| 031  | No release mutation, no Changeset, scout-in unchanged                         | PASS         | No tag, release, publish, deploy or PR #9 change; no new Changeset                      |
| 032  | Security audit: zero critical/high; moderate findings recorded                | PASS         | Root 0/0, 8 moderate; CRA fixture 0/0, 2 moderate, 1 low; Security run success          |
| 033  | Eight public component APIs match the M11 snapshot and type tests             | PASS         | `public-api.json` unchanged; typecheck incl. type tests                                 |

M19-001 is resolved: installed JavaScript maps embed all 51 sources, preflight
rejects unresolved map sources, and the packed CRA/CRACO build reports no
source-map warnings. Gates 005, 007 and 020's former package defect therefore no
longer block.

M19-002 is classified as a test-timing race, not a product defect. One Navbar
test failed in three Chromium projects of the full local matrix because its
synthetic overlay click can be dispatched before Radix's deferred
outside-pointer listener attaches. That 10–17 ms window is not reachable by a
person, and Radix versions are unchanged since `f74c235`, where it also fails.
PR #35 proposes a test-only readiness wait (forced race: unfixed 17 of 40 pass,
fixed 40 of 40). Gates 002 and 015 record this run's failure as executed and
stay FAIL until a clean matrix rerun after PR #35 lands. Gate 020 passes because
no package defect remains. Gate 003 stays BLOCKED until that rerun confirms the
Navbar contract cleanly. No test, retry policy or timeout was changed on this
branch.

Gate 010 is a production-like local review, not a deployed preview or
physical-device check. Gate 014 is an optional fresh human smoke; it does not
erase the supplied M17 human results. Gate 017 refers to an existing successful
GitHub Linux run at the exact source SHA, not a newly dispatched run.

Gates 025–029 need separately authorized external release work and were not run.
Before 025 can start, a maintainer must rotate `RELEASE_PR_TOKEN` so the Release
PR workflow can refresh PR #9 with the four pending patch Changesets.
