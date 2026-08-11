import { describe, expect, it } from "vitest";

import { scoutUiReactVersion } from "../src/index";

describe("@scout-ui/react foundation", () => {
  it("keeps the root module server-safe", () => {
    expect(scoutUiReactVersion).toBe("0.0.0");
  });
});
