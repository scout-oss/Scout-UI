"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { componentDefinitions } from "../../lib/component-registry/definitions";
import {
  defaultCodegenContext,
  generateCodeForDefinition,
} from "../../lib/codegen/generate-code";
import {
  isConfigDirty,
  isFieldVisible,
  normalizeConfig,
  selectedPresetId,
} from "../../lib/component-registry/schema";
import type {
  ComponentDocDefinition,
  ComponentSlug,
  JsonPrimitive,
} from "../../lib/component-registry/types";
import {
  createShareUrl,
  decodePlaygroundConfig,
  type ConfigNotice,
  URL_REPLACE_DEBOUNCE_MS,
} from "../../lib/component-registry/url-state";
import { ConfigurablePreview } from "./configurable-preview";
import { CodeOutput } from "./code-output";
import { ControlDeck } from "./control-deck";
import { PromptSheet } from "./prompt-sheet";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;
type ShareStatus = "idle" | "copied" | "manual" | "too-large";

function hasClipboardWriteText(
  value: unknown,
): value is { writeText: (text: string) => Promise<void> } {
  return (
    value !== null &&
    typeof value === "object" &&
    "writeText" in value &&
    typeof value.writeText === "function"
  );
}

function runtimeDefinition(slug: ComponentSlug): RuntimeDefinition {
  return componentDefinitions[slug] as unknown as RuntimeDefinition;
}

function preserveNextHistoryState() {
  const state: unknown = window.history.state;
  return state !== null && typeof state === "object" ? { ...state } : {};
}

function queryFromLocation(): { cfg?: string; v?: string } {
  const params = new URLSearchParams(window.location.search);
  const cfg = params.get("cfg");
  const version = params.get("v");
  return {
    ...(cfg ? { cfg } : {}),
    ...(version ? { v: version } : {}),
  };
}

