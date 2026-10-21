---
"@scout-ui/react": minor
---

Add three opt-in, backwards-compatible presentation modes. Defaults are
unchanged.

- `StickerPeel appearance="realistic"`: a physically modelled peel (fold
  geometry that follows the pointer, paper backside with crease shading, cast
  shadow, spring settle). Classic remains the default.
- `StickerBadge finish="enamel" | "foil"`: enamel-pin and holographic-foil
  materials, CSS-only (the badge stays server-compatible). Flat remains the
  default.
- `StickerStack appearance="deck"`: a fanned deck of prints whose held card
  follows the pointer and is thrown on commit. Paper remains the default.

Design-branch change: intended for a release after v0.1, not for the v0.1 alpha.
Size budgets for the interactive probe and the packed `@scout-ui/react` tarball
were re-baselined for the realistic peel (see the PR description).
