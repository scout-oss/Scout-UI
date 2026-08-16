import { StickerBadge, StickerButton } from "@scout-ui/react";
import type { Metadata } from "next";

import { CodeBlock } from "../../components/code-block";
import { PageHeading } from "../../components/page-heading";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/playground",
  title: "Playground",
  description:
    "See the honest foundation for Scout UI's future configuration playground.",
});

export default function PlaygroundPage() {
  return (
    <div className="sui-docs-page sui-docs-playground-page">
      <PageHeading
        eyebrow="Foundation state · M12"
        lede="The final playground will connect preview, controls, generated code, prompts, and share state through one schema. This milestone establishes the room, not fake controls."
      >
        Playground
      </PageHeading>
      <div className="sui-docs-playground-grid" data-sui-theme="night">
        <section>
          <StickerBadge tone="cyan">Preview</StickerBadge>
          <div className="sui-docs-playground-poster">
            <strong>Preview canvas reserved</strong>
            <p>One bounded interaction will live here.</p>
          </div>
        </section>
        <section className="sui-docs-controls-poster">
          <StickerBadge tone="acid">Controls · M13</StickerBadge>
          <h2>Schema-driven, not wired yet.</h2>
          <p>
            No misleading toggles. M13 owns validation, presets, URL state,
            reset, and sharing.
          </p>
          <StickerButton disabled tone="paper">
            Controls arrive in M13
          </StickerButton>
        </section>
        <section className="sui-docs-output-poster">
          <StickerBadge tone="pink">Output · M14–M15</StickerBadge>
          <CodeBlock
            code={
              "// Generated code and AI prompt will share one validated configuration."
            }
            language="tsx"
          />
        </section>
      </div>
    </div>
  );
}
