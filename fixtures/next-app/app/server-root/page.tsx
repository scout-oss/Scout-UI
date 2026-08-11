import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

export default function ServerRootPage() {
  return (
    <main>
      <h1>Server-compatible root import</h1>
      <p data-testid="server-root-value">server-compatible primitives</p>
      <Sticker source={wonkyStar} size="sm" />
      <StickerButton href="/">Server root link</StickerButton>
      <StickerBadge>Server root badge</StickerBadge>
    </main>
  );
}
