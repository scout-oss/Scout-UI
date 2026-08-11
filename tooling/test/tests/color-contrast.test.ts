import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance } from "../color-contrast";

describe("color contrast helpers", () => {
  it("calculates the WCAG reference extremes", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBe(1);
    expect(contrastRatio("#000000", "#FFFFFF")).toBe(21);
  });

  it("rejects unsupported color syntax", () => {
    expect(() => relativeLuminance("white")).toThrow(TypeError);
  });
});
