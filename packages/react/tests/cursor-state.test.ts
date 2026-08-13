import { describe, expect, it } from "vitest";

import {
  DEFAULT_STATE_ATTRIBUTE,
  NATIVE_STATE,
  canAttachCursor,
  isEditableInput,
  resolveCursorState,
} from "../src/sticker-cursor/state";

const states = new Set(["default", "hover", "active", "sparkle"]);

function resolve(
  input: Partial<Parameters<typeof resolveCursorState>[0]> = {},
) {
  return resolveCursorState({
    attributeState: undefined,
    availableStates: states,
    bypass: undefined,
    pressed: false,
    ...input,
  });
}

describe("state resolution", () => {
  it("uses default when nothing else applies", () => {
    expect(resolve()).toEqual({ kind: "state", state: "default" });
  });

  it("selects a custom state from the nearest annotation", () => {
    expect(resolve({ attributeState: "sparkle" })).toEqual({
      kind: "state",
      state: "sparkle",
    });
    expect(resolve({ attributeState: "hover" })).toEqual({
      kind: "state",
      state: "hover",
    });
  });

  it("falls back to default for an unknown state instead of vanishing", () => {
    expect(resolve({ attributeState: "does-not-exist" })).toEqual({
      kind: "state",
      state: "default",
    });
  });

  it("prefers active while pressed", () => {
    expect(resolve({ pressed: true })).toEqual({
      kind: "state",
      state: "active",
    });
    expect(resolve({ attributeState: "sparkle", pressed: true })).toEqual({
      kind: "state",
      state: "active",
    });
  });

  it("keeps the annotated state when no active visual exists", () => {
    expect(
      resolveCursorState({
        attributeState: "sparkle",
        availableStates: new Set(["default", "sparkle"]),
        bypass: undefined,
        pressed: true,
      }),
    ).toEqual({ kind: "state", state: "sparkle" });
  });
});

describe("state priority", () => {
  it("puts every bypass above every visual state", () => {
    for (const reason of [
      "native-region",
      "editable",
      "media",
      "disabled-selector",
      "resize-handle",
    ] as const) {
      expect(
        resolve({ attributeState: "sparkle", bypass: reason, pressed: true }),
      ).toEqual({ kind: "bypass", reason });
    }
  });

  it("treats an explicit native annotation as a bypass", () => {
    expect(resolve({ attributeState: NATIVE_STATE })).toEqual({
      kind: "bypass",
      reason: "native-region",
    });
  });

  it("does not let a press escape a native region", () => {
    expect(resolve({ attributeState: NATIVE_STATE, pressed: true })).toEqual({
      kind: "bypass",
      reason: "native-region",
    });
  });

  it("exposes the documented default attribute", () => {
    expect(DEFAULT_STATE_ATTRIBUTE).toBe("data-sticker-cursor");
    expect(NATIVE_STATE).toBe("native");
  });
});

describe("editable input classification", () => {
  it("treats text entry as editable", () => {
    for (const type of [
      "text",
      "search",
      "password",
      "email",
      "url",
      "tel",
      "number",
      "date",
      "datetime-local",
      "month",
      "time",
      "week",
    ]) {
      expect(isEditableInput(type), type).toBe(true);
    }
  });

  it("treats a missing type as text entry", () => {
    expect(isEditableInput(null)).toBe(true);
  });

  it("is case insensitive", () => {
    expect(isEditableInput("CHECKBOX")).toBe(false);
    expect(isEditableInput("Text")).toBe(true);
  });

  it("leaves button-like inputs to the custom cursor", () => {
    for (const type of [
      "button",
      "checkbox",
      "color",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ]) {
      expect(isEditableInput(type), type).toBe(false);
    }
  });

  it("defaults an unknown or future type to editable", () => {
    // Guessing wrong in this direction only costs a decoration; the reverse
    // would break native text interaction.
    expect(isEditableInput("some-future-type")).toBe(true);
  });
});

describe("capability policy", () => {
  const capable = {
    enabled: true,
    finePointer: true,
    hover: true,
    reducedMotion: false,
  };

  it("attaches only on a capable, enabled, motion-permitting environment", () => {
    expect(canAttachCursor(capable)).toBe(true);
  });

  it("refuses on a coarse pointer", () => {
    expect(canAttachCursor({ ...capable, finePointer: false })).toBe(false);
  });

  it("refuses without hover capability", () => {
    expect(canAttachCursor({ ...capable, hover: false })).toBe(false);
  });

  it("refuses under reduced motion, which receives the native cursor only", () => {
    expect(canAttachCursor({ ...capable, reducedMotion: true })).toBe(false);
  });

  it("refuses when disabled", () => {
    expect(canAttachCursor({ ...capable, enabled: false })).toBe(false);
  });
});
