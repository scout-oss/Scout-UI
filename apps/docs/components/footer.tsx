import Link from "next/link";

import { repositoryUrl } from "../lib/site";
import { EffectsControl } from "./effects-control";
import { ScrollSmiley } from "./kinetic/scroll-smiley";

const footerGroups = [
  {
    label: "Build",
    links: [
      ["Components", "/components"],
      ["Stickers", "/stickers"],
      ["Playground", "/playground"],
      ["Examples", "/examples"],
    ],
  },
  {
    label: "Learn",
    links: [
      ["Guides", "/guides"],
      ["Installation", "/guides/installation"],
      ["Accessibility", "/guides/accessibility"],
      ["Changelog", "/changelog"],
    ],
  },
  {
    label: "Community",
    links: [
      ["Open source", "/open-source"],
      ["Contributing", "/guides/contributing"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="sui-docs-footer sui-k-footer">
      <div aria-hidden="true" className="sui-k-footer-band" />
      <div className="sui-k-footer-inner">
        <div className="sui-k-footer-lead">
          <p className="sui-k-footer-statement">
            Make it <span>stick.</span>
          </p>
          <p>Open-source interfaces with a little more grip.</p>
        </div>
        <nav aria-label="Footer navigation" className="sui-k-footer-nav">
          {footerGroups.map((group) => (
            <div key={group.label}>
              <p className="sui-k-footer-label">{group.label}</p>
              <ul>
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
                {group.label === "Community" ? (
                  <li>
                    <a href={repositoryUrl}>GitHub ↗</a>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p aria-hidden="true" className="sui-k-footer-word">
        SC
        <ScrollSmiley />
        UT UI
      </p>
      <div className="sui-docs-footer-meta sui-k-footer-meta">
        <p>Code: MIT · Official artwork: CC0-1.0 · v0.1 alpha preflight</p>
        <EffectsControl />
      </div>
    </footer>
  );
}
