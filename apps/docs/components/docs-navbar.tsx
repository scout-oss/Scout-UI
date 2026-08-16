"use client";

import { StickerNavbar } from "@scout-ui/react/sticker-navbar";
import { sunnySmile } from "@scout-ui/stickers/definitions/sunny-smile";
import { sparklePop } from "@scout-ui/stickers/definitions/sparkle-pop";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation } from "../lib/navigation";
import { SearchDialog } from "./search-dialog";

function activeNavigationId(pathname: string): string {
  if (pathname === "/") return "home";
  return (
    primaryNavigation.find(
      (item) => item.href !== "/" && pathname.startsWith(item.href),
    )?.id ?? "home"
  );
}

export function DocsNavbar() {
  const pathname = usePathname();
  const expressive = pathname === "/" || pathname === "/playground";

  return (
    <StickerNavbar
      action={<SearchDialog />}
      activeId={activeNavigationId(pathname)}
      aria-label="Scout UI documentation"
      brand={
        <Link aria-label="Scout UI home" href="/">
          SCOUT UI <sup>α</sup>
        </Link>
      }
      collage={[sunnySmile, wonkyStar, sparklePop]}
      items={primaryNavigation}
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
      variant={expressive ? "collage" : "ribbon"}
    />
  );
}
