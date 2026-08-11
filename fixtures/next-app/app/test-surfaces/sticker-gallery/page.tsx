import {
  officialStickerPack,
  stickerDefinitions,
  type StickerCategory,
} from "@scout-ui/stickers";

const categories: readonly StickerCategory[] = [
  "signal",
  "expression",
  "direction",
  "object",
  "label",
];

export default function StickerGalleryPage() {
  return (
    <main className="sticker-gallery sui-theme" data-testid="sticker-gallery">
      <header className="gallery-header sui-boundary">
        <p className="token-eyebrow">Internal art-direction contact sheet</p>
        <h1>{officialStickerPack.name}</h1>
        <p>
          {stickerDefinitions.length} original CC0 vector stickers. Large paper,
          normal night, and small accent views expose silhouette and cut-line
          drift.
        </p>
      </header>

      {categories.map((category) => (
        <section
          className="gallery-category"
          aria-labelledby={`${category}-heading`}
          key={category}
        >
          <h2 id={`${category}-heading`}>{category}</h2>
          <div className="gallery-grid">
            {stickerDefinitions
              .filter((sticker) => sticker.category === category)
              .map((sticker) => (
                <article
                  className="gallery-card sui-boundary"
                  data-testid="official-sticker"
                  key={sticker.id}
                >
                  <div className="gallery-previews">
                    <div className="gallery-preview gallery-preview-paper">
                      <img src={sticker.src} alt="" width="104" height="104" />
                    </div>
                    <div className="gallery-preview gallery-preview-night">
                      <img src={sticker.src} alt="" width="58" height="58" />
                    </div>
                    <div className="gallery-preview gallery-preview-accent">
                      <img src={sticker.src} alt="" width="34" height="34" />
                    </div>
                  </div>
                  <strong>{sticker.name}</strong>
                  <code>{sticker.id}</code>
                  <small>{sticker.tags.join(" · ")}</small>
                </article>
              ))}
          </div>
        </section>
      ))}

      <section className="gallery-collage" aria-labelledby="collage-heading">
        <div>
          <p className="token-eyebrow">Dense composition check</p>
          <h2 id="collage-heading">One family, controlled overlap.</h2>
        </div>
        <div className="collage-board">
          {stickerDefinitions.slice(0, 10).map((sticker) => (
            <img
              src={sticker.src}
              alt=""
              width="112"
              height="112"
              key={sticker.id}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
