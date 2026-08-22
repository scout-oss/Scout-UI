"use client";

import { Sticker, StickerBadge } from "@scout-ui/react";
import { officialStickerPack, stickerDefinitions } from "@scout-ui/stickers";
import { useMemo, useState } from "react";

const categories = [
  "all",
  ...new Set(stickerDefinitions.map(({ category }) => category)),
] as const;

export function StickerBrowser() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stickerDefinitions.filter(
      (sticker) =>
        (category === "all" || sticker.category === category) &&
        (!needle ||
          `${sticker.name} ${sticker.id} ${sticker.category} ${sticker.tags.join(" ")}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [category, query]);

  return (
    <div className="sui-docs-sticker-browser">
      <div className="sui-docs-sticker-tools">
        <label htmlFor="sticker-search">Search artwork, category, or tag</label>
        <input
          id="sticker-search"
          onChange={(event) => {
            setQuery(event.currentTarget.value);
          }}
          placeholder="Try “arrow” or “expression”"
          type="search"
          value={query}
        />
        <div
          aria-label="Sticker categories"
          className="sui-docs-sticker-filters"
          role="group"
        >
          {categories.map((item) => (
            <StickerBadge
              key={item}
              mode="select"
              onSelectedChange={() => {
                setCategory(item);
              }}
              selected={category === item}
              size="compact"
              tone={item === "all" ? "acid" : "paper"}
            >
              {item}
            </StickerBadge>
          ))}
        </div>
        <p aria-live="polite">
          {results.length} of {stickerDefinitions.length} cleared originals
        </p>
      </div>
      <ul className="sui-docs-contact-sheet">
        {results.map((sticker, index) => (
          <li data-category={sticker.category} key={sticker.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <Sticker
              alt={sticker.name}
              rotation={(index % 5) * 2 - 4}
              size="lg"
              source={sticker}
            />
            <details>
              <summary>
                <strong>{sticker.name}</strong>
                <small>
                  {sticker.category} · {sticker.format.toUpperCase()}
                </small>
              </summary>
              <dl>
                <div>
                  <dt>Tags</dt>
                  <dd>{sticker.tags.join(", ")}</dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>{sticker.license}</dd>
                </div>
                <div>
                  <dt>Provenance</dt>
                  <dd>
                    {sticker.creator} · attribution {sticker.attributionStatus}
                  </dd>
                </div>
                <div>
                  <dt>Public import</dt>
                  <dd>
                    <code>{`@scout-ui/stickers/definitions/${sticker.id}`}</code>
                  </dd>
                </div>
              </dl>
            </details>
          </li>
        ))}
      </ul>
      {results.length === 0 ? (
        <p className="sui-docs-empty-note">
          No cleared stickers match that filter.
        </p>
      ) : null}
      <p className="sui-docs-sticker-license-line">
        Pack: {officialStickerPack.name} · Artwork{" "}
        {officialStickerPack.artworkLicense} · Code{" "}
        {officialStickerPack.codeLicense}
      </p>
    </div>
  );
}
