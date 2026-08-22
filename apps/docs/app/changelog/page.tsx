import type { Metadata } from "next";

import { PageHeading } from "../../components/page-heading";
import { routeMetadata } from "../../lib/site";

export const metadata: Metadata = routeMetadata({
  path: "/changelog",
  title: "Changelog",
  description:
    "Follow Scout UI's repository milestones before its first public alpha release.",
});

const milestones = [
  ["M16", "Complete documentation, examples, search, and discovery", "current"],
  ["M15", "Configuration-aware Copy AI Prompt", "complete"],
  ["M14", "Deterministic Copy Code", "complete"],
  [
    "M13",
    "Typed registry, interactive playground, and share state",
    "complete",
  ],
  ["M12", "Documentation application foundation", "complete"],
  ["M11", "Public package preflight and alpha API freeze", "complete"],
  ["M10", "StickerNavbar", "complete"],
  ["M9", "StickerStack", "complete"],
  ["M8", "StickerPeel", "complete"],
  ["M7", "StickerCursor", "complete"],
  ["M6", "StickerTrail engine and standalone package", "complete"],
  ["M5", "Shared primitives", "complete"],
] as const;

export default function ChangelogPage() {
  return (
    <div className="sui-docs-page sui-docs-changelog-page" data-pagefind-body>
      <PageHeading
        eyebrow="Repository record · not an npm release feed"
        lede="Scout UI has not been presented as a published v0.1 package. Until release, this page records reviewed project milestones without inventing versions."
      >
        Changelog
      </PageHeading>
      <ol className="sui-docs-changelog">
        {milestones.map(([milestone, title, status]) => (
          <li key={milestone}>
            <strong>{milestone}</strong>
            <div>
              <h2>{title}</h2>
              <p>
                {status === "current"
                  ? "In local verification; not yet committed"
                  : "Reviewed and committed"}
              </p>
            </div>
            <span>{status}</span>
          </li>
        ))}
      </ol>
      <section className="sui-docs-license-note">
        <p className="sui-docs-eyebrow">Release record</p>
        <h2>No public npm version has been announced.</h2>
        <p>
          This is development milestone history. Future package release notes
          will be generated through Changesets and will remain distinct from
          this repository progress record.
        </p>
      </section>
    </div>
  );
}
