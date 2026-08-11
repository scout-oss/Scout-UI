import { describe, expect, it } from "vitest";

import { scoutUiDocsStatus } from "../src/index";

describe("docs foundation", () => {
  it("exposes the foundation status", () => {
    expect(scoutUiDocsStatus).toBe("foundation");
  });
});
