"use client";

import { StickerNavbar, type StickerNavItem } from "@scout-ui/react";
import { StickerNavbar as SubpathStickerNavbar } from "@scout-ui/react/sticker-navbar";
import { bloomFlower } from "@scout-ui/stickers/definitions/bloom-flower";
import { highFive } from "@scout-ui/stickers/definitions/high-five";
import { targetRing } from "@scout-ui/stickers/definitions/target-ring";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import {
  forwardRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEventHandler,
} from "react";

export type NavbarFixtureMode =
  | "collage"
  | "custom"
  | "custom-ribbon"
  | "invalid"
  | "inactive"
  | "long"
  | "night"
  | "reduced"
  | "ribbon"
  | "short"
  | "static";

const standardItems = [
  { id: "overview", label: "Overview", href: "#section-one" },
  { id: "components", label: "Components", href: "#section-two" },
  { id: "accessibility", label: "Accessibility", href: "#section-three" },
  {
    id: "disabled",
    label: "Unavailable preview",
    href: "#disabled-destination",
    disabled: true,
  },
  {
    id: "external",
    label: "External guide",
    href: "https://example.com/scout-ui-guide",
    external: true,
  },
] as const satisfies readonly StickerNavItem[];

const longItems = [
  {
    id: "overview",
    label: "Component Playground",
    href: "#section-one",
  },
  {
    id: "components",
    label: "Accessibility Guidelines",
    href: "#section-two",
  },
  {
    id: "accessibility",
    label: "Configuration Examples",
    href: "#section-three",
  },
] as const satisfies readonly StickerNavItem[];

const collage = [wonkyStar, bloomFlower, targetRing, highFive] as const;

const FrameworkLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement>
>(function FrameworkLink(props, ref) {
  const { children, ...anchorProps } = props;
  return (
    <a {...anchorProps} data-framework-link="true" ref={ref}>
      {children}
    </a>
  );
});

function Brand({ custom = false }: { custom?: boolean }) {
  return (
    <a
      aria-label={custom ? "Orbit workshop home" : "Scout UI fixture home"}
      className="navbar-fixture-brand"
      data-testid="navbar-brand"
      href="#navbar-overview"
    >
      <span aria-hidden="true" className="navbar-fixture-brand-mark">
        {custom ? "O" : "S"}
      </span>
      <span>{custom ? "ORBIT WORKSHOP" : "SCOUT UI"}</span>
    </a>
  );
}

function CustomRenderLink({
  item,
  linkProps,
}: {
  item: StickerNavItem;
  linkProps: {
    className: string;
    "aria-current"?: "page";
    onClick: MouseEventHandler<HTMLAnchorElement>;
  };
}) {
  if (item.id === "overview") {
    return (
      <a {...linkProps} data-custom-link="direct" href={item.href}>
        {item.label}
      </a>
    );
  }

  return (
    <FrameworkLink {...linkProps} data-custom-link="framework" href={item.href}>
      {item.label}
    </FrameworkLink>
  );
}

