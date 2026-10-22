# @scout-ui/react

## 0.2.0

### Minor Changes

- 73a6de7: Add three opt-in, backwards-compatible presentation modes. Defaults
  are unchanged.

  - `StickerPeel appearance="realistic"`: a physically modelled peel (fold
    geometry that follows the pointer, paper backside with crease shading, cast
    shadow, spring settle). Classic remains the default.
  - `StickerBadge finish="enamel" | "foil"`: enamel-pin and holographic-foil
    materials, CSS-only (the badge stays server-compatible). Flat remains the
    default.
  - `StickerStack appearance="deck"`: a fanned deck of prints whose held card
    follows the pointer and is thrown on commit. Paper remains the default.

  Design-branch change: intended for a release after v0.1, not for the v0.1
  alpha. Size budgets for the interactive probe and the packed `@scout-ui/react`
  tarball were re-baselined for the realistic peel (see the PR description).

## 0.1.0

### Minor Changes

- 585f4be: Prepare the first public Scout UI v0.1 release: eight React sticker
  components, the standalone bounded StickerTrail package, and the React-free
  official 25-sticker asset pack. This Changeset records the prospective release
  plan; the packages have not yet been published.

### Patch Changes

- 175d17d: Embed original sources in JavaScript source maps so installed
  packages do not reference missing source files. Packed-package validation now
  rejects unresolved source-map references. No public API changes.
- Updated dependencies [585f4be]
- Updated dependencies [175d17d]
  - @scout-ui/sticker-trail@0.1.0
