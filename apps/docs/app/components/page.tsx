import type { Metadata } from "next";

import { SpecimenSheet } from "../../components/kinetic/specimen-sheet";
import { PageHeading } from "../../components/page-heading";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/components",
  title: "Components",
  description: "Browse Scout UI's eight sticker-native React primitives.",
});

export default function ComponentsPage() {
  return (
    <div
      className="sui-docs-page sui-docs-components-page sui-k-wide-page sui-k-gallery-page"
      data-pagefind-body
    >
      <PageHeading
        eyebrow="The specimen sheet · eight live primitives"
        lede="Every tile is the published component, running. Each one is sized by the job it does and labelled with the motion verb it owns — try it here, then open its reference or playground."
      >
        Components
      </PageHeading>
      <SpecimenSheet headingLevel={2} />
    </div>
  );
}