export function NavbarSurfaces({
  mode = "ribbon",
}: {
  mode?: NavbarFixtureMode;
}) {
  const [navigateCount, setNavigateCount] = useState(0);
  const [lastNavigated, setLastNavigated] = useState("none");
  const isCollage = mode === "collage" || mode === "night";
  const isCustom = mode === "custom";
  const isInvalid = mode === "invalid";
  const isLong = mode === "long";
  const isShort = mode === "short";
  const isStatic = mode === "static";
  const Navbar =
    mode === "custom-ribbon" ? SubpathStickerNavbar : StickerNavbar;

  return (
    <main
      className={`sui-theme navbar-fixture${mode === "night" ? " navbar-fixture-night" : ""}`}
      data-navbar-fixture={mode}
    >
      <Navbar
        {...(isCollage ? { collage } : {})}
        {...(isCustom
          ? {
              renderLink: (
                item: StickerNavItem,
                linkProps: {
                  className: string;
                  "aria-current"?: "page";
                  onClick: MouseEventHandler<HTMLAnchorElement>;
                },
              ) => <CustomRenderLink item={item} linkProps={linkProps} />,
            }
          : isInvalid
            ? {
                renderLink: (
                  item: StickerNavItem,
                  linkProps: {
                    className: string;
                    "aria-current"?: "page";
                    onClick: MouseEventHandler<HTMLAnchorElement>;
                  },
                ) =>
                  item.id === "overview" ? (
                    <button
                      className={linkProps.className}
                      data-invalid-render-link="button"
                      type="button"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={linkProps.className}
                      data-invalid-render-link="span"
                    >
                      {item.label}
                    </span>
                  ),
              }
            : {})}
        {...(mode === "custom-ribbon"
          ? {
              ribbonPath:
                "M -20 68 C 120 8, 280 132, 450 58 S 760 22, 1040 72 S 1320 116, 1500 42",
            }
          : {})}
        {...(mode === "inactive" ? {} : { activeId: "components" })}
        action={
          <a
            className="navbar-fixture-action"
            data-testid="navbar-action"
            href="#fixture-action"
          >
            {isCustom ? "Reserve a studio" : "Join the lab"}
          </a>
        }
        brand={<Brand custom={isCustom} />}
        closeMenuLabel="Close test navigation"
        data-testid="navbar-primary"
        items={isLong ? longItems : standardItems}
        menuLabel="Open test navigation"
        onNavigate={(item) => {
          setNavigateCount((count) => count + 1);
          setLastNavigated(item.id);
        }}
        reducedMotion={mode === "reduced" ? "always" : "system"}
        showScrollProgress={!isStatic}
        sticky={!isShort}
        switcher={
          <button
            className="navbar-fixture-switcher"
            data-testid="navbar-switcher"
            type="button"
          >
            {isCustom ? "Studio 04" : "OSS"}
          </button>
        }
        variant={isCollage ? "collage" : "ribbon"}
      />

      <div className="navbar-fixture-status" aria-live="polite">
        <output data-testid="navbar-navigate-count">{navigateCount}</output>
        <output data-testid="navbar-last-navigated">{lastNavigated}</output>
      </div>

      <section
        aria-labelledby="navbar-overview-heading"
        className="navbar-fixture-hero"
        id="navbar-overview"
      >
        <p>SCOUT UI ENGINEERING SURFACE / M10</p>
        <h1 id="navbar-overview-heading">Navigation with a point of view.</h1>
        <p>
          Real anchors, a clear current page, and expressive decoration that
          never outranks the route ahead.
        </p>
      </section>

      <section
        aria-labelledby="section-one-heading"
        className="navbar-anchor-target"
        data-testid="navbar-anchor-section-one"
        id="section-one"
      >
        <p>SECTION 01</p>
        <h2 id="section-one-heading">A semantic place to begin.</h2>
        <p>
          This target provides real document travel for sticky offset and hash
          navigation tests.
        </p>
      </section>

      {!isShort ? (
        <>
          <section
            aria-labelledby="section-two-heading"
            className="navbar-anchor-target navbar-anchor-target-acid"
            data-testid="navbar-anchor-section-two"
            id="section-two"
          >
            <p>SECTION 02 / CURRENT</p>
            <h2 id="section-two-heading">Components stay practical.</h2>
            <p>
              The active route remains unmistakable at desktop, tablet, and
              inside the modal navigation sheet.
            </p>
          </section>

          <section
            aria-labelledby="section-three-heading"
            className="navbar-anchor-target navbar-anchor-target-night"
            data-testid="navbar-anchor-section-three"
            id="section-three"
          >
            <p>SECTION 03</p>
            <h2 id="section-three-heading">
              Access is part of the composition.
            </h2>
            <p>
              Keyboard order, focus return, forced colors, reduced motion, and
              reflow remain navigation requirements rather than visual extras.
            </p>
          </section>

          <section
            aria-labelledby="fixture-action-heading"
            className="navbar-anchor-target"
            data-testid="navbar-anchor-action"
            id="fixture-action"
          >
            <p>PRIMARY ACTION</p>
            <h2 id="fixture-action-heading">The action lands here.</h2>
          </section>
        </>
      ) : null}
    </main>
  );
}
