import {
  Sticker,
  StickerBadge,
  StickerButton,
  scoutUiReactVersion,
} from "@scout-ui/react";
import { Sticker as SubpathSticker } from "@scout-ui/react/sticker";
import { StickerBadge as SubpathStickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton as SubpathStickerButton } from "@scout-ui/react/sticker-button";
import { stickerPackVersion } from "@scout-ui/stickers";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

import { ClientBoundaryCheck } from "./client-boundary-check";

export default function HomePage() {
  return (
    <main>
      <h1>Next.js packed consumer</h1>
      <dl data-testid="server-package-values">
        <dt>React package</dt>
        <dd>{scoutUiReactVersion}</dd>
        <dt>Root server exports</dt>
        <dd>Sticker · StickerButton · StickerBadge</dd>
        <dt>Server subpath exports</dt>
        <dd>sticker · sticker-button · sticker-badge</dd>
        <dt>Framework-neutral package</dt>
        <dd>{stickerPackVersion}</dd>
      </dl>
      <section aria-label="Root primitive imports">
        <Sticker source={wonkyStar} alt="Wonky star" size="sm" />
        <StickerButton href="/server-root">Root link</StickerButton>
        <StickerBadge>Root badge</StickerBadge>
      </section>
      <section aria-label="Subpath primitive imports">
        <SubpathSticker source={wonkyStar} size="sm" />
        <SubpathStickerButton href="/server-only">
          Subpath link
        </SubpathStickerButton>
        <SubpathStickerBadge>Subpath badge</SubpathStickerBadge>
      </section>
      <ClientBoundaryCheck initialLabel="client entry ready" />
      <nav aria-label="Fixture surfaces">
        <a href="/server-only">Server-only import</a>
        <a href="/test-surfaces/pointer">Pointer surface</a>
        <a href="/test-surfaces/drag">Drag surface</a>
        <a href="/test-surfaces/keyboard">Keyboard surface</a>
        <a href="/test-surfaces/reduced-motion">Reduced-motion surface</a>
        <a href="/test-surfaces/themes">Theme surface</a>
        <a href="/test-surfaces/tokens">Token canvas</a>
        <a href="/test-surfaces/sticker-gallery">Sticker gallery</a>
        <a href="/test-surfaces/primitives">Primitive gallery</a>
        <a href="/test-surfaces/trail">Trail surface</a>
        <a href="/test-surfaces/trail-render-count">Trail render count</a>
        <a href="/test-surfaces/trail-lifecycle">Trail lifecycle</a>
        <a href="/test-surfaces/trail-presets">Trail presets</a>
      </nav>
    </main>
  );
}
