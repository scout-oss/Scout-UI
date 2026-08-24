# Milestone 18 evidence — repository implementation ready, external gates pending

## Status

**M18 INCOMPLETE.** The repository-side CI, release, provenance, canary,
package-preflight, and deployment architecture is implemented and locally
verified. Strict completion still requires remote GitHub, npm, and Vercel
configuration and execution. Milestone 19 has not started.

## Baseline and scope

- Baseline SHA: `b2ee72acd7112f196ff22fa2f07762d0a04c2bb6`.
- Baseline message: `test: harden accessibility and performance`.
- Initial `HEAD`, `main`, and `origin/main`: the baseline SHA.
- Initial Scout UI worktree: clean; initial index: empty.
- Initial and final `../scout-in` status: clean.
- No dependency was added. No public runtime API, package export, visual
  baseline, artwork, telemetry, or runtime network behavior changed.
- No commit, push, tag, GitHub Release, npm publication, dist-tag mutation, or
  Vercel deployment was performed.

The authoritative specifications, implementation plan, package-preflight policy,
repository contribution/security/support documents, M17 evidence, npm
trusted-publishing and provenance documentation, GitHub Actions/security
settings, and existing Vercel project state were inspected before design.

## Initial inventory and read-only external state

Before M18 the repository had no GitHub Actions workflows and already used
Changesets with a public-access configuration but no release Changeset. All
three intended packages were `private: true`; every app, fixture, root, and
tooling workspace was also private. The docs application already used
`SCOUT_UI_DOCS_ORIGIN`, Pagefind, canonical metadata, sitemap, and robots
generation.

Read-only checks on 2026-08-23 found:

- GitHub repository `scout-oss/Scout-UI` is public and defaults to `main`.
- GitHub Actions are enabled. The repository has no rulesets. Its only
  environment is an unprotected `Production` environment; `npm-release` and
  `docs-production` do not exist.
- GitHub CodeQL default setup is not configured. Secret scanning, push
  protection, Dependabot security updates, and private vulnerability reporting
  are disabled. M18 adds repository workflows/configuration but does not mutate
  those account settings.
- No GitHub Release exists and no production Git tag was created.
- At `2026-08-23T08:26:55Z`, all of `@scout-ui/react`,
  `@scout-ui/sticker-trail`, and `@scout-ui/stickers` returned npm `404`. A
  `404` is recorded only as current package-name absence; it does not prove
  ownership of the `@scout-ui` scope. This machine is not authenticated to npm,
  so scope control and trusted-publisher setup are blocked external gates.
- Vercel CLI is authenticated and an existing `nairs-projects/scout-ui` project
  was found with root `apps/docs`, Next.js, Node 24.x, a production deployment,
  and Git-derived aliases. The local repository is not linked via `.vercel`;
  exact preview isolation, Git production behavior, environment values,
  deploy-hook state, and protection remain unverified. Nothing in Vercel was
  changed.

No credential value was printed or written. Generated npm CLI logs are outside
the repository and are not release artifacts.

## Package publication surface

Exactly these workspaces become publishable:

| Package                   | Source version | Prospective stable | Publish order | Result |
| ------------------------- | -------------: | -----------------: | ------------: | ------ |
| `@scout-ui/stickers`      |        `0.0.0` |            `0.1.0` |             1 | PASS   |
| `@scout-ui/sticker-trail` |        `0.0.0` |            `0.1.0` |             2 | PASS   |
| `@scout-ui/react`         |        `0.0.0` |            `0.1.0` |             3 | PASS   |

For each manifest, `private: true` was removed and `repository` (including the
package directory), `homepage`, `bugs`, and public npm `publishConfig` were
added. License remains MIT. These fields affect package metadata and tarball
bytes only; runtime behavior and provenance contents are unchanged. The root,
docs, fixtures, and tooling remain private. Release discovery fails if a fourth
package appears or an approved package is private.

Packed-package verification confirms:

- repository/homepage/bugs/access/registry metadata is valid;
- no `workspace:`, `file:`, `link:`, repository-relative, or private path leaks;
- no consumer lifecycle script is introduced;
- package READMEs and MIT licenses are present;
- the Stickers asset license, attribution, provenance manifest, and 25 existing
  assets are present; no artwork changed;
- React's packed dependency points to the exact packed Trail version;
- the public API, tarball-contents, and size-budget snapshots are unchanged.

The initial Changeset is honest and plans a minor release for only the three
public packages. `privatePackages.version` is false, so docs and fixture
workspaces stay at `0.0.0`. No fake release date or historical npm release is
claimed.

## Toolchain, OIDC, and provenance

