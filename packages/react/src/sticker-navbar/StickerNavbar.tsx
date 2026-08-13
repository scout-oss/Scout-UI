import * as Dialog from "@radix-ui/react-dialog";
import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  joinClassNames,
  type ScoutMotionPolicy,
  type ScoutStyleProperties,
  type StickerSource,
} from "../shared-types.js";

declare const process: { env: { NODE_ENV?: string } };

interface DevelopmentImportMeta extends ImportMeta {
  env?: { DEV?: boolean };
}

export interface StickerNavItem {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface StickerNavbarProps
  extends HTMLAttributes<HTMLElement>, ScoutMotionPolicy {
  style?: ScoutStyleProperties;
  variant?: "ribbon" | "collage";
  brand: ReactNode;
  items: readonly StickerNavItem[];
  activeId?: string;
  action?: ReactNode;
  switcher?: ReactNode;
  collage?: readonly StickerSource[];
  ribbonPath?: string;
  sticky?: boolean;
  showScrollProgress?: boolean;
  menuLabel?: string;
  closeMenuLabel?: string;
  onNavigate?: (item: StickerNavItem) => void;
  renderLink?: (
    item: StickerNavItem,
    props: {
      className: string;
      "aria-current"?: "page";
      onClick: MouseEventHandler<HTMLAnchorElement>;
    },
  ) => ReactNode;
}

const COLLAGE_LIMIT = 8;
const COLLAGE_X = [4, 18, 31, 44, 57, 70, 83, 96] as const;
const COLLAGE_Y = [28, 69, 39, 74, 24, 64, 36, 72] as const;

// This authored line favors the lower/background portion of a 96-unit strip.
// Functional surfaces intentionally occlude it anywhere the two layers meet.
const DEFAULT_RIBBON_PATH =
  "M-48 70 C48 25 126 88 234 69 C307 56 319 20 374 20 C430 20 432 69 389 74 C347 78 344 39 399 34 C503 25 526 87 648 68 C746 53 758 14 815 18 C874 23 865 71 822 75 C780 79 782 41 838 36 C933 28 967 84 1066 67 C1151 52 1161 23 1216 28 C1272 33 1261 75 1222 76 C1186 77 1203 46 1252 48 C1334 51 1377 82 1488 63";

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function collageGeometry(source: StickerSource, index: number) {
  const hash = stableHash(`${source.id}:${String(index)}`);
  const baseX = COLLAGE_X[index] ?? 50;
  const baseY = COLLAGE_Y[index] ?? 50;
  const xJitter = (hash % 7) - 3;
  const yJitter = ((hash >>> 4) % 13) - 6;
  const size = 46 + ((hash >>> 9) % 33);
  const rotation = -13 + ((hash >>> 15) % 261) / 10;

  return {
    "--sui-navbar-collage-internal-rotation": `${String(rotation)}deg`,
    "--sui-navbar-collage-internal-size": `${String(size)}px`,
    "--sui-navbar-collage-internal-x": `${String(baseX + xJitter)}%`,
    "--sui-navbar-collage-internal-y": `${String(baseY + yJitter)}%`,
  } as ScoutStyleProperties;
}

function isDevelopment(): boolean {
  // Next and Node expose/replace the conventional environment expression.
  // Vite exposes import.meta.env.DEV. A raw browser ESM consumer has neither,
  // which must stay silent rather than throwing or being mistaken for dev.
  try {
    const nodeEnvironment = process.env.NODE_ENV;
    if (nodeEnvironment !== undefined) {
      return nodeEnvironment !== "production";
    }
  } catch {
    // A raw browser ESM import has no process global. Fall through safely.
  }

  return (import.meta as DevelopmentImportMeta).env?.DEV === true;
}

interface CustomLinkSlotProps {
  active: boolean;
  children: ReactNode;
  item: StickerNavItem;
  warnInvalid: (item: StickerNavItem) => void;
}

/**
 * A framework Link may not itself be the final DOM node. Validate the rendered
 * result instead of inspecting React element types, then add stable fixture
 * markers to the actual anchor without cloning consumer content.
 */
function CustomLinkSlot({
  active,
  children,
  item,
  warnInvalid,
}: CustomLinkSlotProps) {
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const anchor =
      slotRef.current?.querySelector<HTMLAnchorElement>("a[href]") ?? null;
    if (anchor === null) {
      if (isDevelopment()) warnInvalid(item);
      return;
    }

    anchor.dataset.navbarItem = item.id;
    anchor.dataset.active = active ? "true" : "false";
  }, [active, item, warnInvalid]);

  return (
    <span className="sui-sticker-navbar-link-slot" ref={slotRef}>
      {children}
    </span>
  );
}

interface NavbarDecorationProps {
  collage: readonly StickerSource[];
  ribbonPath: string;
  variant: "ribbon" | "collage";
}

