import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { componentCatalog } from "../../lib/registry";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/playground",
  title: "Playground",
  description:
    "Configure every Scout UI component from one typed, shareable registry.",
});

export default function PlaygroundPage() {
  return (
    <div className="sui-docs-page sui-docs-playground-page">
      <PageHeading
        eyebrow="Typed workbench · M13"
        lede="Choose one component, shape it with safe controls, and share the exact normalized state. Code and AI handoff enrich this same registry in the next milestones."
      >
        Playground
      </PageHeading>
      <ol className="sui-docs-playground-index">
        {componentCatalog.entries.map((component, index) => (
          <li
            data-accent={component.accent}
            data-kind={component.kind}
            key={component.slug}
          >
            <Link href={`/playground/${component.slug}`}>
              <span>
                0{String(index + 1)} · {component.packageName}
              </span>
              <strong>{component.name}</strong>
              <p>{component.purpose}</p>
              <small>
                {component.schema.fields.length} safe controls ·{" "}
                {component.presets.length} presets
              </small>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
