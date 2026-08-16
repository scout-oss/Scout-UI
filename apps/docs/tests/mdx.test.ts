import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

import { defineMdxDocument } from "../lib/mdx";

const Content = (() => null) as ComponentType;

describe("typed MDX document boundary", () => {
  it("accepts repository-authored metadata and deterministic TOC data", () => {
    const document = defineMdxDocument({
      Content,
      metadata: {
        title: "Getting started",
        description: "A real guide.",
        order: 1,
      },
      tableOfContents: [
        { id: "install", label: "Install", level: 2 },
        { id: "native-semantics", label: "Native semantics", level: 3 },
      ],
    });
    expect(document.metadata.title).toBe("Getting started");
    expect(document.tableOfContents.map((item) => item.id)).toEqual([
      "install",
      "native-semantics",
    ]);
    expect(Object.isFrozen(document.tableOfContents)).toBe(true);
  });

  it("rejects malformed or missing document data", () => {
    expect(() =>
      defineMdxDocument({
        Content,
        metadata: { title: "Missing fields" },
        tableOfContents: [],
      }),
    ).toThrow("Invalid MDX metadata");
    expect(() =>
      defineMdxDocument({
        Content,
        metadata: { title: "Fine", description: "Fine", order: 1 },
        tableOfContents: [{ id: "bad", label: "Bad", level: 4 }],
      }),
    ).toThrow("Invalid MDX table of contents");
  });
});