export function PlaygroundSession({
  failPreview = false,
  initialConfig,
  initialNotice = null,
  mode,
  slug,
}: {
  readonly failPreview?: boolean;
  readonly initialConfig: RuntimeConfig;
  readonly initialNotice?: ConfigNotice | null;
  readonly mode: "component" | "playground";
  readonly slug: ComponentSlug;
}) {
  const definition = useMemo(() => runtimeDefinition(slug), [slug]);
  const [config, setConfig] = useState<RuntimeConfig>(
    () => normalizeConfig(definition, initialConfig).config,
  );
  const [notice, setNotice] = useState(initialNotice);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [changedField, setChangedField] = useState<string | null>(null);
  const configRef = useRef(config);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const urlTimerRef = useRef<number | null>(null);
  const sessionId = useId().replaceAll(":", "");

  const dirty = isConfigDirty(definition, config);
  const currentPreset = selectedPresetId(definition, config);

  const clearUrlTimer = useCallback(() => {
    if (urlTimerRef.current !== null) window.clearTimeout(urlTimerRef.current);
    urlTimerRef.current = null;
  }, []);

  const urlFor = useCallback(
    (next: RuntimeConfig) =>
      createShareUrl(definition, next, window.location.origin),
    [definition],
  );

  const writeHistory = useCallback(
    (next: RuntimeConfig, operation: "push" | "replace") => {
      if (mode !== "playground") return;
      const result = urlFor(next);
      if (!result.ok) {
        setNotice(result.notice);
        setShareStatus("too-large");
        setShareUrl(result.fullUrl);
        return;
      }
      const method = operation === "push" ? "pushState" : "replaceState";
      window.history[method](
        preserveNextHistoryState(),
        "",
        result.relativeUrl,
      );
    },
    [mode, urlFor],
  );

  const scheduleLiveUrl = useCallback(
    (next: RuntimeConfig) => {
      if (mode !== "playground") return;
      clearUrlTimer();
      urlTimerRef.current = window.setTimeout(() => {
        urlTimerRef.current = null;
        writeHistory(next, "replace");
      }, URL_REPLACE_DEBOUNCE_MS);
    },
    [clearUrlTimer, mode, writeHistory],
  );

  const preserveFocusForConfig = useCallback(
    (next: RuntimeConfig) => {
      const active = document.activeElement;
      const activeDeck = active?.closest<HTMLElement>("[data-control-deck]")
        ?.dataset.controlDeck;
      const activeField = active?.closest<HTMLElement>("[data-control-field]")
        ?.dataset.controlField;
      if (!activeDeck || !activeField) return;
      const field = definition.schema.fields.find(
        (candidate) => candidate.key === activeField,
      );
      if (!field || isFieldVisible(field, next)) return;
      const controllingKey = field.visibleWhen?.field;
      if (!controllingKey) return;
      document
        .querySelector<HTMLElement>(
          `[data-control-deck="${activeDeck}"] [data-control-field="${controllingKey}"] input, [data-control-deck="${activeDeck}"] [data-control-field="${controllingKey}"] select`,
        )
        ?.focus();
    },
    [definition],
  );

  useEffect(() => {
    if (mode !== "playground") return;
    const handlePopState = () => {
      clearUrlTimer();
      const restored = decodePlaygroundConfig(definition, queryFromLocation());
      preserveFocusForConfig(restored.config);
      configRef.current = restored.config;
      setConfig(restored.config);
      setNotice(restored.notice);
      setShareStatus("idle");
      setChangedField(null);
    };
    const scope = window as typeof window & {
      __scoutUiPlaygroundPopstateListeners?: number;
    };
    window.addEventListener("popstate", handlePopState);
    if (scope.__scoutUiPlaygroundPopstateListeners !== undefined)
      scope.__scoutUiPlaygroundPopstateListeners += 1;
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (scope.__scoutUiPlaygroundPopstateListeners !== undefined)
        scope.__scoutUiPlaygroundPopstateListeners -= 1;
    };
  }, [clearUrlTimer, definition, mode, preserveFocusForConfig]);

  useEffect(
    () => () => {
      clearUrlTimer();
    },
    [clearUrlTimer],
  );

  const updateConfig = (key: string, rawValue: unknown) => {
    const next = normalizeConfig(definition, {
      ...configRef.current,
      [key]: rawValue,
    }).config;
    preserveFocusForConfig(next);

    configRef.current = next;
    setConfig(next);
    setChangedField(key);
    setShareStatus("idle");
    scheduleLiveUrl(next);
  };

  const applyPreset = (presetId: string) => {
    const preset = definition.presets.find(
      (candidate) => candidate.id === presetId,
    );
    if (!preset) return;
    clearUrlTimer();
    const next = normalizeConfig(definition, preset.config).config;
    preserveFocusForConfig(next);
    configRef.current = next;
    setConfig(next);
    setNotice(null);
    setShareStatus("idle");
    setChangedField("preset");
    writeHistory(next, "push");
  };

  const reset = () => {
    clearUrlTimer();
    const next = { ...definition.defaults };
    preserveFocusForConfig(next);
    configRef.current = next;
    setConfig(next);
    setNotice(null);
    setShareStatus("idle");
    setChangedField(null);
    writeHistory(next, "push");
  };

  const share = async () => {
    clearUrlTimer();
    const current = normalizeConfig(definition, configRef.current).config;
    const result = urlFor(current);
    setShareUrl(result.fullUrl);
    if (!result.ok) {
      setNotice(result.notice);
      setShareStatus("too-large");
      return;
    }
    if (mode === "playground") {
      const currentRelative = `${window.location.pathname}${window.location.search}`;
      if (currentRelative !== result.relativeUrl) writeHistory(current, "push");
    }
    try {
      const clipboard: unknown = Reflect.get(navigator, "clipboard");
      if (!hasClipboardWriteText(clipboard)) {
        throw new Error("Clipboard unavailable");
      }
      await clipboard.writeText(result.fullUrl);
      setShareStatus("copied");
    } catch {
      setShareStatus("manual");
    }
  };

  const fullPlaygroundUrl = createShareUrl(
    definition,
    config,
    "https://scout-ui.invalid",
  ).relativeUrl;
  const preview = definition.renderPreview(config);
  const generatedCode = useMemo(
    () => generateCodeForDefinition(definition, config, defaultCodegenContext),
    [config, definition],
  );
  const deckProps = {
    config,
    definition,
    dirty,
    onChange: updateConfig,
    onPreset: applyPreset,
    onReset: reset,
    onShare: () => void share(),
    selectedPreset: currentPreset,
    shareStatus,
    shareUrl,
  } as const;

  return (
    <div
      className="sui-docs-playground-session"
      data-config-dirty={dirty}
      data-current-preset={currentPreset ?? "custom"}
      data-session-mode={mode}
      data-session-slug={slug}
    >
      {notice ? (
        <div
          className="sui-docs-config-notice"
          data-notice-kind={notice.kind}
          role="status"
        >
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss configuration notice"
            onClick={() => {
              setNotice(null);
            }}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="sui-docs-workbench">
        <ConfigurablePreview
          componentName={definition.name}
          failFirst={failPreview}
        >
          {preview}
        </ConfigurablePreview>
        <aside
          aria-label={`${definition.name} controls`}
          className="sui-docs-control-rail"
        >
          <ControlDeck {...deckProps} idPrefix={`desktop-${sessionId}`} />
        </aside>
      </div>

      <div className="sui-docs-mobile-customize">
        <Dialog.Root onOpenChange={setMobileOpen} open={mobileOpen}>
          <Dialog.Trigger asChild>
            <button className="sui-docs-customize-trigger" type="button">
              Customize <span>{dirty ? "Custom" : definition.name}</span>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="sui-docs-control-sheet-overlay" />
            <Dialog.Content
              aria-describedby="mobile-control-description"
              className="sui-docs-control-sheet"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                mobileSheetRef.current?.scrollTo(0, 0);
                mobileCloseRef.current?.focus({ preventScroll: true });
              }}
              ref={mobileSheetRef}
            >
              <div className="sui-docs-control-sheet-heading">
                <div>
                  <p className="sui-docs-eyebrow">Live control sheet</p>
                  <Dialog.Title>Customize {definition.name}</Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button
                    aria-label="Close customization controls"
                    ref={mobileCloseRef}
                    type="button"
                  >
                    Close
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description id="mobile-control-description">
                Changes update the bounded preview and stay in this session.
              </Dialog.Description>
              <ControlDeck {...deckProps} idPrefix={`mobile-${sessionId}`} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <CodeOutput
        changedField={changedField}
        generated={generatedCode}
        mode={mode}
        promptAction={
          <PromptSheet
            changedField={changedField}
            config={config}
            definition={definition}
            mode={mode}
          />
        }
      />

      {mode === "component" ? (
        <Link className="sui-docs-open-playground" href={fullPlaygroundUrl}>
          Open full playground →
        </Link>
      ) : null}
    </div>
  );
}
