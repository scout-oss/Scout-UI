# Scout UI release checklist

Statuses in this file describe the M18 implementation pass, not a future M19
approval.

## Repository-verifiable

- [x] Exactly three package manifests are publishable; every non-package
      workspace remains private.
- [x] Initial v0.1 Changeset exists and is honest.
- [x] `pnpm release` is a non-publishing isolated dry run.
- [x] Package metadata, legal files, tarball inventory, packed Next/Vite, docs
      tarball target, checksums, versions, changelogs, and ranges have automated
      gates.
- [x] Workflows are least-privilege and SHA-pinned; static fork/permission/token
      policy exists.
- [x] Canary is manual and cannot use `latest`; production requires the M19
      phrase and protected environment.
- [x] Rollback, deprecation, partial-publish recovery, and operator instructions
      exist.

## GitHub remote

- [ ] Generate, review, and commit genuine Linux visual baselines.
- [ ] Execute PR, fork-like PR, main-push, security, and release-PR workflows.
- [ ] Create protected `npm-release` and `docs-production` environments.
- [ ] Apply the documented `main` ruleset and required checks.
- [ ] Require full Action SHA pins in repository settings.
- [ ] Enable/verify secret scanning, push protection, CodeQL, dependency graph,
      and private vulnerability reporting.

## npm external

- [ ] Authenticate and prove control of the `@scout-ui` scope.
- [ ] Resolve any first-publication bootstrap requirement explicitly.
- [ ] Configure `publish.yml` / `npm-release` as the one trusted publisher for
      all three packages.
- [ ] With separate authorization, publish a canary and verify public install,
      unchanged `latest`, and provenance.

## Vercel external

- [ ] Verify Git integration preview isolation, including fork behavior.
- [ ] Disable ordinary-main production auto-deploy.
- [ ] Create/protect the production deploy hook and set `VERCEL_DEPLOY_HOOK_URL`
      in `docs-production`.
- [ ] Set and verify production `SCOUT_UI_DOCS_ORIGIN`.
- [ ] Execute and inspect preview and protected production deployments.

## M19 only

- [ ] Maintainers approve API, packages, visuals, docs, known limitations, and
      final clean-checkout matrix.
- [ ] Run the protected production publication.
- [ ] Verify npm `latest`, provenance, docs production, and public consumers.
- [ ] Create the approved Git tag and GitHub Release.