The protected publication job fixes Node `24.18.0`, pnpm `11.21.0`, and npm
`11.15.0`. This exceeds npm's current trusted-publishing minimums of Node
22.14.0 and npm 11.5.1. Publication runs only on a GitHub-hosted runner, from
`scout-oss/Scout-UI`, `refs/heads/main`, workflow `publish.yml`, protected
environment `npm-release`, and an exact operator confirmation.

Only `publish.yml` receives `id-token: write`. The primary path has no
`NPM_TOKEN` or long-lived write token. Each npm package must externally trust
organization `scout-oss`, repository `Scout-UI`, workflow `publish.yml`,
environment `npm-release`, and action `npm publish`. npm permits one trusted
publisher per package. Public package + public repository trusted publication is
expected to create provenance automatically; the post-publish registry gate
requires the attestation before success. This is architecture, not evidence that
the external publishers or provenance currently exist.

## CI and workflow policy

| Workflow           | Events                               | Effective permission/write boundary               | Stable check          |
| ------------------ | ------------------------------------ | ------------------------------------------------- | --------------------- |
| `CI`               | PR, `main`, manual                   | `contents: read`                                  | `CI / required`       |
| `Browser`          | PR, `main`, manual                   | `contents: read`; no secrets                      | `Browser / required`  |
| `Visual`           | PR, `main`, manual                   | `contents: read`; artifacts only                  | `Visual / required`   |
| `Security`         | PR, `main`, weekly, manual           | read; CodeQL job alone writes security events     | `Security / required` |
| `Release PR`       | trusted `main`, manual               | contents/PR write; no npm auth                    | none                  |
| `Canary Dry Run`   | manual only                          | read; no OIDC; cannot publish                     | none                  |
| `Publish Packages` | manual only                          | read + job OIDC; protected `npm-release`          | protected operation   |
| `Docs Production`  | successful trusted-main CI or manual | read checks/actions; protected deploy-hook secret | protected operation   |

Normal CI concurrency cancels stale same-ref work. Release, canary, and docs
production groups do not cancel in-progress operations. Publication uses one
global `npm-release` group so canary and production cannot race. No ordinary PR,
push, schedule, Dependabot run, or fork path can publish `canary` or `latest`.
There is no `pull_request_target`, `write-all`, floating Action reference, or
credential path from fork-controlled code.

All third-party and official Actions are full-SHA pinned:

- checkout v7.0.1: `3d3c42e5aac5ba805825da76410c181273ba90b1`;
- setup-node v7.0.0: `820762786026740c76f36085b0efc47a31fe5020`;
- upload-artifact v7.0.1: `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`;
- dependency-review v5.0.0: `a1d282b36b6f3519aa1f3fc636f609c47dddb294`;
- CodeQL v4.37.8: `db488ddef3bf6cb639b32c2e9a7c0a7ea8271d28`;
- changesets/action v1.9.0: `a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d`.

Prettier's YAML parser validates syntax; the workflow-policy program verifies
SHA pins, permissions, events, release confirmation/tag policy, absence of token
names and `pull_request_target`, and that docs production waits for the exact
commit's four required checks. A first Linux visual run intentionally generates
review candidates and fails; it never fabricates or commits a baseline. Darwin,
Win32, and `_original-platform` histories are untouched.

## Release and canary dry runs

Both simulations copy the repository into a temporary isolated directory,
perform a frozen install, mutate versions/lockfile only there, build, run
package preflight and budgets, create tarballs once, install those exact
tarballs in Next/Vite/docs consumers, build Pagefind with the production origin,
hash the tarballs, copy only non-secret evidence into ignored
`.artifacts/release`, and delete the temporary workspace. The primary tree stays
at `0.0.0`.

Stable dry-run result:

| Package  | Version | Files |  Bytes | SHA-256                                                            |
| -------- | ------- | ----: | -----: | ------------------------------------------------------------------ |
| React    | `0.1.0` |    88 | 104313 | `718e0e267244f87f142b9b19e52730ed6160b2d6633f9d85ce3051d6b16e04d7` |
| Trail    | `0.1.0` |    40 |  35943 | `2d518ba0685d3b8f173192364016dec46541b006cf3c6bcbf5f537390dcc9712` |
| Stickers | `0.1.0` |   149 |  26690 | `0e8bec27c83bf634e14971a60eb792c49f87205665b6d7d805b984c7fec17f03` |

The exact canary version was `0.0.0-canary-m18-final-20260823082406` for all
three packages. Its React dependency range was the same exact canary Trail
version; the report's dist-tag was only `canary`; packed Next, Vite, docs,
Pagefind, legal, contents, checksums, and budgets passed. No registry mutation
occurred in either simulation.

