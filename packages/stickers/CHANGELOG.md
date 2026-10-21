# @scout-ui/stickers

## 0.1.0

### Minor Changes

- 585f4be: Prepare the first public Scout UI v0.1 release: eight React sticker
  components, the standalone bounded StickerTrail package, and the React-free
  official 25-sticker asset pack. This Changeset records the prospective release
  plan; the packages have not yet been published.

### Patch Changes

- 7680b9a: Resolve official artwork URLs through a private ESM module so
  CRA/CRACO emits decodable SVG assets instead of SVGR JavaScript. Next and Vite
  remain supported; public definitions, asset exports and the React-free runtime
  contract are unchanged.
- 175d17d: Embed original sources in JavaScript source maps so installed
  packages do not reference missing source files. Packed-package validation now
  rejects unresolved source-map references. No public API changes.