function NavbarDecoration({
  collage,
  ribbonPath,
  variant,
}: NavbarDecorationProps) {
  return (
    <div aria-hidden="true" className="sui-sticker-navbar-decoration">
      {variant === "ribbon" ? (
        <svg
          aria-hidden="true"
          className="sui-sticker-navbar-ribbon"
          data-navbar-ribbon="true"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 1440 96"
        >
          <g className="sui-sticker-navbar-ribbon-reveal">
            <path className="sui-sticker-navbar-ribbon-path" d={ribbonPath} />
          </g>
        </svg>
      ) : (
        <div
          aria-hidden="true"
          className="sui-sticker-navbar-collage"
          data-navbar-collage="true"
        >
          {collage.slice(0, COLLAGE_LIMIT).map((source, index) => (
            <img
              alt=""
              aria-hidden="true"
              className="sui-sticker-navbar-collage-item"
              decoding="async"
              draggable={false}
              height={source.height}
              key={`${source.id}:${String(index)}`}
              role="presentation"
              src={source.src}
              style={collageGeometry(source, index)}
              width={source.width}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function documentScrollHeight(): number {
  const root = document.documentElement;
  const body = document.body;
  return Math.max(
    root.clientHeight,
    root.offsetHeight,
    root.scrollHeight,
    body.clientHeight,
    body.offsetHeight,
    body.scrollHeight,
  );
}

export function StickerNavbar(props: StickerNavbarProps) {
  const {
    action,
    activeId,
    "aria-label": landmarkLabel,
    brand,
    className,
    closeMenuLabel = "Close navigation menu",
    collage = [],
    items,
    menuLabel = "Open navigation menu",
    onNavigate,
    reducedMotion = "system",
    renderLink,
    ribbonPath = DEFAULT_RIBBON_PATH,
    showScrollProgress = false,
    sticky = false,
    switcher,
    variant = "ribbon",
    ...elementProps
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationFocusRequest, setNavigationFocusRequest] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const handledNavigationFocusRequestRef = useRef(0);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const warnedInvalidItemsRef = useRef(new Set<string>());
  const enabledItems = items.filter((item) => item.disabled !== true);
  const navigationLabel = landmarkLabel ?? "Primary navigation";

  const focusMenuTrigger = useCallback(() => {
    const trigger = menuTriggerRef.current;
    if (trigger !== null && trigger.getClientRects().length > 0) {
      trigger.focus({ preventScroll: true });
    }
  }, []);

  const warnInvalid = useCallback((item: StickerNavItem) => {
    if (warnedInvalidItemsRef.current.has(item.id)) return;
    warnedInvalidItemsRef.current.add(item.id);
    console.warn(
      `[@scout-ui/react/sticker-navbar] \`renderLink\` for item "${item.id}" did not render an anchor with an href. Return an anchor (directly or through a framework Link) and preserve the supplied className, aria-current, and onClick props.`,
    );
  }, []);

  const renderNavItem = (
    item: StickerNavItem,
    index: number,
    mobile: boolean,
  ) => {
    const active = item.id === activeId;
    const linkProps: {
      className: string;
      "aria-current"?: "page";
      onClick: MouseEventHandler<HTMLAnchorElement>;
    } = {
      className: "sui-sticker-navbar-item",
      onClick: () => {
        onNavigate?.(item);
        if (mobile) {
          setMenuOpen(false);
          setNavigationFocusRequest((request) => request + 1);
        }
      },
    };
    if (active) linkProps["aria-current"] = "page";

    if (renderLink !== undefined) {
      return (
        <CustomLinkSlot
          active={active}
          item={item}
          key={`${item.id}:${String(index)}`}
          warnInvalid={warnInvalid}
        >
          {renderLink(item, linkProps)}
        </CustomLinkSlot>
      );
    }

    return (
      <a
        {...linkProps}
        data-active={active ? "true" : "false"}
        data-navbar-item={item.id}
        href={item.href}
        key={`${item.id}:${String(index)}`}
        rel={item.external === true ? "noopener noreferrer" : undefined}
        target={item.external === true ? "_blank" : undefined}
      >
        {item.label}
      </a>
    );
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!showScrollProgress || header === null) return;

    let frame: number | null = null;
    let latestScrollY = finite(window.scrollY);

    const writeProgress = () => {
      frame = null;
      header.dataset.navbarFramePending = "false";

      const viewportHeight = Math.max(
        0,
        finite(window.innerHeight, document.documentElement.clientHeight),
      );
      const scrollableHeight = Math.max(
        0,
        documentScrollHeight() - viewportHeight,
      );
      const rawProgress =
        scrollableHeight > 0 ? latestScrollY / scrollableHeight : 0;
      const progress = Math.min(1, Math.max(0, finite(rawProgress)));
      const value = String(progress);

      header.style.setProperty("--sui-navbar-internal-progress", value);
      header.dataset.navbarProgressValue = value;
      if (progressRef.current !== null) {
        progressRef.current.dataset.navbarProgressValue = value;
      }
    };

    const scheduleProgress = () => {
      latestScrollY = finite(window.scrollY);
      if (frame !== null) return;
      header.dataset.navbarFramePending = "true";
      frame = window.requestAnimationFrame(writeProgress);
    };

    // Establish the initial semantic value without creating an idle frame.
    writeProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress, { passive: true });

    const resizeObserver =
      typeof window.ResizeObserver === "function"
        ? new window.ResizeObserver(scheduleProgress)
        : null;
    resizeObserver?.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      resizeObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      header.dataset.navbarFramePending = "false";
      header.dataset.navbarProgressValue = "0";
      header.style.setProperty("--sui-navbar-internal-progress", "0");
    };
  }, [showScrollProgress]);

  useEffect(() => {
    if (!menuOpen || typeof window.matchMedia !== "function") return;

    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setMenuOpen(false);
    };

    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => {
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (
      menuOpen ||
      navigationFocusRequest === 0 ||
      handledNavigationFocusRequestRef.current === navigationFocusRequest
    ) {
      return;
    }
    const focusTimers = [0, 50, 150].map((delay) =>
      window.setTimeout(() => {
        handledNavigationFocusRequestRef.current = navigationFocusRequest;
        focusMenuTrigger();
      }, delay),
    );
    return () => {
      for (const focusTimer of focusTimers) {
        window.clearTimeout(focusTimer);
      }
    };
  }, [focusMenuTrigger, menuOpen, navigationFocusRequest]);

  return (
    <Dialog.Root onOpenChange={setMenuOpen} open={menuOpen}>
      <header
        {...elementProps}
        aria-label={landmarkLabel}
        className={joinClassNames("sui-sticker-navbar", className)}
        data-navbar="true"
        data-navbar-frame-pending="false"
        data-navbar-header="true"
        data-navbar-progress-value="0"
        data-reduced-motion={reducedMotion}
        data-sticky={sticky ? "true" : "false"}
        data-variant={variant}
        ref={headerRef}
      >
        <NavbarDecoration
          collage={collage}
          ribbonPath={ribbonPath}
          variant={variant}
        />

        <div className="sui-sticker-navbar-inner">
          <div className="sui-sticker-navbar-brand">{brand}</div>
          {switcher != null ? (
            <div className="sui-sticker-navbar-switcher">{switcher}</div>
          ) : null}

          <nav
            aria-label={navigationLabel}
            className="sui-sticker-navbar-nav"
            data-navbar-nav="desktop"
          >
            {enabledItems.map((item, index) =>
              renderNavItem(item, index, false),
            )}
          </nav>

          {action != null ? (
            <div className="sui-sticker-navbar-action">{action}</div>
          ) : null}

          {enabledItems.length > 0 ? (
            <Dialog.Trigger asChild>
              <button
                aria-label={menuLabel}
                className="sui-sticker-navbar-menu-trigger"
                data-navbar-menu-trigger="true"
                ref={menuTriggerRef}
                type="button"
              >
                <span aria-hidden="true">Menu</span>
              </button>
            </Dialog.Trigger>
          ) : null}
        </div>

        {showScrollProgress ? (
          <div
            aria-hidden="true"
            className="sui-sticker-navbar-progress"
            data-navbar-progress="true"
            data-navbar-progress-value="0"
            ref={progressRef}
          />
        ) : null}
      </header>

      <Dialog.Portal>
        <Dialog.Overlay
          className="sui-sticker-navbar-dialog-overlay"
          data-navbar-dialog-overlay="true"
          data-navbar-overlay="true"
          data-reduced-motion={reducedMotion}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="sui-sticker-navbar-dialog-content"
          data-navbar-content="true"
          data-navbar-dialog-content="true"
          data-reduced-motion={reducedMotion}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            focusMenuTrigger();
          }}
        >
          <Dialog.Title className="sui-sticker-navbar-dialog-title">
            {menuLabel}
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              aria-label={closeMenuLabel}
              className="sui-sticker-navbar-dialog-close"
              data-navbar-close="true"
              data-navbar-dialog-close="true"
              data-reduced-motion={reducedMotion}
              type="button"
            >
              <span aria-hidden="true">Close</span>
            </button>
          </Dialog.Close>
          <nav
            aria-label={navigationLabel}
            className="sui-sticker-navbar-nav sui-sticker-navbar-nav-mobile"
            data-navbar-nav="mobile"
          >
            {enabledItems.map((item, index) =>
              renderNavItem(item, index, true),
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
