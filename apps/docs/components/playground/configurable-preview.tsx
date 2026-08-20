"use client";

import { attentionBolt } from "@scout-ui/stickers/definitions/attention-bolt";
import type { ErrorInfo, ReactNode } from "react";
import { Component, useSyncExternalStore } from "react";

import { Sticker } from "@scout-ui/react/sticker";

interface PreviewBoundaryProps {
  readonly children: (attempt: number) => ReactNode;
}

interface PreviewBoundaryState {
  readonly attempt: number;
  readonly error: Error | null;
}

class ConfigPreviewErrorBoundary extends Component<
  PreviewBoundaryProps,
  PreviewBoundaryState
> {
  state: PreviewBoundaryState = { attempt: 0, error: null };

  static getDerivedStateFromError(error: Error): Partial<PreviewBoundaryState> {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sui-docs-preview-error" data-preview-error="true">
          <Sticker
            alt="Attention bolt sticker"
            shadow="stuck"
            size="lg"
            source={attentionBolt}
          />
          <div role="status">
            <strong>This preview lost its stick.</strong>
            <p>Controls and reference content remain available.</p>
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

function IntentionalPreviewFailure(): never {
  throw new Error("Intentional M13 preview failure");
}

const subscribeToClientReadiness = () => () => undefined;

export function ConfigurablePreview({
  children,
  componentName,
  failFirst = false,
}: {
  readonly children: ReactNode;
  readonly componentName: string;
  readonly failFirst?: boolean;
}) {
  const clientReady = useSyncExternalStore(
    subscribeToClientReadiness,
    () => true,
    () => false,
  );

  return (
    <section
      aria-labelledby="preview-heading"
      className="sui-docs-preview-stage sui-docs-config-preview"
      data-preview-phase="active"
      id="preview"
    >
      <div className="sui-docs-preview-label">
        <span>Live · bounded</span>
        <h2 id="preview-heading" tabIndex={-1}>
          {componentName} preview
        </h2>
      </div>
      <ConfigPreviewErrorBoundary>
        {(attempt) =>
          failFirst && clientReady && attempt === 0 ? (
            <IntentionalPreviewFailure />
          ) : (
            children
          )
        }
      </ConfigPreviewErrorBoundary>
    </section>
  );
}
