import type { Metadata } from "next";

import { ComponentPageShell } from "../../../components/component-page-shell";
import { componentCatalog } from "../../../lib/registry";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Preview error test surface — Scout UI",
};

export default function PreviewErrorTestSurface() {
  const component = componentCatalog.get("sticker");
  if (!component) throw new Error("Sticker registry fixture is missing.");
  return <ComponentPageShell component={component} failPreview />;
}
