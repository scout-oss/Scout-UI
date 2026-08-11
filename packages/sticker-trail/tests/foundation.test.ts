import { describe, expect, it } from "vitest";

import { stickerTrailVersion } from "../src/index";

describe("@scout-ui/sticker-trail foundation", () => {
  it("provides a buildable package entry", () => {
    expect(stickerTrailVersion).toBe("0.0.0");
  });
});
