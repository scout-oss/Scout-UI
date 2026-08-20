"use client";

import { Sticker } from "@scout-ui/react/sticker";
import type {
  ComponentDocDefinition,
  ConfigField,
  NumericControlField,
  JsonPrimitive,
} from "../../lib/component-registry/types";
import { controlGroupOrder } from "../../lib/component-registry/types";
import { isFieldVisible } from "../../lib/component-registry/schema";
import { playgroundStickerSources } from "../../lib/component-registry/sticker-options";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;

function NumberInput({
  field,
  id,
  onChange,
  value,
}: {
  readonly field: NumericControlField<RuntimeConfig>;
  readonly id: string;
  readonly onChange: (value: unknown) => void;
  readonly value: number;
}) {
  return (
    <input
      id={id}
      inputMode="decimal"
      max={field.max}
      min={field.min}
      onChange={(event) => {
        const next = event.currentTarget.value;
        const numeric = Number(next);
        if (next.trim() !== "" && Number.isFinite(numeric)) {
          onChange(numeric);
        }
      }}
      step={field.step}
      type="number"
      value={value}
    />
  );
}

function FieldControl({
  field,
  idPrefix,
  onChange,
  value,
}: {
  readonly field: ConfigField<RuntimeConfig>;
  readonly idPrefix: string;
  readonly onChange: (key: string, value: unknown) => void;
  readonly value: JsonPrimitive;
}) {
  const id = `${idPrefix}-${field.key}`;
  const descriptionId = `${id}-description`;
  const set = (next: unknown) => {
    onChange(field.key, next);
  };
  let control;

  switch (field.kind) {
    case "boolean":
      control = (
        <label className="sui-docs-control-check" htmlFor={id}>
          <input
            checked={Boolean(value)}
            id={id}
            onChange={(event) => {
              set(event.currentTarget.checked);
            }}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <strong>{field.label}</strong>
        </label>
      );
      break;
    case "number":
      control = (
        <NumberInput
          field={field}
          id={id}
          onChange={set}
          value={Number(value)}
        />
      );
      break;
    case "range":
      control = (
        <div className="sui-docs-control-range">
          <input
            aria-describedby={descriptionId}
            id={id}
            max={field.max}
            min={field.min}
            onChange={(event) => {
              set(event.currentTarget.valueAsNumber);
            }}
            step={field.step}
            type="range"
            value={Number(value)}
          />
          <output htmlFor={id}>{String(value)}</output>
        </div>
      );
      break;
    case "select":
      control = (
        <select
          aria-describedby={descriptionId}
          id={id}
          onChange={(event) => {
            set(event.currentTarget.value);
          }}
          value={String(value)}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "segmented":
      control = (
        <div
          aria-describedby={descriptionId}
          aria-label={field.label}
          className="sui-docs-control-segmented"
          role="radiogroup"
        >
          {field.options.map((option) => {
            const optionId = `${id}-${String(option.value)}`;
            return (
              <label htmlFor={optionId} key={option.value}>
                <input
                  checked={String(value) === String(option.value)}
                  id={optionId}
                  name={id}
                  onChange={() => {
                    set(option.value);
                  }}
                  type="radio"
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
      break;
    case "sticker":
      control = (
        <div
          aria-describedby={descriptionId}
          aria-label={field.label}
          className="sui-docs-sticker-picker"
          role="radiogroup"
        >
          {field.options.map((option) => {
            const optionId = `${id}-${String(option.value)}`;
            const source =
              playgroundStickerSources[
                option.value as keyof typeof playgroundStickerSources
              ];
            return (
              <label htmlFor={optionId} key={option.value} title={option.label}>
                <input
                  checked={value === option.value}
                  id={optionId}
                  name={id}
                  onChange={() => {
                    set(option.value);
                  }}
                  type="radio"
                />
                <Sticker alt="" shadow="none" size="sm" source={source} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
      break;
    case "text":
      control = (
        <input
          aria-describedby={descriptionId}
          id={id}
          maxLength={field.maxLength}
          onChange={(event) => {
            set(event.currentTarget.value);
          }}
          type="text"
          value={String(value)}
        />
      );
      break;
    case "color":
      control = (
        <div className="sui-docs-color-control">
          <input
            aria-describedby={descriptionId}
            id={id}
            onChange={(event) => {
              set(event.currentTarget.value);
            }}
            type="color"
            value={String(value)}
          />
          <input
            aria-label={`${field.label} hexadecimal value`}
            onChange={(event) => {
              set(event.currentTarget.value);
            }}
            pattern="#[0-9A-Fa-f]{6}"
            type="text"
            value={String(value)}
          />
        </div>
      );
      break;
  }

  return (
    <div
      className="sui-docs-control-field"
      data-control-field={field.key}
      data-control-kind={field.kind}
    >
      {field.kind === "boolean" ? null : (
        <label
          htmlFor={
            field.kind === "segmented" || field.kind === "sticker"
              ? undefined
              : id
          }
        >
          {field.label}
        </label>
      )}
      {control}
      <p id={descriptionId}>{field.description}</p>
    </div>
  );
}

export function ControlDeck({
  config,
  definition,
  dirty,
  idPrefix,
  onChange,
  onPreset,
  onReset,
  onShare,
  selectedPreset,
  shareStatus,
  shareUrl,
}: {
  readonly config: RuntimeConfig;
  readonly definition: RuntimeDefinition;
  readonly dirty: boolean;
  readonly idPrefix: string;
  readonly onChange: (key: string, value: unknown) => void;
  readonly onPreset: (presetId: string) => void;
  readonly onReset: () => void;
  readonly onShare: () => void;
  readonly selectedPreset: string | null;
  readonly shareStatus: "idle" | "copied" | "manual" | "too-large";
  readonly shareUrl: string;
}) {
  const visibleGroups = controlGroupOrder
    .map((group) => ({
      group,
      fields: definition.schema.fields.filter(
        (field) => field.group === group && isFieldVisible(field, config),
      ),
    }))
    .filter((entry) => entry.fields.length > 0);

  return (
    <div className="sui-docs-control-deck" data-control-deck={idPrefix}>
      <header>
        <div>
          <span className="sui-docs-control-stamp">Control sheet</span>
          <h2>Customize {definition.name}</h2>
        </div>
        <span className="sui-docs-dirty-state" data-dirty={dirty}>
          {dirty ? "Customized" : "Canonical"}
        </span>
      </header>

      <fieldset className="sui-docs-presets">
        <legend>Presets</legend>
        <div>
          {definition.presets.map((preset) => (
            <button
              aria-pressed={selectedPreset === preset.id}
              key={preset.id}
              onClick={() => {
                onPreset(preset.id);
              }}
              type="button"
            >
              {preset.name}
            </button>
          ))}
          {selectedPreset === null ? <span>Custom</span> : null}
        </div>
      </fieldset>

      <div className="sui-docs-control-actions">
        <button disabled={!dirty} onClick={onReset} type="button">
          Reset
        </button>
        <button onClick={onShare} type="button">
          Share
        </button>
      </div>
      <div
        aria-live="polite"
        className="sui-docs-share-status"
        data-share-status={shareStatus}
      >
        {shareStatus === "copied" ? "Share link copied." : null}
        {shareStatus === "manual"
          ? "Clipboard unavailable. Select and copy the link below."
          : null}
        {shareStatus === "too-large"
          ? "This configuration is too large for a Scout UI share URL."
          : null}
      </div>
      {shareStatus === "manual" || shareStatus === "too-large" ? (
        <label className="sui-docs-share-fallback">
          Share URL
          <input
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            readOnly
            value={shareUrl}
          />
        </label>
      ) : null}

      {visibleGroups.map(({ fields, group }) => (
        <fieldset
          className="sui-docs-control-group"
          data-control-group={group}
          key={group}
        >
          <legend>{group}</legend>
          {fields.map((field) => (
            <FieldControl
              field={field}
              idPrefix={idPrefix}
              key={field.key}
              onChange={onChange}
              value={config[field.key] ?? field.default}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}
