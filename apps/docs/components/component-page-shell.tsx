import { StickerBadge, StickerButton } from "@scout-ui/react";
import Link from "next/link";

import type { ComponentSummaryDefinition } from "../lib/registry";
import { componentReferenceDetails } from "../lib/content/component-reference";
import { repositoryUrl } from "../lib/site";
import { CodeBlock } from "./code-block";
import { PageEdgeNav } from "./page-edge-nav";
import { PlaygroundSession } from "./playground/playground-session";

const sectionItems = [
  { id: "install", label: "Install", level: 2 },
  { id: "usage", label: "Usage", level: 2 },
  { id: "examples", label: "Examples", level: 2 },
  { id: "api", label: "API", level: 2 },
  { id: "accessibility", label: "Accessibility", level: 2 },
  { id: "motion", label: "Motion", level: 2 },
  { id: "touch", label: "Touch", level: 2 },
  { id: "ssr", label: "SSR", level: 2 },
  { id: "performance", label: "Performance", level: 2 },
  { id: "constraints", label: "Constraints", level: 2 },
  { id: "source", label: "Source", level: 2 },
] as const;

function defaultCode(component: ComponentSummaryDefinition): string {
  const generate = component.generateCode as unknown as (
    config: object,
    context: { readonly framework: "react" },
  ) => string;
  return generate(component.defaults, { framework: "react" });
}

export function ComponentPageShell({
  component,
  failPreview = false,
}: {
  readonly component: ComponentSummaryDefinition;
  readonly failPreview?: boolean;
}) {
  const packageName = component.packageName;
  const detail = componentReferenceDetails[component.slug];
  const sourceUrl = `${repositoryUrl}/blob/main/${detail.sourcePath}`;
  return (
    <article className="sui-docs-component-page">
      <div className="sui-docs-component-intro">
        <Link className="sui-docs-breadcrumb" href="/components">
          ← Component pinboard
        </Link>
        <div className="sui-docs-component-title-row">
          <div>
            <p className="sui-docs-eyebrow">{component.kind} primitive</p>
            <h1 data-route-heading tabIndex={-1}>
              {component.name}
            </h1>
            <p className="sui-docs-lede">{component.purpose}</p>
          </div>
          <div className="sui-docs-component-meta">
            <StickerBadge tone="acid">{component.status}</StickerBadge>
            <code>{packageName}</code>
          </div>
        </div>
        <div className="sui-docs-component-actions">
          <StickerButton href="#install" shape="label" tone="cyan">
            Install
          </StickerButton>
          <StickerButton href={sourceUrl} tone="paper">
            Source ↗
          </StickerButton>
          <StickerButton href={`${repositoryUrl}/issues`} tone="paper">
            Report issue ↗
          </StickerButton>
        </div>
      </div>

      <PlaygroundSession
        failPreview={failPreview}
        initialConfig={{ ...component.defaults }}
        mode="component"
        slug={component.slug}
      />

      <div className="sui-docs-reference-layout" data-preview-following-content>
        <div
          className="sui-docs-reading-column"
          data-pagefind-body={failPreview ? undefined : true}
        >
          <p className="sui-docs-visually-hidden">
            Search terms: {component.name}, {component.packageName},{" "}
            {component.searchTerms.join(", ")}
          </p>
          <section id="install">
            <h2 tabIndex={-1}>Install</h2>
            <p>
              Scout UI is in alpha preflight and is not represented here as a
              public npm release. Inside the workspace, consume the frozen
              package contract by name.
            </p>
            <CodeBlock
              code={`import { ${component.name} } from "${packageName}";\nimport "@scout-ui/react/styles.css";`}
              label={`${component.name} install code`}
              language="tsx"
              surface="paper"
            />
          </section>
          <section id="usage">
            <h2 tabIndex={-1}>Usage</h2>
            <p>{detail.usage}</p>
            <CodeBlock
              code={defaultCode(component)}
              label={`${component.name} usage code`}
              language="tsx"
              surface="night"
            />
          </section>
          <section id="examples">
            <h2 tabIndex={-1}>Examples</h2>
            <p>
              Inspect a complete authored setting, then adapt it without copying
              private implementation details.
            </p>
            <Link href={`/examples/${detail.exampleSlug}`}>
              Open the related recipe →
            </Link>
          </section>
          <section id="api">
            <h2 tabIndex={-1}>API</h2>
            <p>
              <code>{detail.typeName}</code> is part of the frozen alpha
              surface. The table below is generated from the same typed schema
              that powers presets, preview, Copy Code, share URLs, and Copy AI
              Prompt.
            </p>
            <div className="sui-docs-api-table-wrap">
              <table className="sui-docs-api-table">
                <thead>
                  <tr>
                    <th scope="col">Prop</th>
                    <th scope="col">Control</th>
                    <th scope="col">Default</th>
                    <th scope="col">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {component.schema.fields.map((field) => (
                    <tr key={field.key}>
                      <th scope="row">
                        <code>{field.codegen.prop ?? field.key}</code>
                      </th>
                      <td>{field.kind}</td>
                      <td>
                        <code>{JSON.stringify(field.default)}</code>
                      </td>
                      <td>{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Presets</h3>
            <ul className="sui-docs-reference-list">
              {component.presets.map((preset) => (
                <li key={preset.id}>
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </li>
              ))}
            </ul>
          </section>
          <section id="accessibility">
            <h2 tabIndex={-1}>Accessibility</h2>
            <p>{detail.keyboard}</p>
          </section>
          <section id="motion">
            <h2 tabIndex={-1}>Motion and reduced motion</h2>
            <p>{detail.reducedMotion}</p>
          </section>
          <section id="touch">
            <h2 tabIndex={-1}>Touch and small screens</h2>
            <p>{detail.touch}</p>
          </section>
          <section id="ssr">
            <h2 tabIndex={-1}>SSR and React Server Components</h2>
            <p>{detail.ssr}</p>
          </section>
          <section id="performance">
            <h2 tabIndex={-1}>Performance</h2>
            <p>{detail.performance}</p>
          </section>
          <section id="constraints">
            <h2 tabIndex={-1}>Constraints</h2>
            <p>{detail.constraints}</p>
          </section>
          <section id="source">
            <h2 tabIndex={-1}>Source</h2>
            <p>
              Inspect the implementation and tests in the public Scout UI
              repository. Code uses MIT licensing; official artwork uses its
              separately documented asset license.
            </p>
            <a href={sourceUrl}>Open the public source file ↗</a>
          </section>
        </div>
        <PageEdgeNav items={sectionItems} />
      </div>
    </article>
  );
}
