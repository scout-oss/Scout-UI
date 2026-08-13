import {
  Sticker,
  StickerBadge,
  StickerButton,
  StickerPeel,
  StickerTrail,
  scoutUiReactVersion,
} from "@scout-ui/react";
import { Sticker as SubpathSticker } from "@scout-ui/react/sticker";
import { StickerBadge as SubpathStickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton as SubpathStickerButton } from "@scout-ui/react/sticker-button";
import { StickerPeel as SubpathStickerPeel } from "@scout-ui/react/sticker-peel";
import { StickerTrail as SubpathStickerTrail } from "@scout-ui/react/sticker-trail";
import { stickerPackVersion } from "@scout-ui/stickers";
import starAssetUrl from "@scout-ui/stickers/assets/wonky-star.svg";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import { useState } from "react";

export function App() {
  const [selected, setSelected] = useState(false);
  const [peelOpen, setPeelOpen] = useState(false);

  return (
    <main className="sui-theme">
      <h1>Vite packed consumer</h1>
      <dl>
        <dt>React root</dt>
        <dd>{scoutUiReactVersion}</dd>
        <dt>React server subpaths</dt>
        <dd>sticker · sticker-button · sticker-badge</dd>
        <dt>React client subpath</dt>
        <dd>sticker-trail · sticker-peel</dd>
        <dt>Framework-neutral package</dt>
        <dd>{stickerPackVersion}</dd>
      </dl>
      <section aria-labelledby="vite-trail-heading">
        <h2 id="vite-trail-heading">Trail from the broad package</h2>
        <StickerTrail
          data-testid="vite-root-trail"
          maxActive={6}
          seed="vite-root"
          stickers={[{ id: "star", src: starAssetUrl, width: 64, height: 64 }]}
          style={{ border: "2px solid #121116", minHeight: 160, padding: 16 }}
        >
          <p>Root import, broad stylesheet only.</p>
        </StickerTrail>
        <SubpathStickerTrail
          data-testid="vite-subpath-trail"
          maxActive={6}
          seed="vite-subpath"
          stickers={[wonkyStar]}
          style={{ border: "2px solid #121116", minHeight: 160, padding: 16 }}
        >
          <p>Subpath import of the same client leaf.</p>
        </SubpathStickerTrail>
      </section>
      <section aria-labelledby="packed-asset-heading">
        <h2 id="packed-asset-heading">Packed asset paths</h2>
        <img src={starAssetUrl} alt="" width="64" height="64" />
        <img src={wonkyStar.src} alt="" width="64" height="64" />
        <p data-testid="packed-sticker-definition">{wonkyStar.id}</p>
      </section>
      <section aria-labelledby="vite-root-primitives">
        <h2 id="vite-root-primitives">Root primitive imports</h2>
        <div className="vite-primitive-row">
          <Sticker source={wonkyStar} alt="Wonky star" size="sm" />
          <StickerButton href="#vite-subpath-primitives" tone="ultraviolet">
            Root anchor
          </StickerButton>
          <StickerBadge
            mode="select"
            onSelectedChange={setSelected}
            selected={selected}
            tone="cyan"
          >
            {selected ? "Selected" : "Select"}
          </StickerBadge>
        </div>
      </section>
      <section aria-labelledby="vite-subpath-primitives">
        <h2 id="vite-subpath-primitives">Subpath primitive imports</h2>
        <div className="vite-primitive-row">
          <SubpathSticker outline="cutline" size="sm" tone="acid">
            RAW
          </SubpathSticker>
          <SubpathStickerButton type="button" tone="orange">
            Subpath button
          </SubpathStickerButton>
          <SubpathStickerBadge>Subpath badge</SubpathStickerBadge>
        </div>
      </section>
      <section aria-labelledby="vite-peel-heading">
        <h2 id="vite-peel-heading">Packed Peel root and subpath imports</h2>
        <div className="vite-peel-row">
          <StickerPeel
            back={<button type="button">Root back action</button>}
            data-testid="vite-root-peel"
            front="Root Peel front"
            onOpenChange={setPeelOpen}
            open={peelOpen}
          />
          <SubpathStickerPeel
            back="Subpath Peel back"
            data-testid="vite-subpath-peel"
            defaultOpen
            front="Subpath Peel front"
            origin="bottom-left"
          />
        </div>
      </section>
    </main>
  );
}
