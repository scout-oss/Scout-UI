"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The plain-text prompt region must be keyboard-scrollable without changing its visible bytes. */

import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ComponentDocDefinition,
  JsonPrimitive,
  PromptAssetStrategy,
  PromptContext,
  PromptDocument,
  PromptFramework,
} from "../../lib/component-registry/types";
import {
  defaultPromptContextForDefinition,
  normalizePromptContext,
  PROJECT_CONTEXT_LIMIT,
  TARGET_LOCATION_LIMIT,
} from "../../lib/promptgen/generate-prompt";
import {
  CHANGED_CODE_EMPHASIS_MS,
  COPY_SUCCESS_MS,
} from "./code-highlight-protocol";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;

interface PromptMetrics {
  activeCopyTimers: number;
  activeEmphasisTimers: number;
  calculations: number;
  closedDialogs: number;
  copiedPrompts: number;
  openedDialogs: number;
  renders: number;
}

interface InstrumentedWindow extends Window {
  __scoutUiPromptMetrics?: PromptMetrics;
}

type CopyState = {
  readonly source: string;
  readonly status: "idle" | "copied" | "manual";
};

const frameworkOptions: readonly {
  readonly label: string;
  readonly value: PromptFramework;
}[] = [
  { label: "React", value: "react" },
  { label: "Next.js App Router", value: "next-app-router" },
  { label: "Next.js Pages Router", value: "next-pages-router" },
  { label: "Unknown · inspect project", value: "unknown" },
];

const assetOptions: readonly {
  readonly label: string;
  readonly value: PromptAssetStrategy;
}[] = [
  { label: "Bundled", value: "bundled" },
  { label: "Local project assets", value: "local" },
  { label: "Remote URL", value: "remote" },
  { label: "Unknown · inspect", value: "unknown" },
];

