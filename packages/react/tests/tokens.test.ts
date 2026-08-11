import { describe, expect, it } from "vitest";

import { contrastRatio } from "../../../tooling/test/color-contrast";
import { scoutUiTokens } from "../src/tokens.generated";

const tokenValues = new Map(
  scoutUiTokens.map(({ name, value }) => [name, value] as const),
);

function token(name: (typeof scoutUiTokens)[number]["name"]): string {
  const value = tokenValues.get(name);
  if (!value) throw new Error(`Missing token ${name}`);
  return value;
}

describe("Scout UI token foundation", () => {
  it("contains every required token group", () => {
    expect(new Set(scoutUiTokens.map(({ group }) => group))).toEqual(
      new Set([
        "accent",
        "density",
        "foundation",
        "intensity",
        "layer",
        "motion",
        "outline",
        "semantic",
        "shadow",
        "shape",
        "spacing",
        "typography",
      ]),
    );
  });

  it.each([
    ["paper", "--sui-ink", "--sui-paper", 4.5],
    ["paper muted", "--sui-ink-muted", "--sui-paper", 4.5],
    ["night", "--sui-night-text", "--sui-night", 4.5],
    ["night muted", "--sui-night-muted", "--sui-night", 4.5],
    ["ultraviolet", "--sui-paper-raised", "--sui-ultraviolet", 4.5],
    ["acid", "--sui-ink", "--sui-acid", 4.5],
    ["cyan", "--sui-ink", "--sui-cyan", 4.5],
    ["hot pink", "--sui-ink", "--sui-hot-pink", 4.5],
    ["cobalt", "--sui-paper-raised", "--sui-cobalt", 4.5],
    ["orange", "--sui-ink", "--sui-orange", 4.5],
    ["success", "--sui-success-text", "--sui-success-surface", 4.5],
    ["warning", "--sui-warning-text", "--sui-warning-surface", 4.5],
    ["danger", "--sui-danger-text", "--sui-danger-surface", 4.5],
    ["information", "--sui-information-text", "--sui-information-surface", 4.5],
  ] as const)(
    "meets AA contrast for %s",
    (_, foreground, background, minimum) => {
      expect(
        contrastRatio(token(foreground), token(background)),
      ).toBeGreaterThanOrEqual(minimum);
    },
  );

  it("keeps focus colors visible across intended surfaces", () => {
    const pairs = [
      ["--sui-ultraviolet", "--sui-paper-raised"],
      ["--sui-cyan", "--sui-night"],
      ["--sui-paper-raised", "--sui-ultraviolet"],
      ["--sui-ink", "--sui-acid"],
      ["--sui-ink", "--sui-cyan"],
    ] as const;

    for (const [focus, surface] of pairs) {
      expect(
        contrastRatio(token(focus), token(surface)),
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
