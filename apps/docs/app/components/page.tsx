import { StickerBadge } from "@scout-ui/react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { componentCatalog } from "../../lib/registry";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/components",
  title: "Components",
  description: "Browse Scout UI's eight sticker-native React primitives.",
});

export default function ComponentsPage() {
  return (
    <div className="sui-docs-page sui-docs-components-page">
      <PageHeading
        eyebrow="The pinboard"
        lede="Eight primitives, arranged by the job they do—not forced into an identical card grid."
      >
        Components
      </PageHeading>
      <ul className="sui-docs-pinboard">
        {componentCatalog.entries.map((component, index) => (
          <li
            data-accent={component.accent}
            data-kind={component.kind}
            key={component.slug}
          >
            <Link href={`/components/${component.slug}`}>
              <span className="sui-docs-pin-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{component.name}</h2>
                <p>{component.purpose}</p>
              </div>
              <div className="sui-docs-pin-meta">
                <StickerBadge size="compact" tone="paper">
                  {component.status}
                </StickerBadge>
                <code>{component.packageName}</code>
                <span>{component.capabilities.join(" · ")}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
