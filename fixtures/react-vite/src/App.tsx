import { scoutUiReactVersion } from "@scout-ui/react";
import { stickerEntryStatus } from "@scout-ui/react/sticker";
import { stickerTrailVersion } from "@scout-ui/react/sticker-trail";
import { stickerTrailVersion as standaloneTrailVersion } from "@scout-ui/sticker-trail";
import { stickerPackVersion } from "@scout-ui/stickers";

export function App() {
  return (
    <main>
      <h1>Vite packed consumer</h1>
      <dl>
        <dt>React root</dt>
        <dd>{scoutUiReactVersion}</dd>
        <dt>React server subpath</dt>
        <dd>{stickerEntryStatus}</dd>
        <dt>React client subpath</dt>
        <dd>{stickerTrailVersion}</dd>
        <dt>Standalone client package</dt>
        <dd>{standaloneTrailVersion}</dd>
        <dt>Framework-neutral package</dt>
        <dd>{stickerPackVersion}</dd>
      </dl>
    </main>
  );
}
