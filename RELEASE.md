# Scout UI release operations

Scout UI is not published yet. This guide prepares canary and v0.1 operations;
it does not authorize publication, a Git tag, a GitHub Release, or a production
docs promotion. Milestone 19 maintainer approval is required before `latest`.

## Fixed release identity and toolchain

- repository: `scout-oss/Scout-UI` (public);
- trusted-publisher workflow: `.github/workflows/publish.yml`;
- trusted-publisher environment: `npm-release`;
- GitHub-hosted runner: Ubuntu;
- Node: 24.18.0;
- pnpm: 11.21.0 through Corepack;
- publish-job npm: 11.15.0;
- registry: `https://registry.npmjs.org/`;
- packages: `@scout-ui/stickers`, `@scout-ui/sticker-trail`, then
  `@scout-ui/react`;
- production docs origin: `https://design.scoutapp.in`.

Current npm trusted publishing requires npm 11.5.1 or newer, Node 22.14.0 or
newer, a supported cloud-hosted runner, and `id-token: write`. GitHub trusted
publisher configuration records organization/user, repository, workflow
filename, optional environment, and allowed action. Each package supports one
trusted publisher. GitHub OIDC publication of a public package from a public
repository automatically creates provenance; `npm whoami` does not test that
path. See the official
[npm trusted-publisher documentation](https://docs.npmjs.com/trusted-publishers/)
and
[npm provenance documentation](https://docs.npmjs.com/generating-provenance-statements/).

Do not rename `publish.yml` or `npm-release` after npm configuration without
updating all three publishers first. The primary design has no `NPM_TOKEN`.

## Repository release flow

1. A user-visible package change updates its specification, implementation,
   fixtures, and Changeset. Public API changes also intentionally update the M11
   API snapshot.
2. Trusted pushes to `main` let `release-pr.yml` create or update an auditable
   version PR. It versions and writes changelogs only; it cannot publish.
3. Required checks validate that PR. There is no auto-merge.
4. After the version PR merges, M19 reviews the exact release candidate.
5. A maintainer opens `Publish Packages`, selects `production`, enters the exact
   version and `publish-v0.1`, then approves the protected environment.
6. The workflow rebuilds in isolation, checks the registry, publishes exact
   checksum-locked tarballs with OIDC, and verifies versions, `latest`,
   provenance, and clean public Next/Vite/docs installs.
7. M19 may then create tag `v0.1.0` and the GitHub Release. M18 does neither.

The initial Changeset plans `0.1.0` for all three packages. Package versions are
otherwise independent; the first line is synchronized because all three form one
initial product release. Changesets rewrites the React package's internal Trail
dependency range. Packed manifests—not source `workspace:*` text—are the release
proof.

## Local and CI-safe dry runs

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test:release
corepack pnpm release:check
corepack pnpm release:dry-run
corepack pnpm release:canary-dry-run
```

The dry-run command copies the repository to a temporary workspace, installs
frozen, applies Changesets only there, updates and re-verifies the temporary
lockfile, builds, runs package preflight, packs once, installs the tarballs in
Next and Vite, builds docs against the same tarballs and production origin, and
writes checksums under `.artifacts/release/`. It never runs `npm publish` and
removes the temporary workspace.

## Canary operator guide

Use a canary to test a prospective package line before M19 promotion.

1. First run `Canary Dry Run` with `prepare-canary`. Review its report and
   tarballs; this workflow has no OIDC permission.
2. Verify the `npm-release` environment and all three npm trusted publishers.
3. Run `Publish Packages`, select `canary`, and enter `publish-canary`.
4. Approve the protected environment. The generated version is a unique valid
   prerelease and publication uses only `--tag canary`.
5. The workflow proves `latest` is unchanged, provenance exists, and the exact
   public versions build in Next, Vite, and an isolated docs copy.
6. Install manually only after registry verification:

   ```sh
   pnpm add @scout-ui/react@canary @scout-ui/sticker-trail@canary @scout-ui/stickers@canary
   ```

The normal docs workspace never depends on `canary`; the isolated public
consumer substitutes exact prerelease versions and is discarded. A canary docs
deployment, if desired later, must be a noncanonical Vercel preview.

## External setup checklist

### GitHub

Create and protect:

- `npm-release`: required maintainer reviewer, `main` only, no secrets;
- `docs-production`: required maintainer reviewer, `main` only, secret name
  `VERCEL_DEPLOY_HOOK_URL` only.

Require on `main`: `CI / required`, `Browser / required`, `Visual / required`,
and `Security / required`. Require pull requests and resolved conversations;
block deletions and force pushes. Repository Actions policy should require full
SHA pins. Enable secret scanning, push protection, dependency graph, and private
vulnerability reporting where available. YAML files do not prove these account
settings are enabled.

### npm

First confirm control of the `@scout-ui` scope. Package-name `404` responses do
not prove scope ownership. If npm requires a package to exist before a trusted
publisher can be configured, the first-publication bootstrap is an external
manual blocker; do not silently add a token fallback.

For each of the three packages configure:

| Field             | Value          |
| ----------------- | -------------- |
| Provider          | GitHub Actions |
| Organization/user | `scout-oss`    |
| Repository        | `Scout-UI`     |
| Workflow filename | `publish.yml`  |
| Environment       | `npm-release`  |
| Allowed action    | `npm publish`  |

Record the npm settings page and later registry provenance as evidence. No npm
write token is required by the primary path.

### Vercel

The existing project is `scout-ui`, root `apps/docs`, Node 24.x. Keep its Git
integration for isolated pull-request previews. Configure preview builds with a
preview origin/noindex policy and no package-release credential. Disable
automatic production deployment from ordinary `main` pushes so it cannot race
the protected workflow. Create a production deploy hook and store only its URL
in `docs-production`. Set production
`SCOUT_UI_DOCS_ORIGIN=https://design.scoutapp.in`. Verify the custom domain,
preview isolation, and protected production behavior externally.

## Rollback and deprecation

Never use npm unpublish as the default rollback; versions are immutable release
records.

- Bad canary: inspect all three versions and tags, deprecate the bad prerelease
  with a precise message if users could install it, publish a corrected unique
  canary, and move/remove only the `canary` tag after verifying current npm
  command semantics. Do not touch `latest`.
- Bad production package: deprecate the exact bad version, publish a corrected
  patch through the full workflow, and move `latest` only to a verified good
  version. Document the correction in Changesets and release notes.
- Wrong dist-tag: inspect `npm view <name> dist-tags --json` for all packages,
  then correct only the affected tag. Verify public installs afterward.
- Wrong docs deployment: use Vercel's audited rollback to a known good
  deployment, verify `design.scoutapp.in`, then fix forward on `main`.
- Incorrect release notes: correct the GitHub Release/changelog transparently;
  do not rewrite an npm artifact.

To deprecate, scope the command to the exact package/version, supply a useful
message and replacement/fixed version, inspect dist-tags, update changelog and
communications, and verify the result. No deprecation is run in M18.

## Partial publication recovery

npm publication is not atomic. The enforced order is stickers, Trail, then
React, so React never appears before its internal public dependency. Before any
retry, inspect each exact package/version and every relevant dist-tag. The
workflow refuses already-existing versions and fails closed on network errors,
so a partially published set requires a maintainer decision: complete the
remaining packages if the artifacts and dependency ranges are still correct, or
deprecate/supersede the partial line with a new patch/prerelease. Never try to
overwrite an immutable npm version or rerun blindly.
