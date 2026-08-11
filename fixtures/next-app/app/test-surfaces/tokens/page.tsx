import type { CSSProperties } from "react";

const accents = [
  ["Ultraviolet", "var(--sui-ultraviolet)", "var(--sui-paper-raised)"],
  ["Acid", "var(--sui-acid)", "var(--sui-ink)"],
  ["Cyan", "var(--sui-cyan)", "var(--sui-ink)"],
  ["Hot pink", "var(--sui-hot-pink)", "var(--sui-ink)"],
  ["Cobalt", "var(--sui-cobalt)", "var(--sui-paper-raised)"],
  ["Orange", "var(--sui-orange)", "var(--sui-ink)"],
] as const;

const semantics = [
  ["Success", "var(--sui-success-surface)", "var(--sui-success-text)"],
  ["Warning", "var(--sui-warning-surface)", "var(--sui-warning-text)"],
  ["Danger", "var(--sui-danger-surface)", "var(--sui-danger-text)"],
  [
    "Information",
    "var(--sui-information-surface)",
    "var(--sui-information-text)",
  ],
] as const;

function colorStyle(background: string, color: string): CSSProperties {
  return { background, color };
}

export default function TokenCanvasPage() {
  return (
    <main className="token-canvas sui-theme" data-testid="token-canvas">
      <header className="token-hero sui-boundary">
        <p className="token-eyebrow">Scout UI · foundation proof</p>
        <h1>Controlled structure. Expressive interruption.</h1>
        <p>
          Neutral test elements using only packed public tokens—no component
          implementation and no network fonts.
        </p>
      </header>

      <section className="token-panel" aria-labelledby="foundations-heading">
        <h2 id="foundations-heading">Paper and night</h2>
        <div className="token-two-up">
          <article className="foundation-card sui-boundary">
            <strong>Paper foundation</strong>
            <span>Ink and muted ink remain editorial and calm.</span>
          </article>
          <article
            className="foundation-card sui-theme--night sui-boundary"
            data-sui-theme="night"
          >
            <strong>Night foundation</strong>
            <span>Raised night surfaces retain crisp separators.</span>
          </article>
        </div>
      </section>

      <section className="token-panel" aria-labelledby="palette-heading">
        <h2 id="palette-heading">Accent palette</h2>
        <div className="swatch-grid">
          {accents.map(([name, background, color]) => (
            <div
              className="token-swatch sui-boundary"
              key={name}
              style={colorStyle(background, color)}
            >
              <strong>{name}</strong>
              <span>Accent, not semantic state</span>
            </div>
          ))}
        </div>
      </section>

      <section className="token-panel" aria-labelledby="semantic-heading">
        <h2 id="semantic-heading">Semantic roles</h2>
        <div className="semantic-grid">
          {semantics.map(([name, background, color]) => (
            <div
              className="semantic-card"
              key={name}
              style={colorStyle(background, color)}
            >
              <strong>{name}</strong>
              <span>State-specific surface and text pair</span>
            </div>
          ))}
        </div>
      </section>

      <section className="token-panel" aria-labelledby="type-heading">
        <p className="token-eyebrow">Eyebrow / 0.12em tracking</p>
        <h2 id="type-heading" className="token-display">
          Editorial type stays level.
        </h2>
        <p className="token-body-large">
          Display scale carries the interruption. Body copy keeps a stable
          rhythm and readable measure using inherited, system-safe fonts.
        </p>
        <code className="token-code">--sui-font-mono</code>
      </section>

      <section className="token-panel" aria-labelledby="materials-heading">
        <h2 id="materials-heading">Shape, material, and depth</h2>
        <div className="material-row">
          <div className="material-sample material-cutout">Cutout</div>
          <div className="material-sample material-label">Label</div>
          <div className="material-sample material-paper">Paper</div>
          <div className="material-sample material-stamp">Stamp</div>
          <div className="material-sample material-ribbon">Ribbon</div>
          <div className="material-sample material-pill">True pill</div>
        </div>
        <div className="depth-row">
          <div className="depth-sample depth-stuck">Stuck</div>
          <div className="depth-sample depth-lifted">Lifted</div>
          <div className="sticker-frame">Cut line + ink outline</div>
        </div>
      </section>

      <section className="token-panel" aria-labelledby="intensity-heading">
        <h2 id="intensity-heading">Intensity is not density</h2>
        <div className="intensity-grid">
          {(["calm", "playful", "loud"] as const).map((intensity) => (
            <article
              className="intensity-card"
              data-sui-intensity={intensity}
              key={intensity}
            >
              <strong>{intensity}</strong>
              <div className="intensity-cluster" aria-hidden="true">
                <span className="intensity-dot" />
                <span className="intensity-dot" />
              </div>
              <small>Bounded rotation, overlap, shadow, motion</small>
            </article>
          ))}
        </div>
        <div className="density-line">
          <span className="density-chip" data-sui-density="sparse">
            Sparse
          </span>
          <span className="density-chip" data-sui-density="balanced">
            Balanced
          </span>
          <span className="density-chip" data-sui-density="packed">
            Packed
          </span>
        </div>
      </section>

      <section className="token-panel" aria-labelledby="focus-heading">
        <h2 id="focus-heading">Focus across surfaces</h2>
        <div className="focus-grid">
          {[
            ["Paper", "paper"],
            ["Night", "night"],
            ["Ultraviolet", "ultraviolet"],
            ["Acid", "acid"],
            ["Cyan", "cyan"],
          ].map(([label, surface]) => (
            <div
              className="focus-surface"
              data-focus-surface={surface}
              key={label}
            >
              <button className="sui-focusable" type="button">
                {label} focus
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        className="consumer-theme token-panel"
        data-testid="consumer-theme"
        aria-labelledby="custom-heading"
      >
        <h2 id="custom-heading">Plain CSS consumer override</h2>
        <p>
          This teal paper and yellow focus treatment changes variables on one
          ancestor—without React context, Tailwind, or rebuilding.
        </p>
        <button className="sui-focusable sui-boundary" type="button">
          Custom theme focus
        </button>
      </section>

      <section className="token-panel" aria-labelledby="motion-heading">
        <h2 id="motion-heading">Motion vocabulary</h2>
        <div className="motion-list" data-testid="motion-probe">
          {[
            "stick",
            "lift",
            "press",
            "peel",
            "scatter",
            "settle",
            "shuffle",
          ].map((motion) => (
            <span className="motion-chip sui-motion sui-boundary" key={motion}>
              {motion}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
