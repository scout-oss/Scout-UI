# Packed CRA/CRACO compatibility regression

This private, separately locked fixture approximates Scout's bundler
environment: React 19, React Scripts 5, CRACO 7, Router 7, Tailwind 3 and
PostCSS 8. It is not a public package or a supported recommendation to start new
CRA apps. Its legacy dependency graph is separate from the workspace security
repair.

From the repository root, with Playwright Chromium installed:

```sh
corepack pnpm test:packages
corepack pnpm test:fixtures
```

`test:fixtures` builds the packed Next/Vite consumers, checks their real browser
artwork, and runs this CRA regression. To repeat only CRA against the most
recent tarballs, run `corepack pnpm test:cra`. The Browser CI job also runs
these artwork checks after preparing the packed fixtures. No consumer imports
workspace source.

The runner copies this template into `.artifacts/cra-consumer/consumer`,
installs the actual tarballs, and refreshes only the generated consumer
lockfile's tarball identities before a frozen install. It builds with both
`CI=false` and `CI=true`, then opens the production build in Chromium. Reports,
logs and the runtime screenshot live in `.artifacts/cra-consumer/`. Next/Vite
browser reports live in `.artifacts/packed-artwork/`.

Assertions cover definition-based Sticker and emitted Trail artwork, direct SVG
imports, HTTP body/content type, image decoding, mouse and keyboard activation,
Badge selection, Peel reveal, Router navigation, a bounded 24-node Trail pool,
browser errors, and a single React instance. `craco.config.js` is intentionally
empty: the package must work without consumer webpack customization.

## Defect and internal repair

Before repair, `StickerDefinition.src` was already a string produced by
`new URL("../../assets/wonky-star.svg", import.meta.url).href`, not an imported
React SVG component. CRA 5's SVG loader rule includes `.js` issuers and runs
SVGR plus file-loader even for this webpack URL dependency. The emitted `.svg`
therefore contains SVGR JavaScript, not image artwork. Both Sticker and Trail
correctly pass that string to an image; the browser cannot decode it. Direct SVG
imports take CRA's expected module-export path and continue to work.

The URL declarations now live in one private native ESM `asset-urls.mjs` module.
CRA's SVGR issuer filter does not match `.mjs`, so its asset/resource handling
emits the original SVG. Next's image loader excludes URL dependencies, and Vite
also handles these statically analyzable URL expressions as assets. Pure
per-asset declarations preserve the existing single-sticker tree-shaking probe.
Public export paths, definition types and component APIs are unchanged.

The regression was run against fresh origin/main packages at
`f74c235397fc7a1163b55f4deda79d91e7bf9175`: builds and controls passed, direct
SVG decoded, but definition Sticker and emitted Trail images failed. The
malformed response was 1,629 bytes, SHA-256
`5b8cb7f52051a55c12d1b05acfbffe5f184b3c186a09afdd2d4198ae67efda01`. With the
repaired tarballs, all three image paths decode genuine SVG bytes.

## Separate release gates

This repair does not include the independent source-map or dependency-security
fix. Source-map warning counts are recorded, not hidden; set
`SCOUT_UI_REQUIRE_EMBEDDED_MAPS=1` during combined qualification to require zero
warnings in both builds. The source-map validator must include `.mjs.map` as
well as `.js.map` when integrating the independent repair. Do not interpret this
fixture's success as security approval or completion of M19.
