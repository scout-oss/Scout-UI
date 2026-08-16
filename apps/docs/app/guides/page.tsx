import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { gettingStartedGuide } from "../../content/guides";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/guides",
  title: "Guides",
  description: "Learn Scout UI through calm, server-rendered technical guides.",
});

export default function GuidesPage() {
  return (
    <div className="sui-docs-page sui-docs-guides-page">
      <PageHeading
        eyebrow="The field manual"
        lede="Calm explanations for expressive interfaces. M12 begins with one useful repository-authored guide and a typed MDX pipeline."
      >
        Guides
      </PageHeading>
      <ol className="sui-docs-guide-list">
        <li>
          <span>01</span>
          <div>
            <h2>
              <Link href="/guides/getting-started">
                {gettingStartedGuide.metadata.title}
              </Link>
            </h2>
            <p>{gettingStartedGuide.metadata.description}</p>
          </div>
          <small>
            {String(gettingStartedGuide.tableOfContents.length)} sections
          </small>
        </li>
      </ol>
    </div>
  );
}