The real workflow rechecks package/version availability immediately before
publication, fails closed on network uncertainty, publishes in dependency order,
hashes each exact artifact again, rejects an existing version, and after
publication verifies the requested tag, provenance, public package versions,
unchanged `latest` for canary, and clean public Next/Vite/docs consumers. npm
publication is non-atomic; the operator guide requires inspection before retry,
deprecation/fix-forward rather than overwrite, and precise partial-release
recovery.

## Documentation deployment architecture

The existing Vercel Git integration remains the only preview system. Forks still
receive GitHub build/test coverage but no privileged preview credential.
External Vercel settings must keep previews noncanonical and isolated, disable
ordinary-main automatic production promotion, and set production
`SCOUT_UI_DOCS_ORIGIN=https://design.scoutapp.in`.

`docs-production.yml` waits for `CI / required`, `Browser / required`,
`Visual / required`, and `Security / required` on the exact trusted-main SHA,
then crosses the protected `docs-production` environment and calls the existing
project's secret deploy hook. It cannot overwrite production from a PR/fork. The
real environment, hook, custom-domain, and preview behavior remain external
gates. No `.vercel` metadata was added.

## Security and failure model

The design addresses malicious workflow/package-script PRs by keeping every
credentialed operation manual, main-only, and environment-protected after
required checks. Full SHA pins reduce action-tag compromise. Dependency review
fails high-severity PR changes, CodeQL runs JavaScript/TypeScript analysis, and
the scheduled audit fails high-severity findings without auto-fixing. Tarballs
are checksum-bound between inspection and publication. Wrong repository/ref,
confirmation, version, dist-tag, package name, dependency range, existing
version, registry uncertainty, or missing provenance fails closed. Artifacts
exclude credentials/auth files and have seven-day retention.

External GitHub secret scanning, push protection, environment reviewers,
rulesets, CodeQL execution, and dependency settings are explicitly not claimed
as complete.

## Local verification

Final successful checks include:

- `corepack pnpm install --frozen-lockfile`;
- `corepack pnpm format`, lint, typecheck, 306 unit tests, build, and asset
  provenance checks;
- release-tooling tests (7/7) and policy audit (8 workflows);
- live registry preflight for all three names;
- package preflight, unchanged snapshots, packed Next, packed Vite, fixtures,
  declarations, source maps, tree-shaking, legal files, and budgets;
- stable and canary isolated release dry runs;
- `test:browser:ci`: fixture 547 passed / 669 policy-skipped; docs 132 passed /
  668 policy-skipped;
- `test:visual:ci`: fixture 43 passed / 301 policy-skipped; docs 89 passed / 975
  policy-skipped, with genuine Darwin baselines and no update;
- production-origin docs build: 46 routes, 32 Pagefind pages, all docs budgets;
- full `corepack pnpm check`.

The legacy broad browser invocation initially had two load-sensitive visual
failures; both focused single-worker reruns passed. A separate docs run exposed
a genuine transient mobile-navbar contrast failure: opacity on the entering
dialog composited its close control below the required contrast. The dialog
entrance now uses transform only (the overlay retains its own fade). Focused axe
coverage then passed 32/32 applicable tests, and the final CI-shaped browser and
visual matrices passed. No settled visual baseline or public API changed.

Package snapshots have no diff from the M17 baseline, including
`public-api.json`. Pagefind and Shiki remain lazy; route and runtime budgets
pass; release tooling does not enter a public package or client bundle. There is
no runtime telemetry or network addition.

## Files

Created:

- `.changeset/initial-v0-1.md`;
- all eight `.github/workflows/*.yml`, `.github/dependabot.yml`, and
  `.github/RELEASE_TEMPLATE.md`;
- `RELEASE.md`, `RELEASE_CHECKLIST.md`, this evidence file, and
  `M18_ACCEPTANCE_GATES.md`;
- `tooling/release/` release, registry, publication, consumer, browser, audit,
  policy, and test programs.

Modified:

- `.changeset/config.json`, root/package manifests and READMEs;
- `README.md`, `CONTRIBUTING.md`, `PACKAGE_PREFLIGHT.md`,
  `SCOUT_UI_ENGINEERING_SPEC.md`, and `IMPLEMENTATION_PLAN.md`;
- package-preflight and packed-consumer tooling;
- `packages/react/src/styles.css` for the verified mobile-dialog contrast fix.

`SECURITY.md` and `SUPPORT.md` remain accurate and unchanged. No generated
tarball, Pagefind output, Playwright report, `.npmrc`, `.vercel` state, or
`next-env.d.ts` drift is tracked.

