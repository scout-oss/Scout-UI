import type { ExampleSlug } from "./examples";

export const exampleCode: Record<ExampleSlug, string> = {
  "sticker-trail-hero": `import { StickerTrail } from "@scout-ui/sticker-trail";

<StickerTrail maxActive={10} preset="scout" stickers={stickers}>
  <HeroContent />
</StickerTrail>`,
  "custom-cursor-canvas": `import { StickerCursor } from "@scout-ui/react/sticker-cursor";

<StickerCursor visuals={{ default: { source: star } }}>
  <ProductCanvas />
</StickerCursor>`,
  "campaign-navbar": `import { StickerNavbar } from "@scout-ui/react/sticker-navbar";

<StickerNavbar brand={<Logo />} items={items} variant="ribbon" />`,
  "peel-product-detail": `import { StickerPeel } from "@scout-ui/react/sticker-peel";

<StickerPeel front={<Product />} back={<MaterialDetails />} />`,
  "sticker-mood-board": `import { Sticker, StickerBadge } from "@scout-ui/react";

<StickerBadge mode="select" selected={selected}>Bright</StickerBadge>`,
  "stacked-stories": `import { StickerStack } from "@scout-ui/react/sticker-stack";

<StickerStack items={stories} getKey={(story) => story.id} renderItem={renderStory} />`,
};
