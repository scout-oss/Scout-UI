import { scoutUiReactVersion } from "@scout-ui/react";
import { stickerEntryStatus } from "@scout-ui/react/sticker";
import { stickerTrailVersion } from "@scout-ui/react/sticker-trail";
import { stickerTrailVersion as standaloneTrailVersion } from "@scout-ui/sticker-trail";
import { stickerPackVersion } from "@scout-ui/stickers";
import starAssetUrl from "@scout-ui/stickers/assets/wonky-star.svg";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

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
      <section aria-labelledby="packed-asset-heading">
        <h2 id="packed-asset-heading">Packed asset paths</h2>
        <img src={starAssetUrl} alt="" width="64" height="64" />
        <img src={wonkyStar.src} alt="" width="64" height="64" />
        <p data-testid="packed-sticker-definition">{wonkyStar.id}</p>
      </section>
    </main>
  );
}
