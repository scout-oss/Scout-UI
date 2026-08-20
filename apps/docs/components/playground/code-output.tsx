"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { GeneratedCodeResult } from "../../lib/codegen/generate-code";
import {
  CHANGED_CODE_EMPHASIS_MS,
  CODE_HIGHLIGHT_DEBOUNCE_MS,
  COPY_SUCCESS_MS,
  isCurrentHighlightResponse,
  type HighlightResponse,
  type HighlightToken,
} from "./code-highlight-protocol";

type CopyState = {
  readonly source: string;
  readonly status: "idle" | "copied" | "manual";
};

interface InstrumentedWindow extends Window {
  __scoutUiCodeOutputMetrics?: {
    activeWorkers: number;
    completedHighlights: number;
    createdWorkers: number;
    discardedHighlights: number;
    generatedSourceCalculations: number;
    highlightRequests: number;
    outputRenders: number;
    pendingCopyTimers: number;
    pendingHighlightTimers: number;
    terminatedWorkers: number;
  };
}

function instrument(
  callback: (
    metrics: NonNullable<InstrumentedWindow["__scoutUiCodeOutputMetrics"]>,
  ) => void,
) {
  if (typeof window === "undefined") return;
  const metrics = (window as InstrumentedWindow).__scoutUiCodeOutputMetrics;
  if (metrics) callback(metrics);
}

function hasClipboard(value: unknown): value is {
  writeText: (source: string) => Promise<void>;
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "writeText" in value &&
    typeof value.writeText === "function"
  );
}

function tokenStyle(token: HighlightToken): CSSProperties | undefined {
  const style: CSSProperties = {};
  if (token.color) style.color = token.color;
  if (token.fontStyle && (token.fontStyle & 1) !== 0)
    style.fontStyle = "italic";
  if (token.fontStyle && (token.fontStyle & 2) !== 0) style.fontWeight = "bold";
  if (token.fontStyle && (token.fontStyle & 4) !== 0)
    style.textDecoration = "underline";
  return Object.keys(style).length > 0 ? style : undefined;
}

function CodeLines({
  changedLines,
  source,
  tokens,
}: {
  readonly changedLines: ReadonlySet<number>;
  readonly source: string;
  readonly tokens: readonly (readonly HighlightToken[])[] | null;
}) {
  const plainLines = source.split("\n");
  const lines = tokens ?? plainLines.map((content) => [{ content }]);
  return lines.map((lineTokens, index) => (
    <span
      className="sui-docs-code-line"
      data-code-line={index + 1}
      data-emphasized={changedLines.has(index + 1) || undefined}
      key={index}
    >
      {lineTokens.map((token, tokenIndex) => (
        <span key={tokenIndex} style={tokenStyle(token)}>
          {token.content}
        </span>
      ))}
      {index < lines.length - 1 ? "\n" : null}
    </span>
  ));
}

