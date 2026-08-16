import Link from "next/link";

import { repositoryUrl } from "../lib/site";
import { EffectsControl } from "./effects-control";

const footerLinks = [
  ["Components", "/components"],
  ["Stickers", "/stickers"],
  ["Playground", "/playground"],
  ["Guides", "/guides"],
  ["Changelog", "/changelog"],
  ["Open source", "/open-source"],
] as const;

export function Footer() {
  return (
    <footer className="sui-docs-footer">
      <div className="sui-docs-footer-mark">
        <span aria-hidden="true">SCOUT UI</span>
        <p>Open-source interfaces with a little more grip.</p>
      </div>
      <nav aria-label="Footer navigation">
        {footerLinks.map(([label, href]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
        <a href={repositoryUrl}>GitHub ↗</a>
      </nav>
      <div className="sui-docs-footer-meta">
        <p>Code: MIT · Official artwork: CC0-1.0 · v0.1 alpha preflight</p>
        <EffectsControl />
      </div>
    </footer>
  );
}
