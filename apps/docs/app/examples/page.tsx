import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { routeMetadata } from "../../lib/site";
import { examples } from "../../lib/content/examples";

export const metadata: Metadata = routeMetadata({
  path: "/examples",
  title: "Examples",
  description:
    "See how Scout UI interactions fit inside real interface regions.",
});

export default function ExamplesPage() {
  return (
    <div className="sui-docs-page sui-docs-examples-page" data-pagefind-body>
      <PageHeading
        eyebrow="Authored foundations"
        lede="Six runnable recipes show where each interaction belongs, what stays semantic, and how the experience adapts."
      >
        Examples with boundaries
      </PageHeading>
      <ol className="sui-docs-example-notes">
        {examples.map((example, index) => (
          <li key={example.slug}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>
                <Link href={`/examples/${example.slug}`}>{example.title}</Link>
              </h2>
              <p>{example.description}</p>
            </div>
            <small>{example.packageName}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
