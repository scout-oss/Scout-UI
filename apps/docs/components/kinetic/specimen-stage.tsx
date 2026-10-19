"use client";

import {
  Sticker,
  StickerBadge,
  type StickerSource,
  StickerButton,
  StickerCursor,
  StickerNavbar,
  StickerPeel,
  StickerStack,
  StickerTrail,
} from "@scout-ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { collageSticker } from "../../lib/collage";
import type { ComponentSlug } from "../../lib/component-registry/types";
import {
  isOnScreen,
  isSkimming,
  trackSkimming,
} from "../../lib/kinetic/visibility";
import { StickerDesk } from "./sticker-desk";

// Specimens are live material, not code samples, so they use the site's
// printed-matter set (lib/collage.ts) rather than the official v0.1 pack.
const ticket = collageSticker("ticket-stub");
const mixtape = collageSticker("mixtape");
const stamp = collageSticker("postage-stamp");
const patch = collageSticker("embroidered-patch");
const heart = collageSticker("pixel-heart");
const seal = collageSticker("foil-seal");
const photo = collageSticker("instant-photo");
const floppy = collageSticker("floppy-disk");

const deskTrio = [ticket, patch, heart];

/**
 * Mounts a live specimen the first time its tile approaches the viewport, so
 * the homepage never pays for eight engines up front and offscreen demos never
 * run. Before that, the server-rendered poster holds the exact same footprint.
 */
function WhenNear({
  children,
  poster,
}: {
  readonly children: ReactNode;
  readonly poster: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    trackSkimming();
    let retry = 0;
    // Mount only when the tile is near *now* and the page is not being
    // skimmed; engines with mount choreography never start offscreen.
    const attempt = () => {
      window.clearTimeout(retry);
      if (!isOnScreen(element, 240)) return;
      if (isSkimming()) {
        retry = window.setTimeout(attempt, 180);
        return;
      }
      setNear(true);
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) attempt();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(element);
    return () => {
      window.clearTimeout(retry);
      observer.disconnect();
    };
  }, []);
  return (
    <div className="sui-k-specimen-live" ref={ref}>
      {near ? children : poster}
    </div>
  );
}

function PressSpecimen() {
  const [presses, setPresses] = useState(0);
  return (
    <div className="sui-k-specimen-center">
      <StickerButton
        onClick={() => {
          setPresses((count) => count + 1);
        }}
        shape="label"
        size="large"
        tone="cyan"
      >
        Press it
      </StickerButton>
      <output
        aria-live="polite"
        className="sui-k-press-count"
        // Re-keying replays the stamp's slap on every press.
        key={presses}
      >
        {presses === 0 ? "0 presses" : `×${String(presses)}`}
      </output>
    </div>
  );
}

const badgeOptions = ["sticky", "bounded", "native", "loud"] as const;

function SelectSpecimen() {
  const [selected, setSelected] = useState<readonly string[]>([
    "sticky",
    "native",
  ]);
  return (
    <div
      aria-label="Badge qualities"
      className="sui-k-specimen-center sui-k-badge-cloud"
      role="group"
    >
      {badgeOptions.map((option, index) => (
        <StickerBadge
          key={option}
          mode="select"
          onSelectedChange={(next) => {
            setSelected((current) =>
              next
                ? [...current, option]
                : current.filter((item) => item !== option),
            );
          }}
          rotation={[-4, 3, -2, 5][index] ?? 0}
          selected={selected.includes(option)}
          tone={(["acid", "pink", "cyan", "orange"] as const)[index] ?? "acid"}
        >
          {option}
        </StickerBadge>
      ))}
    </div>
  );
}

const stackCards = [
  { id: "one", label: "Drag me sideways.", tone: "acid" },
  { id: "two", label: "Velocity decides.", tone: "pink" },
  { id: "three", label: "Arrow keys work too.", tone: "cyan" },
] as const;

