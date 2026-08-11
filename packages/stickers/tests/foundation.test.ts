import { describe, expect, it } from "vitest";

import { stickerPackVersion } from "../src/index";

describe("@scout-ui/stickers foundation", () => {
  it("provides a framework-neutral package entry", () => {
    expect(stickerPackVersion).toBe("0.0.0");
  });
});