function instrument(callback: (metrics: PromptMetrics) => void) {
  if (typeof window === "undefined") return;
  const metrics = (window as InstrumentedWindow).__scoutUiPromptMetrics;
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

function codePointLength(value: string) {
  return Array.from(value).length;
}

function frameworkLabel(value: PromptFramework) {
  return (
    frameworkOptions.find((option) => option.value === value)?.label ?? value
  );
}

function assetLabel(value: PromptAssetStrategy) {
  return assetOptions.find((option) => option.value === value)?.label ?? value;
}

function PromptLines({
  changedLines,
  document,
}: {
  readonly changedLines: ReadonlySet<number>;
  readonly document: PromptDocument;
}) {
  const lines = document.text.split("\n");
  return lines.map((content, index) => (
    <span
      className="sui-docs-prompt-line"
      data-emphasized={changedLines.has(index + 1) || undefined}
      data-prompt-line={index + 1}
      key={index}
    >
      {content}
      {index < lines.length - 1 ? "\n" : null}
    </span>
  ));
}

export function PromptSheet({
  changedField,
  config,
  definition,
  mode,
}: {
  readonly changedField: string | null;
  readonly config: RuntimeConfig;
  readonly definition: RuntimeDefinition;
  readonly mode: "component" | "playground";
}) {
  const defaultContext = useMemo(
    () => defaultPromptContextForDefinition(definition),
    [definition],
  );
  const [context, setContext] = useState<PromptContext>(defaultContext);
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>({
    source: "",
    status: "idle",
  });
  const [emphasizedField, setEmphasizedField] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<number | null>(null);
  const emphasisTimerRef = useRef<number | null>(null);
  const promptId = useId().replaceAll(":", "");

  const document = useMemo(() => {
    return definition.generatePrompt(config, context);
  }, [config, context, definition]);

  useEffect(() => {
    instrument((metrics) => {
      metrics.calculations += 1;
    });
  }, [document.text]);

  useEffect(() => {
    instrument((metrics) => {
      metrics.renders += 1;
    });
  });

  const clearCopyTimer = useCallback(() => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
      instrument((metrics) => {
        metrics.activeCopyTimers -= 1;
      });
    }
    copyTimerRef.current = null;
  }, []);

  const clearEmphasisTimer = useCallback(() => {
    if (emphasisTimerRef.current !== null) {
      window.clearTimeout(emphasisTimerRef.current);
      instrument((metrics) => {
        metrics.activeEmphasisTimers -= 1;
      });
    }
    emphasisTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (!open || !changedField) return undefined;
    const frame = window.requestAnimationFrame(() => {
      clearEmphasisTimer();
      setEmphasizedField(changedField);
      emphasisTimerRef.current = window.setTimeout(() => {
        emphasisTimerRef.current = null;
        instrument((metrics) => {
          metrics.activeEmphasisTimers -= 1;
        });
        setEmphasizedField(null);
      }, CHANGED_CODE_EMPHASIS_MS);
      instrument((metrics) => {
        metrics.activeEmphasisTimers += 1;
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [changedField, clearEmphasisTimer, document.text, open]);

  useEffect(
    () => () => {
      clearCopyTimer();
      clearEmphasisTimer();
    },
    [clearCopyTimer, clearEmphasisTimer],
  );

  const updateContext = (change: Partial<PromptContext>) => {
    setContext((current) =>
      normalizePromptContext(definition, { ...current, ...change }),
    );
  };

  const resetContext = () => {
    clearCopyTimer();
    clearEmphasisTimer();
    setCopyState({ source: "", status: "idle" });
    setContext(defaultContext);
  };

  const copy = async () => {
    clearCopyTimer();
    const source = document.text;
    try {
      const clipboard: unknown = Reflect.get(navigator, "clipboard");
      if (!hasClipboard(clipboard)) throw new Error("Clipboard unavailable");
      await clipboard.writeText(source);
      setCopyState({ source, status: "copied" });
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        instrument((metrics) => {
          metrics.activeCopyTimers -= 1;
        });
        setCopyState({ source, status: "idle" });
      }, COPY_SUCCESS_MS);
      instrument((metrics) => {
        metrics.activeCopyTimers += 1;
        metrics.copiedPrompts += 1;
      });
    } catch {
      setCopyState({ source, status: "manual" });
      window.requestAnimationFrame(() => {
        fallbackRef.current?.focus();
        fallbackRef.current?.select();
      });
    }
  };

  const activeCopyState =
    copyState.source === document.text ? copyState.status : "idle";
  const changedLines = new Set(
    emphasizedField ? (document.fieldLines[emphasizedField] ?? []) : [],
  );

  return (
    <Dialog.Root
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        instrument((metrics) => {
          if (nextOpen) metrics.openedDialogs += 1;
          else metrics.closedDialogs += 1;
        });
        if (!nextOpen) {
          clearEmphasisTimer();
          setEmphasizedField(null);
        }
      }}
      open={open}
    >
      <Dialog.Trigger asChild>
        <button
          aria-label="Copy AI Prompt"
          className="sui-docs-code-tab sui-docs-copy-prompt-trigger"
          type="button"
        >
          AI Prompt · M15
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="sui-docs-prompt-overlay" />
        <Dialog.Content
          aria-describedby={`${promptId}-description`}
          className="sui-docs-prompt-sheet"
          data-prompt-mode={mode}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.scrollTo(0, 0);
            closeRef.current?.focus({ preventScroll: true });
          }}
          ref={contentRef}
        >
          <header className="sui-docs-prompt-heading">
            <div>
              <p className="sui-docs-eyebrow">Local implementation handoff</p>
              <Dialog.Title>AI Prompt · {definition.name}</Dialog.Title>
              <Dialog.Description id={`${promptId}-description`}>
                A deterministic brief generated from the same configuration as
                the preview and code.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close AI Prompt"
                className="sui-docs-prompt-close"
                ref={closeRef}
                type="button"
              >
                Close
              </button>
            </Dialog.Close>
          </header>

          <p className="sui-docs-prompt-privacy" role="note">
            <strong>Generated locally.</strong> No repository data is sent. No
            model, API key, analytics payload, or hosted generation service is
            used.
          </p>

          <div className="sui-docs-prompt-layout">
            <aside className="sui-docs-prompt-context">
              <section aria-labelledby={`${promptId}-summary-heading`}>
                <div className="sui-docs-prompt-section-heading">
                  <p className="sui-docs-eyebrow">Selected brief</p>
                  <h2 id={`${promptId}-summary-heading`}>
                    Configuration summary
                  </h2>
                </div>
                <dl className="sui-docs-prompt-summary">
                  {document.configurationSummary.map((item) => (
                    <div data-prompt-summary-field={item.field} key={item.id}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <fieldset className="sui-docs-prompt-controls">
                <legend>Implementation context</legend>

                <label htmlFor={`${promptId}-framework`}>
                  Target framework
                </label>
                <select
                  id={`${promptId}-framework`}
                  onChange={(event) => {
                    updateContext({
                      framework: event.currentTarget.value as PromptFramework,
                    });
                  }}
                  value={context.framework}
                >
                  {frameworkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label htmlFor={`${promptId}-location`}>Target location</label>
                <input
                  data-max-code-points={TARGET_LOCATION_LIMIT}
                  id={`${promptId}-location`}
                  onChange={(event) => {
                    updateContext({
                      targetLocation: event.currentTarget.value,
                    });
                  }}
                  placeholder="Hero section, product card…"
                  type="text"
                  value={context.targetLocation ?? ""}
                />
                <span className="sui-docs-prompt-count">
                  {codePointLength(context.targetLocation ?? "")}/
                  {TARGET_LOCATION_LIMIT}
                </span>

                <label htmlFor={`${promptId}-assets`}>Asset strategy</label>
                <select
                  id={`${promptId}-assets`}
                  onChange={(event) => {
                    updateContext({
                      assetStrategy: event.currentTarget
                        .value as PromptAssetStrategy,
                    });
                  }}
                  value={context.assetStrategy}
                >
                  {assetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="sui-docs-prompt-check">
                  <input
                    checked={context.preserveLayout}
                    onChange={(event) => {
                      updateContext({
                        preserveLayout: event.currentTarget.checked,
                      });
                    }}
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  Preserve existing layout
                </label>

                <div className="sui-docs-prompt-detail">
                  <span>Prompt detail</span>
                  <div role="radiogroup" aria-label="Prompt detail">
                    {(["detailed", "concise"] as const).map((detail) => {
                      const id = `${promptId}-detail-${detail}`;
                      return (
                        <label htmlFor={id} key={detail}>
                          <input
                            checked={context.detail === detail}
                            id={id}
                            name={`${promptId}-detail`}
                            onChange={() => {
                              updateContext({ detail });
                            }}
                            type="radio"
                            value={detail}
                          />
                          <span>
                            {detail === "detailed" ? "Detailed" : "Concise"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label htmlFor={`${promptId}-project-context`}>
                  Project context <span>optional</span>
                </label>
                <textarea
                  data-max-code-points={PROJECT_CONTEXT_LIMIT}
                  id={`${promptId}-project-context`}
                  onChange={(event) => {
                    updateContext({
                      projectContext: event.currentTarget.value,
                    });
                  }}
                  placeholder="Use the existing hero CTA and keep typography unchanged."
                  rows={5}
                  value={context.projectContext ?? ""}
                />
                <span className="sui-docs-prompt-count">
                  {codePointLength(context.projectContext ?? "")}/
                  {PROJECT_CONTEXT_LIMIT}
                </span>
              </fieldset>

              <dl className="sui-docs-prompt-context-summary">
                <div>
                  <dt>Framework</dt>
                  <dd>{frameworkLabel(context.framework)}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{context.targetLocation || "Inspect project"}</dd>
                </div>
                <div>
                  <dt>Assets</dt>
                  <dd>{assetLabel(context.assetStrategy)}</dd>
                </div>
                <div>
                  <dt>Layout</dt>
                  <dd>
                    {context.preserveLayout ? "Preserve" : "Allow changes"}
                  </dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>
                    {context.detail === "detailed" ? "Detailed" : "Concise"}
                  </dd>
                </div>
              </dl>
            </aside>

            <section
              aria-labelledby={`${promptId}-output-heading`}
              className="sui-docs-prompt-output"
              data-emphasis={changedLines.size > 0 ? "line" : "none"}
            >
              <div className="sui-docs-prompt-section-heading">
                <p className="sui-docs-eyebrow">Plain text · ready to paste</p>
                <h2 id={`${promptId}-output-heading`}>Generated prompt</h2>
              </div>
              {/* One visible canonical string; no Markdown or HTML parser. */}
              <div
                aria-label="Generated AI implementation prompt"
                className="sui-docs-prompt-scroll"
                role="region"
                tabIndex={0}
              >
                <pre>
                  <code>
                    <PromptLines
                      changedLines={changedLines}
                      document={document}
                    />
                  </code>
                </pre>
              </div>

              {activeCopyState === "manual" ? (
                <div className="sui-docs-prompt-copy-fallback" role="alert">
                  <label htmlFor={`${promptId}-manual-copy`}>
                    Clipboard unavailable. Copy the selected prompt manually.
                  </label>
                  <textarea
                    id={`${promptId}-manual-copy`}
                    readOnly
                    ref={fallbackRef}
                    rows={8}
                    value={document.text}
                  />
                </div>
              ) : null}
            </section>
          </div>

          <footer className="sui-docs-prompt-actions">
            <button onClick={resetContext} type="button">
              Reset prompt context
            </button>
            <p aria-live="polite" role="status">
              {activeCopyState === "copied"
                ? "Generated AI prompt copied to the clipboard."
                : ""}
            </p>
            <button
              className="sui-docs-copy-prompt"
              onClick={() => void copy()}
              type="button"
            >
              {activeCopyState === "copied" ? "Copied" : "Copy Prompt"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
