# M19 remaining braces dependency remediation

Base: `f74c235397fc7a1163b55f4deda79d91e7bf9175`. Branch:
`m19-dependency-security-fix`.

## Finding and package ownership

GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces <=3.0.3. GitHub lists no
patched release; npm still publishes 3.0.3 as latest and returns 404 for 3.0.4.
The audit metadata's claimed >=3.0.4 fix is unavailable. No exception, ignored
advisory, locally patched braces or Git dependency is used.

The 43 original paths below belong to root development tooling. None is a
production dependency of the docs application or any public package. The sole
direct parent of braces is micromatch 4.0.8, accepting braces ^3.0.3; the latest
published micromatch remains 4.0.8. Parent usage is proven by the root scripts,
package lint scripts, stylelint.config.mjs, .changeset/config.json, release dry
run and .github/workflows/release-pr.yml. Neither root tool is redundant.

| Root dependency           | Paths | Necessary behavior                                 |
| ------------------------- | ----: | -------------------------------------------------- |
| @changesets/cli           |    34 | Release plans, versioning and changelog generation |
| stylelint-config-standard |     6 | CSS rule validation and Scout namespace validation |
| stylelint                 |     3 | CSS rule validation and Scout namespace validation |

## Remedies investigated in required order

1. Removal: Changesets and Stylelint are actively used. Removing either would
   remove an existing release or lint gate and would still leave the other path.
2. Compatible updates: Changesets 2.31.1 is the latest 2.x release. Current
   Stylelint 17.16.0 still declares micromatch ^4.0.8 and fast-glob ^3.3.3;
   globby 16.2.4 adds a direct micromatch dependency. Fast-glob 3.3.3 and
   micromatch 4.0.8 are current and retain braces. No compatible parent update
   eliminates every path. Versions were read live from the npm registry.
3. Tool replacement: Changesets 3.0.3 uses picomatch and the updated Manypkg
   implementation, but it is a major release-tool migration and leaves Stylelint
   vulnerable. Existing ESLint does not provide Stylelint's standard CSS rules.
   Adding @eslint/css 2.0.0 or Biome 2.5.15 would require a separate CSS-rule
   migration, including custom-property-pattern, exclusions and negative tests.
   That costs more and risks weakening existing checks.
4. Narrow replacement (chosen): replace exactly micromatch 4.0.8 in private
   tooling with the independently implemented tooling/glob-matcher adapter.
   Stylelint, Changesets, their configurations, and their CLI commands remain.
   This is not a vendored or unpublished fork of braces or micromatch.

## Private implementation contract

The exact pnpm override is micromatch@4.0.8 -> link:./tooling/glob-matcher. The
private helper declares published, exact dependencies picomatch 4.0.7 and
brace-expansion 5.0.12. No public package depends on the helper.

Only the observed parent APIs are implemented: list matching, isMatch, matcher,
makeRe, scan, and expanded braces. Fast-glob calls braces with expand, nodupes
and keepEscaping; it uses scan parts and makeRe for filesystem matching.
Changesets uses list matching and isMatch for configured groups and Git changes.
Stylelint uses list matching, isMatch and matcher for exclusions and overrides.
The helper preserves ordered negation, empty alternatives, quoted/escaped
literals and the pinned scanner shape. Unsupported brace-compilation calls fail
explicitly. A future parent/API update must review this limited contract.

Patterns have explicit limits: 65,536 input characters, 64 nesting levels and
1,000 expanded results; control characters are rejected. The maintained
expansion engine additionally bounds output size. Excessive nesting is rejected
before expansion or regex compilation. All current repository globs are well
inside these limits. No limits or rules in the public React component APIs
change.

The legacy behavior snapshot was captured from micromatch 4.0.8 before removing
it. Tests cover 33 expansion cases, 484 ordered-pattern cases, 30 compiler/scan
cases, all observed API methods, resource-limit rejection, real parent
resolution, real Stylelint rejection of invalid CSS/custom-property namespaces,
and real fast-glob filesystem discovery/exclusions. Eight regression tests pass.
The vulnerable dependency is not retained as a test oracle.

## Exposure of every original path

- All Changesets paths execute during maintainer/CI release planning, status,
  versioning, changelog generation or workspace discovery. Their patterns come
  from pnpm-workspace.yaml and .changeset/config.json, or the default ** Git
  file filter. Current fixed, linked and ignore groups are empty. Git filenames
  and package names are candidates to match; they are not parsed as glob
  patterns.
- All Stylelint paths execute during pnpm lint/check or an explicitly invoked
  stylesheet lint command. Patterns and exclusion/override globs come from
  package scripts and repository stylelint configuration. CSS content is parsed
  by CSS parsers; it is not passed to braces as a pattern.
- No published package consumer runs these private tools. Production docs route,
  search, share, Copy Code and Copy AI Prompt inputs do not invoke these tools.
  The production docs build command does not automatically run Stylelint or
  Changesets; separate CI checks may run them before deployment.
- A contributor can change repository configurations/scripts in a pull request.
  Therefore repository-controlled does not mean all CI inputs are trusted:
  malicious PR configuration can reach the tooling patterns, and PR code already
  executes in CI. No remote HTTP/share/search input path into these matchers was
  found. This risk characterization did not waive the audit gate.

The source locations inspected include Changesets config/getUnmatchedPatterns,
Git/getChangedPackagesSinceRef, Manypkg workspace discovery, fast-glob
utils/pattern and managers/tasks, and Stylelint augmentConfig, isPathIgnored and
standalone. The lifecycle and exposure classification applies to each row below.

