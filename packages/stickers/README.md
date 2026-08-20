# @scout-ui/stickers

Framework-neutral Scout UI assets, metadata, definitions, and manifests. The
package contains no React code or dependency and is safe to evaluate on a
server.

Documentation: [design.scoutapp.in](https://design.scoutapp.in/)

## Install

```sh
npm install @scout-ui/stickers
```

The package is ESM-only and works without React in vanilla JavaScript, Vue,
Svelte, Astro, CSS-oriented asset pipelines, and server tooling.

```js
import { stickerDefinitions } from "@scout-ui/stickers";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import starUrl from "@scout-ui/stickers/assets/wonky-star.svg";
```

Definitions resolve their packaged asset with `new URL(..., import.meta.url)`.
Direct asset subpaths allow consumers to select a single SVG without importing
the manifest. Import `@scout-ui/stickers/manifest` for the runtime manifest or
`@scout-ui/stickers/manifest.json` for the serializable generated metadata.
Definition and asset wildcard exports are limited to the approved manifest;
imports through `src/`, `dist/`, editable masters, or package tooling are not
public.

Artwork is CC0 1.0; package code remains MIT licensed. `LICENSE-ASSETS.md` and
`ATTRIBUTION.md` ship with the package so the artwork and provenance boundary is
available to every consumer.
