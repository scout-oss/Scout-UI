import { describe, expect, it } from "vitest";

import { componentCatalog, createRegistry } from "../lib/registry";

describe("typed component registry foundation", () => {
  it("looks up definitions deterministically without mutation", () => {
    const sticker = componentCatalog.get("sticker");
    expect(sticker?.name).toBe("Sticker");
    expect(componentCatalog.get("missing")).toBeUndefined();
    expect(componentCatalog.has("sticker-stack")).toBe(true);
    expect(Object.isFrozen(componentCatalog)).toBe(true);
    expect(Object.isFrozen(componentCatalog.entries)).toBe(true);
    expect(Object.isFrozen(sticker)).toBe(true);
  });

  it("rejects duplicate slugs instead of silently overwriting", () => {
    expect(() =>
      createRegistry([
        {
          slug: "same",
          name: "One",
          packageName: "@scout-ui/react",
          status: "alpha",
        },
        {
          slug: "same",
          name: "Two",
          packageName: "@scout-ui/sticker-trail",
          status: "beta",
        },
      ]),
    ).toThrow("Duplicate component registry slug: same");
  });
});
