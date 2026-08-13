/**
 * Cursor state resolution.
 *
 * The rules live here, separated from the DOM walk, so the priority order is
 * unit-testable rather than only observable through a browser.
 */

/** Value of the state attribute that always restores the native cursor. */
export const NATIVE_STATE = "native";

export const DEFAULT_STATE_ATTRIBUTE = "data-sticker-cursor";

/**
 * Elements whose native pointer interaction carries meaning Scout UI must not
 * fake. Editable fields are matched by capability — `contenteditable`, any
 * `textarea`, and the text-entry input types — rather than by enumerating every
 * application-specific class name, which would be fragile and incomplete.
 *
 * `input` is matched wholesale and then narrowed: a checkbox or a submit button
 * is not text entry, but every unlisted or future input type is treated as
 * text-like, because guessing wrong in that direction only costs a decoration.
 */
export const EDITABLE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/** Input types that are genuinely button-like and need no native text cursor. */
const NON_EDITABLE_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/**
 * Regions where the browser supplies its own interaction affordances. Exact
 * sub-control hit testing inside a media element is not exposed to script, so
 * the whole element is treated as native whenever it renders controls — the
 * safest containing-region policy.
 */
export const NATIVE_MEDIA_SELECTOR =
  "video[controls], audio[controls], embed, object, iframe";

/**
 * Resize affordances. `resize` is a computed style rather than a selector, so
 * the engine checks it separately; this covers the declarative cases.
 */
export const NATIVE_AFFORDANCE_SELECTOR = "[data-sticker-cursor-native]";

export type CursorBypassReason =
  | "native-region"
  | "editable"
  | "media"
  | "disabled-selector"
  | "resize-handle";

export type CursorResolution =
  | { kind: "bypass"; reason: CursorBypassReason }
  | { kind: "state"; state: string };

export interface StateResolutionInput {
  /** State attribute value from the nearest annotated ancestor, if any. */
  attributeState: string | undefined;
  /** True when the primary button is currently held down. */
  pressed: boolean;
  /** Bypass reason discovered by the DOM walk, if any. */
  bypass: CursorBypassReason | undefined;
  /** Names present in the consumer's `visuals` map. */
  availableStates: ReadonlySet<string>;
}

/**
 * Resolve the cursor state for one pointer position.
 *
 * Priority, highest first:
 *
 * 1. **bypass** — an explicit native region, an editable field, native media,
 *    a resize handle, or the consumer's disabled selector. Safety outranks
 *    decoration, so a custom state attribute can never override it.
 * 2. **active** — the pressed visual, when one is supplied.
 * 3. **custom state** — the nearest annotated ancestor's value.
 * 4. **default** — always present by type.
 *
 * An unknown state name falls back to `default` rather than disappearing or
 * throwing during pointer movement.
 */
export function resolveCursorState({
  attributeState,
  pressed,
  bypass,
  availableStates,
}: StateResolutionInput): CursorResolution {
  if (bypass !== undefined) {
    return { kind: "bypass", reason: bypass };
  }

  // An explicit native annotation is a bypass even though it arrives through
  // the state attribute.
  if (attributeState === NATIVE_STATE) {
    return { kind: "bypass", reason: "native-region" };
  }

  if (pressed && availableStates.has("active")) {
    return { kind: "state", state: "active" };
  }

  if (attributeState !== undefined && availableStates.has(attributeState)) {
    return { kind: "state", state: attributeState };
  }

  return { kind: "state", state: "default" };
}

/** True when an `<input>` behaves as text entry and needs the native cursor. */
export function isEditableInput(type: string | null): boolean {
  return !NON_EDITABLE_INPUT_TYPES.has((type ?? "text").toLowerCase());
}

export interface CapabilityInput {
  enabled: boolean;
  finePointer: boolean;
  hover: boolean;
  reducedMotion: boolean;
}

/**
 * Whether the custom cursor may attach its movement loop at all.
 *
 * Reduced motion is a hard opt-out for this component specifically: the
 * milestone contract is that such environments receive the native cursor only,
 * not a slower custom one.
 */
export function canAttachCursor({
  enabled,
  finePointer,
  hover,
  reducedMotion,
}: CapabilityInput): boolean {
  return enabled && finePointer && hover && !reducedMotion;
}
