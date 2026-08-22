import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { guideDocuments } from "../../content/guides";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/guides",
  title: "Guides",
  description: "Learn Scout UI through calm, server-rendered technical guides.",
});

export default function GuidesPage() {
  return (
    <div className="sui-docs-page sui-docs-guides-page" data-pagefind-body>
      <PageHeading
        eyebrow="The field manual"
        lede="Ten calm, server-rendered guides for expressive interfaces—from installation and theming through accessibility, performance, and local AI handoff."
      >
        Guides
      </PageHeading>
      <ol className="sui-docs-guide-list" data-pagefind-body>
        {guideDocuments.map((guide) => (
          <li key={guide.metadata.slug}>
            <span>{String(guide.metadata.order).padStart(2, "0")}</span>
            <div>
              <h2>
                <Link href={`/guides/${guide.metadata.slug}`}>
                  {guide.metadata.title}
                </Link>
              </h2>
              <p>{guide.metadata.description}</p>
            </div>
            <small>{String(guide.tableOfContents.length)} sections</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
