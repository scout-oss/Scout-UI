import type { Metadata } from "next";
import Link from "next/link";

import { PageEdgeNav } from "../../../components/page-edge-nav";
import { gettingStartedGuide } from "../../../content/guides";
import { routeMetadata } from "../../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/guides/getting-started",
  title: gettingStartedGuide.metadata.title,
  description: gettingStartedGuide.metadata.description,
});

export default function GettingStartedPage() {
  const { Content, tableOfContents } = gettingStartedGuide;
  return (
    <article className="sui-docs-reading-page">
      <header>
        <Link className="sui-docs-breadcrumb" href="/guides">
          ← Guides
        </Link>
        <p className="sui-docs-eyebrow">Field manual · 01</p>
        <h1 data-route-heading tabIndex={-1}>
          {gettingStartedGuide.metadata.title}
        </h1>
        <p className="sui-docs-lede">
          {gettingStartedGuide.metadata.description}
        </p>
      </header>
      <div className="sui-docs-reference-layout">
        <div className="sui-docs-reading-column sui-docs-mdx">
          <Content />
        </div>
        <PageEdgeNav items={tableOfContents} />
      </div>
    </article>
  );
}
