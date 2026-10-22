"use client";

import { Sticker, StickerBadge } from "@scout-ui/react";
import {
  officialStickerPack,
  stickerDefinitions,
  type StickerDefinition,
} from "@scout-ui/stickers";
import { useEffect, useMemo, useRef, useState } from "react";

import { isCoarsePointer, isReducedEffects } from "../lib/kinetic/effects";
import { Spring, springs } from "../lib/kinetic/spring";
import { sleep, wake } from "../lib/kinetic/ticker";

const categories = [
  "all",
  ...new Set(stickerDefinitions.map(({ category }) => category)),
] as const;

function exportName(id: string): string {
  return id.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
}

/**
 * The loupe: the selected sticker on a stage that tilts toward the pointer in
 * 3D with a moving holographic sheen. Tilt is decorative and imperative (one
 * spring pair on the shared ticker); metadata and actions are plain semantics.
 */
function Loupe({ sticker }: { readonly sticker: StickerDefinition }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card || isCoarsePointer()) return;
    const tiltX = new Spring(0, springs.sticker);
    const tiltY = new Spring(0, springs.sticker);
    const tick = (delta: number) => {
      const moving = [
        tiltX.step(delta, 0.01, 0.1),
        tiltY.step(delta, 0.01, 0.1),
      ].some(Boolean);
      card.style.transform = `rotateX(${tiltX.value.toFixed(2)}deg) rotateY(${tiltY.value.toFixed(2)}deg)`;
      card.style.setProperty(
        "--sui-k-sheen-x",
        `${(50 + tiltY.value * 2.4).toFixed(1)}%`,
      );
      card.style.setProperty(
        "--sui-k-sheen-y",
        `${(50 - tiltX.value * 2.4).toFixed(1)}%`,
      );
      return moving;
    };
    const onMove = (event: PointerEvent) => {
      if (isReducedEffects()) return;
      const box = stage.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width - 0.5;
      const ny = (event.clientY - box.top) / box.height - 0.5;
      tiltY.target = nx * 26;
      tiltX.target = -ny * 26;
      wake(tick);
    };
    const onLeave = () => {
      tiltX.target = 0;
      tiltY.target = 0;
      wake(tick);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      sleep(tick);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="sui-k-loupe-stage" ref={stageRef}>
      <div className="sui-k-loupe-card" key={sticker.id} ref={cardRef}>
        <Sticker
          alt={sticker.name}
          shadow="lifted"
          size="100%"
          source={sticker}
        />
        <span aria-hidden="true" className="sui-k-loupe-sheen" />
      </div>
    </div>
  );
}

function CopyImport({ sticker }: { readonly sticker: StickerDefinition }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const snippet = `import { ${exportName(sticker.id)} } from "@scout-ui/stickers/definitions/${sticker.id}";`;
  useEffect(() => {
    if (state !== "copied") return;
    const timer = window.setTimeout(() => {
      setState("idle");
    }, 2000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state]);
  return (
    <div className="sui-k-copy-import">
      <code>{snippet}</code>
      <button
        className="sui-k-chip"
        data-copy-state={state}
        onClick={() => {
          void navigator.clipboard
            .writeText(snippet)
            .then(() => {
              setState("copied");
            })
            .catch(() => {
              setState("manual");
            });
        }}
        type="button"
      >
        {state === "copied" ? "Copied" : "Copy import"}
      </button>
      <p aria-live="polite" className="sui-docs-visually-hidden" role="status">
        {state === "copied"
          ? `${sticker.name} import copied to the clipboard.`
          : ""}
      </p>
      {state === "manual" ? (
        <p className="sui-k-copy-manual" role="alert">
          Clipboard unavailable — select the import above and copy it manually.
        </p>
      ) : null}
    </div>
  );
}

export function StickerBrowser() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    stickerDefinitions[0].id,
  );
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
  const selected =
    stickerDefinitions.find((sticker) => sticker.id === selectedId) ??
    stickerDefinitions[0];

  return (
    <div className="sui-docs-sticker-browser sui-k-drawer-browser">
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

      <div className="sui-k-drawer-layout">
        <ul className="sui-docs-contact-sheet sui-k-contact-sheet">
          {results.map((sticker, index) => (
            <li data-category={sticker.category} key={sticker.id}>
              <button
                aria-controls="sticker-inspector"
                aria-pressed={selected.id === sticker.id}
                className="sui-k-contact-tile"
                onClick={() => {
                  setSelectedId(sticker.id);
                }}
                type="button"
              >
                <span aria-hidden="true" className="sui-k-contact-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Sticker alt="" shadow="stuck" size="lg" source={sticker} />
                <strong>{sticker.name}</strong>
                <small>
                  {sticker.category} · {sticker.format.toUpperCase()}
                </small>
              </button>
            </li>
          ))}
        </ul>

        <aside
          aria-label={`Inspector: ${selected.name}`}
          className="sui-k-inspector"
          id="sticker-inspector"
        >
          <Loupe sticker={selected} />
          <div className="sui-k-inspector-body">
            <p className="sui-k-kicker">
              <span>
                {String(stickerDefinitions.indexOf(selected) + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              {selected.category}
            </p>
            <h2>{selected.name}</h2>
            <dl>
              <div>
                <dt>Tags</dt>
                <dd>{selected.tags.join(", ")}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>{selected.license}</dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>
                  {selected.creator} · attribution {selected.attributionStatus}
                </dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>
                  {selected.format.toUpperCase()} · {selected.width}×
                  {selected.height}
                </dd>
              </div>
            </dl>
            <CopyImport key={selected.id} sticker={selected} />
          </div>
        </aside>
      </div>

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
