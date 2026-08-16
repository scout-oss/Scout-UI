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
  ["M12", "Documentation application foundation", "current"],
  ["M11", "Public package preflight and alpha API freeze", "complete"],
  ["M10", "StickerNavbar", "complete"],
  ["M9", "StickerStack", "complete"],
] as const;

export default function ChangelogPage() {
  return (
    <div className="sui-docs-page sui-docs-changelog-page">
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
                  ? "In verification"
                  : "Reviewed and committed"}
              </p>
            </div>
            <span>{status}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