export function CodeOutput({
  changedField,
  generated,
  mode,
}: {
  readonly changedField: string | null;
  readonly generated: GeneratedCodeResult;
  readonly mode: "component" | "playground";
}) {
  const [copyState, setCopyState] = useState<CopyState>({
    source: generated.source,
    status: "idle",
  });
  const [emphasizedField, setEmphasizedField] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<{
    readonly lines: readonly (readonly HighlightToken[])[];
    readonly source: string;
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const emphasisTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const sourceRef = useRef(generated.source);

  useEffect(() => {
    sourceRef.current = generated.source;
    instrument((metrics) => {
      metrics.generatedSourceCalculations += 1;
    });
  }, [generated.source]);

  useEffect(() => {
    instrument((metrics) => {
      metrics.outputRenders += 1;
    });
  });

  const clearCopyTimer = useCallback(() => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
      instrument((metrics) => {
        metrics.pendingCopyTimers -= 1;
      });
    }
    copyTimerRef.current = null;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver !== "function") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!changedField) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setEmphasizedField(changedField);
      if (emphasisTimerRef.current !== null)
        window.clearTimeout(emphasisTimerRef.current);
      emphasisTimerRef.current = window.setTimeout(() => {
        emphasisTimerRef.current = null;
        setEmphasizedField(null);
      }, CHANGED_CODE_EMPHASIS_MS);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [changedField, generated.source]);

  useEffect(() => {
    if (!visible) return undefined;
    const worker = new Worker(
      new URL("./code-highlight.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    workerRef.current = worker;
    instrument((metrics) => {
      metrics.activeWorkers += 1;
      metrics.createdWorkers += 1;
    });
    worker.onmessage = (event: MessageEvent<HighlightResponse>) => {
      const response = event.data;
      if (!isCurrentHighlightResponse(response.id, requestIdRef.current)) {
        instrument((metrics) => {
          metrics.discardedHighlights += 1;
        });
        return;
      }
      if (response.ok) {
        setHighlighted({ lines: response.lines, source: sourceRef.current });
        instrument((metrics) => {
          metrics.completedHighlights += 1;
        });
      }
    };
    return () => {
      workerRef.current = null;
      worker.terminate();
      instrument((metrics) => {
        metrics.activeWorkers -= 1;
        metrics.terminatedWorkers += 1;
      });
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || workerRef.current === null) return undefined;
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      instrument((metrics) => {
        metrics.pendingHighlightTimers -= 1;
      });
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    highlightTimerRef.current = window.setTimeout(() => {
      highlightTimerRef.current = null;
      instrument((metrics) => {
        metrics.pendingHighlightTimers -= 1;
      });
      workerRef.current?.postMessage({
        id: requestId,
        language: "tsx",
        source: generated.source,
        theme: "github-light",
      });
      instrument((metrics) => {
        metrics.highlightRequests += 1;
      });
    }, CODE_HIGHLIGHT_DEBOUNCE_MS);
    instrument((metrics) => {
      metrics.pendingHighlightTimers += 1;
    });
    return undefined;
  }, [generated.source, visible]);

  useEffect(
    () => () => {
      clearCopyTimer();
      if (emphasisTimerRef.current !== null)
        window.clearTimeout(emphasisTimerRef.current);
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
        instrument((metrics) => {
          metrics.pendingHighlightTimers -= 1;
        });
      }
    },
    [clearCopyTimer],
  );

  const copy = async () => {
    clearCopyTimer();
    const source = sourceRef.current;
    try {
      const clipboard: unknown = Reflect.get(navigator, "clipboard");
      if (!hasClipboard(clipboard)) throw new Error("Clipboard unavailable");
      await clipboard.writeText(source);
      setCopyState({ source, status: "copied" });
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        instrument((metrics) => {
          metrics.pendingCopyTimers -= 1;
        });
        setCopyState({ source, status: "idle" });
      }, COPY_SUCCESS_MS);
      instrument((metrics) => {
        metrics.pendingCopyTimers += 1;
      });
    } catch {
      setCopyState({ source, status: "manual" });
      window.requestAnimationFrame(() => {
        fallbackRef.current?.focus();
        fallbackRef.current?.select();
      });
    }
  };

  const changedLines = new Set(
    emphasizedField ? (generated.fieldLines[emphasizedField] ?? []) : [],
  );
  const activeCopyState =
    copyState.source === generated.source ? copyState.status : "idle";
  const activeHighlight =
    highlighted?.source === generated.source ? highlighted.lines : null;

  return (
    <section
      aria-labelledby="generated-code-heading"
      className="sui-docs-code-output"
      data-code-highlight={activeHighlight ? "settled" : "plain"}
      data-code-mode={mode}
      data-emphasis={
        emphasizedField ? (changedLines.size > 0 ? "line" : "sheet") : "none"
      }
      ref={rootRef}
    >
      <header>
        <div>
          <span className="sui-docs-code-tab" aria-current="page">
            Code
          </span>
          <span className="sui-docs-code-tab" data-future="true">
            AI Prompt · M15
          </span>
        </div>
        <button
          className="sui-docs-copy-code"
          onClick={() => void copy()}
          type="button"
        >
          {activeCopyState === "copied" ? "Copied" : "Copy Code"}
        </button>
      </header>
      <div className="sui-docs-code-heading">
        <div>
          <p className="sui-docs-eyebrow">Deterministic React output</p>
          <h2 id="generated-code-heading">Generated code</h2>
        </div>
        <span data-highlight-status={activeHighlight ? "ready" : "plain"}>
          {activeHighlight ? "TSX highlighted" : "Plain TSX ready"}
        </span>
      </div>
      {/* The overflow region is keyboard-scrollable without widening the page. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre aria-label="Generated TSX code" role="region" tabIndex={0}>
        <code className="language-tsx">
          <CodeLines
            changedLines={changedLines}
            source={generated.source}
            tokens={activeHighlight}
          />
        </code>
      </pre>
      <p aria-live="polite" className="sui-docs-copy-status" role="status">
        {activeCopyState === "copied"
          ? "Generated code copied to the clipboard."
          : ""}
      </p>
      {activeCopyState === "manual" ? (
        <div className="sui-docs-copy-fallback" role="alert">
          <label htmlFor="manual-code-copy">
            Copy the selected code manually.
          </label>
          <textarea
            id="manual-code-copy"
            readOnly
            ref={fallbackRef}
            rows={5}
            value={generated.source}
          />
        </div>
      ) : null}
    </section>
  );
}