function NavbarSpecimen() {
  const [active, setActive] = useState("stick");
  return (
    <div className="sui-k-specimen-navbar">
      <StickerNavbar
        activeId={active}
        aria-label="Specimen navigation"
        brand={<span className="sui-k-specimen-brand">STICK/CO</span>}
        items={[
          { href: "#specimen-sticker-navbar", id: "stick", label: "Stick" },
          { href: "#specimen-sticker-navbar", id: "peel", label: "Peel" },
          { href: "#specimen-sticker-navbar", id: "stack", label: "Stack" },
        ]}
        renderLink={(item, props) => (
          <a
            aria-current={props["aria-current"]}
            className={props.className}
            href={item.href}
            onClick={(event) => {
              event.preventDefault();
              setActive(item.id);
              props.onClick(event);
            }}
          >
            {item.label}
          </a>
        )}
        variant="ribbon"
      />
    </div>
  );
}

function Poster({
  source,
  verb,
}: {
  readonly source: StickerSource;
  readonly verb: string;
}) {
  return (
    <div className="sui-k-specimen-poster">
      <Sticker alt="" rotation={-6} size="xl" source={source} />
      <span>{verb}</span>
    </div>
  );
}

export function SpecimenStage({ slug }: { readonly slug: ComponentSlug }) {
  switch (slug) {
    case "sticker":
      return (
        <WhenNear poster={<Poster source={heart} verb="carry" />}>
          <StickerDesk
            artScale={1.4}
            compact
            label="Three Sticker components you can pick up and throw"
            stickers={deskTrio}
          />
        </WhenNear>
      );
    case "sticker-button":
      return <PressSpecimen />;
    case "sticker-badge":
      return <SelectSpecimen />;
    case "sticker-trail":
      return (
        <WhenNear poster={<Poster source={mixtape} verb="trail" />}>
          <StickerTrail
            aria-label="Move a pointer here to leave a short sticker trail"
            className="sui-k-specimen-field"
            maxActive={10}
            preset="calm"
            size={{ max: 132, min: 104 }}
            spacing={{ max: 96, min: 64 }}
            stickers={[mixtape, stamp, ticket, patch]}
          >
            <span className="sui-k-specimen-hint">Draw here →</span>
          </StickerTrail>
        </WhenNear>
      );
    case "sticker-cursor":
      return (
        <WhenNear poster={<Poster source={seal} verb="follow" />}>
          <StickerCursor
            className="sui-k-specimen-field"
            clickFeedback="echo"
            size={84}
            tilt={14}
            visuals={{
              default: { source: heart },
              hover: { source: seal },
            }}
          >
            <div className="sui-k-specimen-center">
              <span className="sui-k-specimen-hint">Your pointer, stuck.</span>
              <button
                className="sui-k-chip"
                data-sticker-cursor="hover"
                type="button"
              >
                Hover state
              </button>
            </div>
          </StickerCursor>
        </WhenNear>
      );
    case "sticker-peel":
      return (
        <WhenNear poster={<Poster source={photo} verb="peel" />}>
          <StickerPeel
            back={
              <div className="sui-k-peel-face" data-side="back">
                <strong>Underneath.</strong>
                <span>Still semantic.</span>
              </div>
            }
            className="sui-k-specimen-peel"
            drag
            front={
              <div className="sui-k-peel-face" data-side="front">
                <Sticker alt="" shadow="none" size="lg" source={photo} />
                <strong>Peel the corner.</strong>
              </div>
            }
            origin="bottom-right"
            peelSize={96}
          />
        </WhenNear>
      );
    case "sticker-stack":
      return (
        <WhenNear poster={<Poster source={floppy} verb="shuffle" />}>
          <StickerStack
            className="sui-k-specimen-stack"
            drag
            getKey={(item) => item.id}
            items={stackCards}
            loop
            renderItem={(item, context) => (
              <article data-tone={item.tone}>
                <span>0{String(context.index + 1)}</span>
                <strong>{item.label}</strong>
              </article>
            )}
            visibleCount={3}
          />
        </WhenNear>
      );
    case "sticker-navbar":
      return (
        <WhenNear poster={<Poster source={stamp} verb="frame" />}>
          <NavbarSpecimen />
        </WhenNear>
      );
  }
}
