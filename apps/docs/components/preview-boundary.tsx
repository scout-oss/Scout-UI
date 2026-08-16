"use client";

import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";
import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import type { ErrorInfo, ReactNode } from "react";
import { Component, useSyncExternalStore } from "react";

declare global {
  interface Window {
    __SCOUT_UI_HOLD_PREVIEW__?: boolean;
  }
}

function subscribeToActivation(callback: () => void) {
  window.addEventListener("scout-ui:activate-preview", callback);
  return () => {
    window.removeEventListener("scout-ui:activate-preview", callback);
  };
}

function usePreviewReady() {
  return useSyncExternalStore(
    subscribeToActivation,
    () => window.__SCOUT_UI_HOLD_PREVIEW__ !== true,
    () => false,
  );
}

function PreviewPoster() {
  return (
    <div
      aria-label="Static preview poster: sticker-native controls on a night board"
      className="sui-docs-preview-composition"
      data-preview-poster="true"
      role="img"
    >
      <Sticker
        alt="Smiling sun sticker"
        rotation={-8}
        shadow="lifted"
        size="xl"
        source={sunnySmile}
      />
      <div className="sui-docs-preview-copy">
        <span className="sui-docs-preview-kicker">Poster first</span>
        <strong>Stable before interactive.</strong>
        <span>The preview keeps this exact stage geometry when it wakes.</span>
      </div>
      <span aria-hidden="true" className="sui-docs-preview-button-poster">
        Make it stick →
      </span>
    </div>
  );
}

function ActivePreview({ shouldFail }: { readonly shouldFail: boolean }) {
  if (shouldFail) throw new Error("Intentional documentation preview failure");
  return (
    <div className="sui-docs-preview-composition" data-preview-active="true">
      <Sticker
        alt="Smiling sun sticker"
        interactive
        onClick={() => {}}
        rotation={-8}
        shadow="lifted"
        size="xl"
        source={sunnySmile}
        title="A real interactive Sticker"
      />
      <div className="sui-docs-preview-copy">
        <StickerBadge rotation={-2} tone="cyan">
          Hydrated locally
        </StickerBadge>
        <strong>Serious semantics. Loud personality.</strong>
        <span>Only this bounded board becomes interactive.</span>
      </div>
      <StickerButton
        leading={<span aria-hidden="true">⚡</span>}
        shape="label"
        tone="acid"
        trailing={<span aria-hidden="true">→</span>}
      >
        Make it stick
      </StickerButton>
      <Sticker
        alt=""
        className="sui-docs-preview-bolt"
        rotation={12}
        shadow="none"
        size="lg"
        source={attentionBolt}
      />
    </div>
  );
}

interface BoundaryProps {
  readonly children: (attempt: number) => ReactNode;
}

interface BoundaryState {
  readonly attempt: number;
  readonly error: Error | null;
}

class PreviewErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { attempt: 0, error: null };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
    // React reports diagnostics in development. The public fallback deliberately
    // keeps stack traces out of the documentation surface.
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div className="sui-docs-preview-error" data-preview-error="true">
          <Sticker
            alt="Attention bolt sticker"
            rotation={-5}
            shadow="stuck"
            size="lg"
            source={attentionBolt}
          />
          <div role="status">
            <strong>This preview lost its stick.</strong>
            <p>The reference content below is still available.</p>
          </div>
          <button
            onClick={() => {
              this.setState((state) => ({
                attempt: state.attempt + 1,
                error: null,
              }));
            }}
            type="button"
          >
            Retry preview
          </button>
        </div>
      );
    }
    return this.props.children(this.state.attempt);
  }
}

export function PreviewBoundary({
  failFirst = false,
}: {
  readonly failFirst?: boolean;
}) {
  const ready = usePreviewReady();

  return (
    <section
      aria-labelledby="preview-heading"
      className="sui-docs-preview-stage"
      data-preview-phase={ready ? "active" : "poster"}
      id="preview"
    >
      <div className="sui-docs-preview-label">
        <span>Live boundary</span>
        <h2 id="preview-heading" tabIndex={-1}>
          Preview
        </h2>
      </div>
      <PreviewErrorBoundary>
        {(attempt) =>
          ready ? (
            <ActivePreview shouldFail={failFirst && attempt === 0} />
          ) : (
            <PreviewPoster />
          )
        }
      </PreviewErrorBoundary>
    </section>
  );
}
