import GettingStarted, {
  metadata as gettingStartedMetadata,
  tableOfContents as gettingStartedTableOfContents,
} from "./getting-started.mdx";

import { defineMdxDocument } from "../../lib/mdx";

export const gettingStartedGuide = defineMdxDocument({
  Content: GettingStarted,
  metadata: gettingStartedMetadata,
  tableOfContents: gettingStartedTableOfContents,
});
