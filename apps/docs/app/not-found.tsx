import { StickerButton } from "@scout-ui/react";

export default function NotFound() {
  return (
    <div className="sui-docs-not-found">
      <p className="sui-docs-eyebrow">404 · loose backing paper</p>
      <h1 data-route-heading tabIndex={-1}>
        This page did not stick.
      </h1>
      <p>
        Return to the component pinboard or start again from the documentation
        home.
      </p>
      <div>
        <StickerButton href="/" tone="acid">
          Documentation home
        </StickerButton>
        <StickerButton href="/components" tone="paper">
          Components
        </StickerButton>
      </div>
    </div>
  );
}
