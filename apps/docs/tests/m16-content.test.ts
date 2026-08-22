import { describe, expect, it } from "vitest";

import { componentReferenceDetails } from "../lib/content/component-reference";
import { exampleCode } from "../lib/content/example-code";
import { examples, exampleSlugs } from "../lib/content/examples";
import { guideSlugs } from "../lib/content/guides";
import { componentCatalog } from "../lib/registry";

const expectedComponentSlugs = [
  "sticker",
  "sticker-button",
  "sticker-badge",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const;

describe("M16 public content inventory", () => {
  it("ships exactly the ten planned guide records", () => {
    expect(guideSlugs).toEqual([
      "installation",
      "theming",
      "asset-authoring",
      "ssr-nextjs",
      "motion",
      "accessibility",
      "performance",
      "ai-handoff",
      "contributing",
      "migration",
    ]);
  });

  it("keeps all eight references complete and schema-derived", () => {
    expect(componentCatalog.entries).toHaveLength(8);
    expect(Object.keys(componentReferenceDetails).sort()).toEqual(
      [...expectedComponentSlugs].sort(),
    );
    for (const component of componentCatalog.entries) {
      const detail = componentReferenceDetails[component.slug];
      expect(component.schema.fields.length).toBeGreaterThan(3);
      expect(component.presets.length).toBeGreaterThan(0);
      expect(detail.sourcePath).toMatch(/^packages\//u);
      expect(detail.constraints.length).toBeGreaterThan(40);
    }
  });

  it("defines exactly six public-import example recipes", () => {
    expect(exampleSlugs).toHaveLength(6);
    expect(examples.map(({ slug }) => slug)).toEqual(exampleSlugs);
    expect(Object.keys(exampleCode).sort()).toEqual([...exampleSlugs].sort());
    for (const source of Object.values(exampleCode)) {
      expect(source).toMatch(/from "@scout-ui\//u);
      expect(source).not.toMatch(
        /packages\/.+\/(?:src|dist)|apps\/docs|\.\.\//u,
      );
    }
  });
});
