# Contributing to Scout UI

Thank you for helping build Scout UI. The project values distinctive design,
accessible behavior, bounded performance, framework interoperability, and clear
documentation equally.

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

## Assets

Do not contribute Scout product assets, third-party logos, copyrighted
characters, or artwork without redistribution rights. The detailed asset
provenance workflow and artwork license are intentionally deferred to Milestone
4; no publishable artwork should merge before those controls exist.

By participating, contributors agree to follow `CODE_OF_CONDUCT.md`.
