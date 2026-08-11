import { stickerEntryStatus } from "@scout-ui/react/sticker";

export default function ServerOnlyPage() {
  return (
    <main>
      <h1>Server-compatible subpath</h1>
      <p data-testid="server-only-value">{stickerEntryStatus}</p>
    </main>
  );
}
