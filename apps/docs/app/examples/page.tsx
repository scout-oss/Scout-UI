import type { Metadata } from "next";

import { PageHeading } from "../../components/page-heading";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/examples",
  title: "Examples",
  description:
    "See how Scout UI interactions fit inside real interface regions.",
});

const examples = [
  [
    "A campaign moment",
    "A bounded StickerTrail adds energy to one launch panel—not the entire page.",
  ],
  [
    "A tactile reveal",
    "StickerPeel reveals optional context while preserving both layers and focus.",
  ],
  [
    "A story stack",
    "StickerStack presents a small collection with bounded rendering and native controls.",
  ],
] as const;

export default function ExamplesPage() {
  return (
    <div className="sui-docs-page sui-docs-examples-page">
      <PageHeading
        eyebrow="Authored foundations"
        lede="Examples show where an interaction belongs, what stays semantic, and when a calmer primitive is the better choice. Full runnable recipes arrive with M16."
      >
        Examples with boundaries
      </PageHeading>
      <ol className="sui-docs-example-notes">
        {examples.map(([title, description], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <small>Foundation note</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
