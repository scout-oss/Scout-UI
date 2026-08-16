import { StickerBadge, StickerButton } from "@scout-ui/react";
import Link from "next/link";

import type { ComponentSummaryDefinition } from "../lib/registry";
import { repositoryUrl } from "../lib/site";
import { CodeBlock } from "./code-block";
import { PageEdgeNav } from "./page-edge-nav";
import { PreviewBoundary } from "./preview-boundary";

const sectionItems = [
  { id: "install", label: "Install", level: 2 },
  { id: "usage", label: "Usage", level: 2 },
  { id: "api", label: "API", level: 2 },
  { id: "accessibility", label: "Accessibility", level: 2 },
  { id: "performance", label: "Performance", level: 2 },
  { id: "source", label: "Source", level: 2 },
] as const;

export function ComponentPageShell({
  component,
  failPreview = false,
}: {
  readonly component: ComponentSummaryDefinition;
  readonly failPreview?: boolean;
}) {
  const packageName = component.packageName;
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
          <StickerButton
            href={`${repositoryUrl}/tree/main/packages`}
            tone="paper"
          >
            Source ↗
          </StickerButton>
          <StickerButton href={`${repositoryUrl}/issues`} tone="paper">
            Report issue ↗
          </StickerButton>
        </div>
      </div>

      <PreviewBoundary failFirst={failPreview} />

      <div className="sui-docs-reference-layout" data-preview-following-content>
        <div className="sui-docs-reading-column">
          <section id="install">
            <h2 tabIndex={-1}>Install</h2>
            <p>
              Scout UI is in alpha preflight and is not represented here as a
              public npm release. Inside the workspace, consume the frozen
              package contract by name.
            </p>
            <CodeBlock
              code={`import { ${component.name} } from "${packageName}";\nimport "@scout-ui/react/styles.css";`}
              language="tsx"
              surface="paper"
            />
          </section>
          <section id="usage">
            <h2 tabIndex={-1}>Usage</h2>
            <p>
              Start with semantic content, then add the smallest expressive
              treatment the surrounding interface can support.
            </p>
          </section>
          <section id="api">
            <h2 tabIndex={-1}>API</h2>
            <p>
              The public alpha surface is frozen. Full authored prop tables and
              interactive registry controls arrive in later documentation
              milestones.
            </p>
          </section>
          <section id="accessibility">
            <h2 tabIndex={-1}>Accessibility</h2>
            <p>
              Native semantics, visible focus, reduced motion, forced colors,
              and touch-safe interaction are release requirements—not optional
              examples.
            </p>
          </section>
          <section id="performance">
            <h2 tabIndex={-1}>Performance</h2>
            <p>
              High-frequency visual progress stays outside React state. This
              page hydrates only its navigation, utilities, and bounded preview.
            </p>
          </section>
          <section id="source">
            <h2 tabIndex={-1}>Source</h2>
            <p>
              Inspect the implementation and tests in the public Scout UI
              repository. Code uses MIT licensing; official artwork uses its
              separately documented asset license.
            </p>
            <a href={repositoryUrl}>Open Scout UI on GitHub ↗</a>
          </section>
        </div>
        <PageEdgeNav items={sectionItems} />
      </div>
    </article>
  );
}
