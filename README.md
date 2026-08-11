# Scout UI

An open-source library of distinctive components and interactions extracted from
Scout and generalized for broader use.

## Workspace

- `apps/docs` — documentation site
- `packages/react` — shared React components
- `packages/sticker-trail` — sticker trail interaction
- `packages/stickers` — framework-neutral sticker assets and metadata
- `fixtures` — private package-consumer fixtures, implemented in Milestone 2
- `tooling` — shared repository configuration

Playground routes live inside `apps/docs`; there is no separate playground
application.

## Requirements

- Node.js 24.18.0
- pnpm 11.21.0 through Corepack

Run `corepack enable`, then `pnpm install --frozen-lockfile`.

## Licensing

Repository code is licensed under the [MIT License](./LICENSE). Artwork and
other designated visual assets are licensed separately; see
[LICENSE-ASSETS.md](./LICENSE-ASSETS.md). No publishable artwork is included in
Milestone 1.

The sibling `scout-in` repository is a reference implementation only. Do not
modify it from this repository unless explicitly instructed.
