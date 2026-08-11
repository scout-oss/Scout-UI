# Contributing Sticker Artwork

Submit only artwork you created or have documented redistribution rights to
contribute. An accepted official asset requires:

- creator and source provenance;
- an editable vector master or an explanation of why none exists;
- the declared artwork license and attribution status;
- disclosure of AI assistance, tools, and source inputs;
- confirmation that no protected logo, character, product screenshot, product
  claim, private Scout material, or close imitation is present;
- all asset checks and paper/night gallery review.

Official generic artwork is contributed under CC0 1.0. Code surrounding the
asset is MIT licensed. Scout and Scout UI trademarks remain separate.

Third-party logo packs, copyrighted characters, scraped artwork, stock assets
without redistribution rights, and outputs with unclear model terms or unclear
source inputs are rejected. Assets are never copied from `../scout-in`.

Run `pnpm --filter @scout-ui/stickers assets:generate`, then `pnpm lint:assets`.
A checksum change is expected when artwork changes and must receive explicit
visual review; do not approve screenshot updates mechanically.
