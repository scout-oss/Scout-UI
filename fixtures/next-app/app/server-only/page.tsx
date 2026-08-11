import { Sticker } from "@scout-ui/react/sticker";
import { StickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton } from "@scout-ui/react/sticker-button";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

export default function ServerOnlyPage() {
  return (
    <main>
      <h1>Server-compatible subpath</h1>
      <p data-testid="server-only-value">server-compatible primitives</p>
      <Sticker source={wonkyStar} size="sm" />
      <StickerButton href="/">Server subpath link</StickerButton>
      <StickerBadge>Server subpath badge</StickerBadge>
    </main>
  );
}
