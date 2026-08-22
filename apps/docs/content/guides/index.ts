import Accessibility, {
  metadata as accessibilityMetadata,
  tableOfContents as accessibilityTableOfContents,
} from "./accessibility.mdx";
import AiHandoff, {
  metadata as aiHandoffMetadata,
  tableOfContents as aiHandoffTableOfContents,
} from "./ai-handoff.mdx";
import AssetAuthoring, {
  metadata as assetAuthoringMetadata,
  tableOfContents as assetAuthoringTableOfContents,
} from "./asset-authoring.mdx";
import Contributing, {
  metadata as contributingMetadata,
  tableOfContents as contributingTableOfContents,
} from "./contributing.mdx";
import GettingStarted, {
  metadata as gettingStartedMetadata,
  tableOfContents as gettingStartedTableOfContents,
} from "./getting-started.mdx";
import Installation, {
  metadata as installationMetadata,
  tableOfContents as installationTableOfContents,
} from "./installation.mdx";
import Migration, {
  metadata as migrationMetadata,
  tableOfContents as migrationTableOfContents,
} from "./migration.mdx";
import Motion, {
  metadata as motionMetadata,
  tableOfContents as motionTableOfContents,
} from "./motion.mdx";
import Performance, {
  metadata as performanceMetadata,
  tableOfContents as performanceTableOfContents,
} from "./performance.mdx";
import SsrNextjs, {
  metadata as ssrNextjsMetadata,
  tableOfContents as ssrNextjsTableOfContents,
} from "./ssr-nextjs.mdx";
import Theming, {
  metadata as themingMetadata,
  tableOfContents as themingTableOfContents,
} from "./theming.mdx";

import { defineMdxDocument, type MdxDocument } from "../../lib/mdx";
import { guideSlugs } from "../../lib/content/guides";

function document(
  Content: ComponentType,
  metadata: unknown,
  tableOfContents: unknown,
) {
  return defineMdxDocument({ Content, metadata, tableOfContents });
}

export const gettingStartedGuide = document(
  GettingStarted,
  gettingStartedMetadata,
  gettingStartedTableOfContents,
);

export const guideDocuments = [
  document(Installation, installationMetadata, installationTableOfContents),
  document(Theming, themingMetadata, themingTableOfContents),
  document(
    AssetAuthoring,
    assetAuthoringMetadata,
    assetAuthoringTableOfContents,
  ),
  document(SsrNextjs, ssrNextjsMetadata, ssrNextjsTableOfContents),
  document(Motion, motionMetadata, motionTableOfContents),
  document(Accessibility, accessibilityMetadata, accessibilityTableOfContents),
  document(Performance, performanceMetadata, performanceTableOfContents),
  document(AiHandoff, aiHandoffMetadata, aiHandoffTableOfContents),
  document(Contributing, contributingMetadata, contributingTableOfContents),
  document(Migration, migrationMetadata, migrationTableOfContents),
] as const satisfies readonly MdxDocument[];

if (
  guideDocuments.some(
    (guide, index) => guide.metadata.slug !== guideSlugs[index],
  )
) {
  throw new Error(
    "The authored guide registry does not match the M16 route inventory.",
  );
}

export function getGuide(slug: string): MdxDocument | undefined {
  return guideDocuments.find((guide) => guide.metadata.slug === slug);
}
import type { ComponentType } from "react";
