import {
  scoutUiReactVersion,
  stickerEntryStatus as rootStickerStatus,
} from "@scout-ui/react";
import { stickerEntryStatus } from "@scout-ui/react/sticker";
import { stickerPackVersion } from "@scout-ui/stickers";

import { ClientBoundaryCheck } from "./client-boundary-check";

export default function HomePage() {
  return (
    <main>
      <h1>Next.js packed consumer</h1>
      <dl data-testid="server-package-values">
        <dt>React package</dt>
        <dd>{scoutUiReactVersion}</dd>
        <dt>Root server export</dt>
        <dd>{rootStickerStatus}</dd>
        <dt>Server subpath export</dt>
        <dd>{stickerEntryStatus}</dd>
        <dt>Framework-neutral package</dt>
        <dd>{stickerPackVersion}</dd>
      </dl>
      <ClientBoundaryCheck initialLabel="client entry ready" />
      <nav aria-label="Fixture surfaces">
        <a href="/server-only">Server-only import</a>
        <a href="/test-surfaces/pointer">Pointer surface</a>
        <a href="/test-surfaces/drag">Drag surface</a>
        <a href="/test-surfaces/keyboard">Keyboard surface</a>
        <a href="/test-surfaces/reduced-motion">Reduced-motion surface</a>
        <a href="/test-surfaces/themes">Theme surface</a>
      </nav>
    </main>
  );
}
