import { describe, expect, it } from "vitest";

import { foundationSearchSource, primaryNavigation } from "../lib/navigation";
import { routeMetadata } from "../lib/site";

describe("docs foundation", () => {
  it("keeps every required major route in the primary navigation", () => {
    expect(primaryNavigation.map((item) => item.href)).toEqual([
      "/",
      "/components",
      "/stickers",
      "/playground",
      "/examples",
      "/guides",
      "/changelog",
      "/open-source",
    ]);
  });

  it("creates route-specific canonical metadata from one origin policy", () => {
    expect(
      routeMetadata({
        path: "/guides",
        title: "Guides",
        description: "Guide description",
      }),
    ).toMatchObject({
      alternates: { canonical: "/guides" },
      title: "Guides",
    });
  });

  it("provides a replaceable foundation search source", () => {
    expect(foundationSearchSource.search("sticker")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/stickers", label: "Stickers" }),
      ]),
    );
    expect(foundationSearchSource.search("not-in-the-foundation")).toEqual([]);
  });
});