## Complete original dependency path table

For every row, ownership is scout-ui@0.0.0 root devDependencies, private
tooling; public runtime = no, production docs request execution = no. The exact
parent version/range is retained per row, not inferred from audit severity.
Latest parent removes braces = no; parent matching/discovery behavior is
necessary and is preserved by the private replacement.

| ID  | Direct parent    | Accepted braces range | Full dependency path                                                                                                                                                         |
| --- | ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/config>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces`              |
| 02  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/config>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`               |
| 03  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/config>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                               |
| 04  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/config>micromatch>braces`                                                                                      |
| 05  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/git>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                  |
| 06  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/git>micromatch>braces`                                                                                         |
| 07  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                  |
| 08  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/apply-release-plan>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                  |
| 09  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/assemble-release-plan>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                              |
| 10  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/assemble-release-plan>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                               |
| 11  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/assemble-release-plan>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                               |
| 12  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/config>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                             |
| 13  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/config>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                              |
| 14  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/config>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                              |
| 15  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/config>micromatch>braces`                                                                                                                     |
| 16  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                |
| 17  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/assemble-release-plan>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces` |
| 18  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/assemble-release-plan>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`  |
| 19  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/assemble-release-plan>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                  |
| 20  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/config>@changesets/get-dependents-graph>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                |
| 21  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/config>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                 |
| 22  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/config>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                 |
| 23  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/config>micromatch>braces`                                                                                        |
| 24  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/pre>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                    |
| 25  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/read>@changesets/git>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                   |
| 26  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@changesets/read>@changesets/git>micromatch>braces`                                                                          |
| 27  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/get-release-plan>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                    |
| 28  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/git>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                                 |
| 29  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/git>micromatch>braces`                                                                                                                        |
| 30  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/pre>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                                 |
| 31  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/read>@changesets/git>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                |
| 32  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/read>@changesets/git>micromatch>braces`                                                                                                       |
| 33  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@changesets/should-skip-package>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                 |
| 34  | micromatch 4.0.8 | ^3.0.3                | `.>@changesets/cli>@manypkg/get-packages>globby>fast-glob>micromatch>braces`                                                                                                 |
| 35  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint-config-recommended>stylelint>fast-glob>micromatch>braces`                                                                             |
| 36  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint-config-recommended>stylelint>globby>fast-glob>micromatch>braces`                                                                      |
| 37  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint-config-recommended>stylelint>micromatch>braces`                                                                                       |
| 38  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint>fast-glob>micromatch>braces`                                                                                                          |
| 39  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint>globby>fast-glob>micromatch>braces`                                                                                                   |
| 40  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint-config-standard>stylelint>micromatch>braces`                                                                                                                    |
| 41  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint>fast-glob>micromatch>braces`                                                                                                                                    |
| 42  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint>globby>fast-glob>micromatch>braces`                                                                                                                             |
| 43  | micromatch 4.0.8 | ^3.0.3                | `.>stylelint>micromatch>braces`                                                                                                                                              |

## Separately locked CRA fixture

PR #22 adds `tooling/fixtures/cra-consumer/pnpm-lock.yaml`, an independent
workspace that the root override cannot reach. Dependency Review found braces
3.0.3 there through micromatch 4.0.8 (Jest 27, Tailwind 3, fast-glob,
http-proxy-middleware and eslint-webpack-plugin) and directly through chokidar
3.6.0, the latest 3.x release. The fixture workspace therefore applies the same
adapter: micromatch@4.0.8 links to `tooling/glob-matcher`, and braces@3.0.3
links to its private `braces` entry, which implements only chokidar's
`braces.expand(path)` with the same limits. The adapter adds only the micromatch
aliases these parents call, `some` and `any`. Their results, and `expand`, were
compared once with micromatch 4.0.8 and braces 3.0.3 (175 cases, no
differences); representative cases are fixed regression tests. The CRA runner
writes the same overrides into its generated workspace, rejects any installed
micromatch/braces package, requires each parent link to resolve to the adapter,
and checks that Tailwind content globbing emits the fixture's utility class.

## Qualification

Fresh audit after replacement: 0 critical, 0 high, 6 moderate. The six remaining
moderate findings are colord, vitest, @vitest/mocker, fast-uri, and
brace-expansion in its existing 1.x/5.x paths. No advisory is suppressed.

Previously repaired Next 16.3.3 -> 16.3.6, fast-uri -> 3.1.7 and brace-expansion
-> 1.1.20 / 5.0.11 remain intact. The deterministic root lockfile removes
micromatch/braces and adds only the private adapter's two maintained
implementations. No public runtime dependency changes; no Changeset is needed if
tarball equality and the full suite pass.

Full required qualification passed and is recorded in
.artifacts/m19-security/final-checks/results.json: frozen installation, format,
lint, typecheck, tests, build, asset lint, release-policy tests, package
preflight, packed Next/Vite consumers, docs budgets, aggregate check, HIGH audit
and release dry run. The final filesystem regression also passed a repeat of the
private helper lint and workspace unit suite. git diff --check passed.

All 277 shipped files remain byte-identical to the origin/main baseline: React
88, Trail 40, Stickers 149. Exactly three public packages and eight components
remain; API/exports, public runtime dependencies and visual baselines are
unchanged. Stickers remains React-free. No Changeset is needed. M18/M19 remain
open; no publication approval. Combined integration has not started.
