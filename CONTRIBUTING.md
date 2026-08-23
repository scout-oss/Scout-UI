# Contributing to Scout UI

Thank you for helping build Scout UI. The project values distinctive design,
accessible behavior, bounded performance, framework interoperability, and clear
documentation equally. The official public documentation is available at
[design.scoutapp.in](https://design.scoutapp.in/).

## Before opening a change

1. Read the three Scout UI specifications and `IMPLEMENTATION_PLAN.md`.
2. Search existing issues before proposing a new component or package.
3. Keep `../scout-in` read-only. It is product context, not a source of assets
   or code for automatic extraction.
4. For a new component, explain its purpose, distinct behavior, accessibility
   model, performance implications, design fit, and representative examples.
5. Do not add a public package without evidence of independent consumers.

## Local checks

Use the pinned Node and pnpm versions, install with a frozen lockfile, and run:

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Warnings are treated as failures. User-visible package changes require a
Changeset after the relevant API is implemented. Visual changes should include
screenshots or recordings plus keyboard, reduced-motion, and touch notes.

Pull requests run the stable `CI / required`, `Browser / required`,
`Visual / required`, and `Security / required` checks. Fork pull requests run
unprivileged test code and never receive npm or deployment credentials. A public
API change must update the specification, add a Changeset, update fixtures, and
intentionally update the API snapshot. Documentation-only changes do not require
a Changeset unless they alter a published package's user-visible contract.

Visual baselines are platform-specific. CI never commits screenshots. If Linux
baselines are missing, the Visual workflow uploads genuine Linux candidates and
fails until a maintainer reviews and commits them; do not copy Darwin, Win32, or
`_original-platform` images into `linux/`.

Local equivalents for release infrastructure are:

```sh
pnpm test:release
pnpm release:check
pnpm release:dry-run
pnpm release:canary-dry-run
```

These commands do not publish. See `RELEASE.md` for maintainer-only operations.

## Assets

Do not contribute Scout product assets, third-party logos, copyrighted
characters, or artwork without redistribution rights. Official generic sticker
artwork is accepted under CC0 1.0 only after the provenance, safety, and visual
review requirements in `packages/stickers/CONTRIBUTING_ASSETS.md` pass. Code
remains MIT licensed; Scout and Scout UI trademarks remain separate.

By participating, contributors agree to follow `CODE_OF_CONDUCT.md`.
