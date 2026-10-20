"use client";

import { StickerNavbar } from "@scout-ui/react/sticker-navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation } from "../lib/navigation";
import { repositoryUrl } from "../lib/site";
import { ScrollSmiley } from "./kinetic/scroll-smiley";
import { SearchDialog } from "./search-dialog";

// The bar carries the five destinations people actually navigate between.
// Home lives on the brand; Changelog and Open source stay one keystroke away
// in search and in the footer (primaryNavigation still feeds both).
const barIds = new Set([
  "components",
  "stickers",
  "playground",
  "examples",
  "guides",
]);
const barNavigation = primaryNavigation.filter((item) => barIds.has(item.id));

function activeNavigationId(pathname: string): string | undefined {
  return barNavigation.find((item) => pathname.startsWith(item.href))?.id;
}

export function DocsNavbar() {
  const pathname = usePathname();
  const activeId = activeNavigationId(pathname);

  return (
    <StickerNavbar
      action={
        <div className="sui-docs-navbar-actions">
          <a href={repositoryUrl}>GitHub ↗</a>
          <SearchDialog />
          <Link className="sui-docs-navbar-start" href="/components">
            Start sticking <span aria-hidden="true">→</span>
          </Link>
        </div>
      }
      {...(activeId === undefined ? {} : { activeId })}
      aria-label="Scout UI documentation"
      brand={
        <Link aria-label="Scout UI home" className="sui-k-brand" href="/">
          <ScrollSmiley />
          <span className="sui-k-brand-word">
            SCOUT UI <sup>α</sup>
          </span>
        </Link>
      }
      className="sui-k-navbar"
      items={barNavigation}
      reducedMotion="system"
      renderLink={(item, props) => (
        <Link
          aria-current={props["aria-current"]}
          className={props.className}
          href={item.href}
          onClick={props.onClick}
        >
          {item.label}
        </Link>
      )}
      showScrollProgress
      sticky
      variant="ribbon"
    />
  );
}
