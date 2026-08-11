import { stickerEntryStatus } from "@scout-ui/react";

export default function ServerRootPage() {
  return (
    <main>
      <h1>Server-compatible root import</h1>
      <p data-testid="server-root-value">{stickerEntryStatus}</p>
    </main>
  );
}
