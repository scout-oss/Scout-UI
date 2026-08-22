import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageEdgeNav } from "../../../components/page-edge-nav";
import { getGuide, guideDocuments } from "../../../content/guides";
import { routeMetadata } from "../../../lib/site";

export function generateStaticParams() {
  return guideDocuments.map((guide) => ({ slug: guide.metadata.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return routeMetadata({
    path: `/guides/${guide.metadata.slug}`,
    title: guide.metadata.title,
    description: guide.metadata.description,
    category: "Guide",
  });
}

export default async function GuidePage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const { Content, metadata, tableOfContents } = guide;
  return (
    <article className="sui-docs-reading-page" data-pagefind-body>
      <header>
        <Link className="sui-docs-breadcrumb" href="/guides">
          ← Guides
        </Link>
        <p className="sui-docs-eyebrow">
          Field manual · {String(metadata.order).padStart(2, "0")}
        </p>
        <h1 data-route-heading tabIndex={-1}>
          {metadata.title}
        </h1>
        <p className="sui-docs-lede">{metadata.description}</p>
      </header>
      <div className="sui-docs-reference-layout" data-pagefind-body>
        <div className="sui-docs-reading-column sui-docs-mdx">
          <p className="sui-docs-visually-hidden">
            Search terms: {metadata.searchTerms.join(", ")}
          </p>
          <Content />
          <section
            aria-labelledby="related-guides"
            className="sui-docs-related"
          >
            <h2 id="related-guides">Continue through the field manual</h2>
            <p>
              Browse all ten guides or move into the component reference for
              configuration-specific behavior.
            </p>
            <p>
              <Link href="/guides">All guides</Link> ·{" "}
              <Link href="/components">Component reference</Link>
            </p>
          </section>
        </div>
        <PageEdgeNav items={tableOfContents} />
      </div>
    </article>
  );
}