## External setup and re-entry checklist

1. Commit/push M18 only after review; run PR and fork PR workflows.
2. Generate genuine Linux visual candidates in CI, inspect every image, commit
   only reviewed Linux baselines, and rerun `Visual / required`.
3. Create protected `npm-release` and `docs-production` environments with
   required maintainers and `main` restrictions.
4. Configure the documented `main` ruleset and four stable required checks;
   block normal force pushes/deletions and enable the documented security
   settings.
5. Prove control of the npm scope. Configure the one `publish.yml` /
   `npm-release` trusted publisher on every package; resolve any npm
   first-publication bootstrap explicitly without silently adding a token.
6. Verify Vercel Git preview/fork isolation, disable ordinary-main production,
   configure production origin/custom domain, create the protected deploy hook,
   and execute preview + protected production evidence.
7. With separate authorization, publish one canary, prove `latest` unchanged,
   provenance present, and clean public Next/Vite/docs installs.
8. Update this evidence and the gate table using only observed remote results.
   Only then may M18 become complete. Do not begin M19 before that decision.

## First remote validation repairs

The first M18 pull-request run found two clean-runner defects. These repairs are
locally verified but remain pending a new remote run, so no GitHub or Vercel
gate has been promoted to `PASS`.

- GitHub docs typecheck started before Next had generated the route declarations
  imported by the canonical `next-env.d.ts`. The docs typecheck now begins with
  `next typegen`, retaining route-aware typing without tracking `.next` output.
- Public package declaration emission reused incremental build information from
  `node_modules/.cache` even when ignored `dist` directories were absent. The
  Trail build therefore exited successfully after emitting JavaScript but no
  `dist/index.d.ts`; React then correctly refused to treat Trail as `any`.
  Declaration-only build invocations for all three public packages now disable
  composite/incremental reuse, while normal typechecking keeps its incremental
  cache. Real Trail declarations are emitted on every clean package build.
- `SCOUT_UI_DOCS_ORIGIN` affects canonical build output and is now declared only
  on the `@scout-ui/docs#build` Turbo task, so production and preview origins
  participate in the docs cache key without becoming global package inputs.

## Second remote validation repairs

The next pull-request run proved Quality and packages, both required CI/security
aggregates, CodeQL, Dependency Review, and the Vercel deployment. Browser and
Linux visual validation remain pending a new remote run after these local
repairs; neither gate is promoted to `PASS` here.

- Interaction CI selected non-visual files, but four historical screenshot
  assertions remain in `consumer.spec.ts`. Interaction now uses Playwright's
  screenshot-ignore mode while retaining every behavioral and accessibility
  assertion. The dedicated Visual runner owns those four exact-title contracts.
- The first-platform Visual path called the broad local update command, causing
  the full multi-browser behavioral matrix to run despite only Chromium being
  installed. Visual CI now selects only screenshot specs and the four consumer
  contracts, scopes execution to the Chromium projects that own baselines, and
  attempts every group so genuine Linux candidates are all uploaded in their
  intended repository structure for manual review.
- The WebKit-mobile Stack failure reproduced as a test synchronization race: the
  helper accepted the first positive coalesced drag frame before the final
  pointer sample was written. The test now polls for the intended progress and a
  settled frame; the imperative component is unchanged.
- Navbar instrumentation could be reset while a mount/observer frame was still
  pending. The performance test now drains two real animation-frame boundaries
  and proves both the Navbar and global frame tracker are idle before resetting
  the measurement. The one-frame ceiling and zero-after-rest contracts remain
  unchanged.

## Genuine Linux visual baseline import

GitHub Actions artifact
`linux-visual-review-b4f135373d992f0173f66d8d06abf2dd4cffc4a2` was verified with
SHA-256 `e2662d1d52c92a2d06f4e27285eca659a624ab58b6f2c49ef99600c71d811126`. The
reported 136 first-baseline failures produced 149 PNGs because the Cursor
hotspot, Trail preset, and four M16 content tests intentionally capture multiple
screenshots per test. All 149 artifact sources resolved exactly to approved
`tests/browser/__screenshots__/linux/` destinations with no missing, ambiguous,
duplicate-path, corrupt, empty, or invalid-dimension candidate.

Human review approved all ten Linux visual groups. The 149 genuine GitHub Linux
PNGs were then imported byte-for-byte from the validated mapping; no Darwin,
Win32, or `_original-platform` baseline supplied any pixels. A subsequent GitHub
Linux Visual rerun is still pending, so `Visual / required` is not yet promoted
to `PASS` and M18 remains incomplete.
