import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  componentCodeGenerators,
  defaultCodegenContext,
  extractModuleSpecifiers,
  generateCodeForDefinition,
  isApprovedGeneratedImport,
} from "../lib/codegen/generate-code";
import {
  canonicalGeneratedSamples,
  codegenComponentSlugs,
  representativeCodegenConfigs,
} from "../lib/codegen/canonical-samples";
import type {
  ComponentDocDefinition,
  ComponentSlug,
  JsonPrimitive,
} from "../lib/component-registry/types";
import {
  CODE_HIGHLIGHT_DEBOUNCE_MS,
  COPY_SUCCESS_MS,
  isCurrentHighlightResponse,
  type HighlightRequest,
} from "../components/playground/code-highlight-protocol";
import { componentCatalog } from "../lib/registry";

type RuntimeConfig = Record<string, JsonPrimitive>;
type RuntimeDefinition = ComponentDocDefinition<RuntimeConfig>;

function runtimeDefinition(slug: ComponentSlug): RuntimeDefinition {
  const definition = componentCatalog.get(slug);
  if (!definition) throw new Error(`Missing component definition: ${slug}`);
  return definition as unknown as RuntimeDefinition;
}

function generated(
  slug: ComponentSlug,
  values: Record<string, JsonPrimitive> = {},
) {
  const definition = runtimeDefinition(slug);
  return generateCodeForDefinition(
    definition,
    { ...definition.defaults, ...values },
    defaultCodegenContext,
  );
}

function syntaxDiagnostics(source: string) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "generated.tsx",
    reportDiagnostics: true,
  });
  return (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
}

describe("M14 deterministic code generators", () => {
  it("attaches exactly one generator to each of the eight M13 definitions", () => {
    expect(Object.keys(componentCodeGenerators)).toHaveLength(8);
    expect(Object.keys(componentCodeGenerators)).toEqual(
      expect.arrayContaining([...codegenComponentSlugs]),
    );
    expect(codegenComponentSlugs).toHaveLength(8);
    for (const slug of codegenComponentSlugs) {
      const definition = runtimeDefinition(slug);
      expect(
        definition.generateCode(definition.defaults, defaultCodegenContext),
      ).toBe(generated(slug).source);
      expect(typeof definition.generatePrompt).toBe("function");
    }
  });

  it("snapshots 8 defaults, 24 presets, and 8 representative custom outputs", () => {
    const samples = canonicalGeneratedSamples();
    expect(samples).toHaveLength(40);
    expect(
      samples.filter(
        (sample) =>
          sample.id.endsWith("/default") && !sample.id.includes("/preset/"),
      ),
    ).toHaveLength(8);
    expect(
      samples.filter((sample) => sample.id.includes("/preset/")),
    ).toHaveLength(24);
    expect(
      samples.filter((sample) => sample.id.endsWith("/custom")),
    ).toHaveLength(8);
    for (const sample of samples)
      expect(sample.source).toMatchSnapshot(sample.id);
  });

  it("parses every canonical sample and audits every module specifier", () => {
    for (const sample of canonicalGeneratedSamples()) {
      expect(syntaxDiagnostics(sample.source), sample.id).toEqual([]);
      const modules = extractModuleSpecifiers(sample.source);
      expect(modules.length, sample.id).toBeGreaterThan(1);
      for (const module of modules) {
        expect(
          isApprovedGeneratedImport(module),
          `${sample.id}: ${module}`,
        ).toBe(true);
      }
      expect(sample.source).not.toMatch(
        /(?:apps\/docs|packages\/|\/src\/|\/dist\/|\\r)/u,
      );
    }
  });

  it("is byte-identical across repeated runs and independent of mutation history", () => {
    for (let run = 0; run < 3; run += 1) {
      for (const slug of codegenComponentSlugs) {
        expect(generated(slug, representativeCodegenConfigs[slug]).source).toBe(
          generated(slug, { ...representativeCodegenConfigs[slug] }).source,
        );
      }
    }
    const first = generated("sticker-trail", {
      sequence: "random",
      spacing: 66,
    }).source;
    const second = generated("sticker-trail", {
      spacing: 66,
      sequence: "random",
    }).source;
    expect(first).toBe(second);
    expect(first.indexOf("spacing=")).toBeLessThan(first.indexOf("sequence="));
  });

  it("omits defaults, uses idiomatic booleans and emits changed values exactly once", () => {
    const stack = generated("sticker-stack", {
      drag: true,
      loop: true,
      visibleCount: 5,
    }).source;
    expect(stack.match(/\bdrag\b/gu)).toHaveLength(1);
    expect(stack.match(/\bloop\b/gu)).toHaveLength(1);
    expect(stack.match(/visibleCount=\{5\}/gu)).toHaveLength(1);
    expect(stack).not.toContain('axis="x"');
    const peel = generated("sticker-peel", { drag: false }).source;
    expect(peel.match(/drag=\{false\}/gu)).toHaveLength(1);
  });

  it("escapes adversarial text as a string expression that remains valid TSX", () => {
    const hostile = `  "'\\\\\n✦ </script> \${notCode} {x} <>&  `;
    const source = generated("sticker-button", { label: hostile }).source;
    expect(syntaxDiagnostics(source)).toEqual([]);
    expect(source).toContain("</script>");
    expect(source).toContain("\\n");
    expect(source).not.toContain("<script>");
    expect(source.match(/notCode/gu)).toHaveLength(1);
  });

  it("normalizes hostile asset IDs before trusted import mapping", () => {
    for (const sourceId of ["../../x", "@scope/pkg", `bad"id`]) {
      const source = generated("sticker", { sourceId }).source;
      expect(source).toContain("definitions/sunny-smile");
      expect(source).not.toContain(sourceId);
      expect(syntaxDiagnostics(source)).toEqual([]);
    }
  });

  it("emits discriminated branches without invalid hybrids", () => {
    const anchor = generated("sticker-button", {
      element: "anchor",
      loading: true,
    }).source;
    expect(anchor).toContain('href="/components"');
    expect(anchor).not.toContain("loading");
    const selectable = generated("sticker-badge", {
      mode: "select",
      selected: true,
    }).source;
    expect(selectable).toContain('"use client";');
    expect(selectable).toContain("onSelectedChange={setSelected}");
    const removable = generated("sticker-badge", { mode: "remove" }).source;
    expect(removable).toContain("onRemove={() => setVisible(false)}");
    expect(removable).not.toMatch(/<button/iu);
  });
});

describe("M14 highlighting protocol", () => {
  it("keeps the worker payload small, typed, and stale-safe", () => {
    const request: HighlightRequest = {
      id: 4,
      language: "tsx",
      source: "<Sticker />",
      theme: "github-light",
    };
    expect(Object.keys(request).sort()).toEqual([
      "id",
      "language",
      "source",
      "theme",
    ]);
    expect(isCurrentHighlightResponse(4, 4)).toBe(true);
    expect(isCurrentHighlightResponse(3, 4)).toBe(false);
    expect(CODE_HIGHLIGHT_DEBOUNCE_MS).toBeGreaterThanOrEqual(100);
    expect(CODE_HIGHLIGHT_DEBOUNCE_MS).toBeLessThanOrEqual(250);
    expect(COPY_SUCCESS_MS).toBe(2000);
  });
});
