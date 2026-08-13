import { StickerNavbar as StickerNavbarLeaf } from "../src/sticker-navbar/index.js";
import { StickerNavbar } from "../src/index.js";
import type {
  StickerNavbarProps,
  StickerNavItem,
  StickerSource,
} from "../src/index.js";

const items = [
  { href: "/", id: "home", label: "Home" },
  { external: true, href: "https://example.com", id: "away", label: "Away" },
  { disabled: true, href: "/later", id: "later", label: "Later" },
] as const satisfies readonly StickerNavItem[];

const collage: readonly StickerSource[] = [
  { id: "one", src: "/one.svg", width: 80 },
];

void (
  <>
    <StickerNavbar brand="Scout" items={items} />
    <StickerNavbarLeaf brand={<strong>Scout</strong>} items={items} />
    <StickerNavbar
      action={<a href="/join">Join</a>}
      activeId="home"
      brand={<span>Scout</span>}
      className="consumer-navbar"
      closeMenuLabel="Close site menu"
      collage={collage}
      id="navbar"
      items={items}
      menuLabel="Open site menu"
      onNavigate={(item) => {
        item.href.toUpperCase();
        item.disabled?.valueOf();
      }}
      reducedMotion="always"
      renderLink={(item, props) => (
        <a {...props} data-router-link={item.id} href={item.href}>
          {item.label}
        </a>
      )}
      ribbonPath="M0 20 C80 0 160 40 240 20"
      showScrollProgress
      sticky
      style={{ "--sui-navbar-height": "5rem" }}
      switcher={<button type="button">Theme</button>}
      variant="collage"
    />
  </>
);

const props = {
  activeId: "home",
  brand: "Scout",
  items,
  variant: "ribbon",
} satisfies StickerNavbarProps;
void props;

const missingBrand = {
  items,
  // @ts-expect-error brand is a required semantic slot.
} satisfies StickerNavbarProps;
void missingBrand;

const invalidItem = {
  id: "missing-href",
  label: "Missing href",
  // @ts-expect-error every enabled or disabled navigation item needs an href.
} satisfies StickerNavItem;
void invalidItem;

void (
  <StickerNavbar
    brand="Scout"
    items={items}
    // @ts-expect-error only Ribbon and Collage are public variants.
    variant="tabs"
  />
);

void (
  <StickerNavbar
    brand="Scout"
    items={items}
    // @ts-expect-error tone is intentionally not part of the v0.1 API.
    tone="paper"
  />
);

void (
  <StickerNavbar
    brand="Scout"
    items={items}
    // @ts-expect-error reducedMotion cannot override an OS reduction request.
    reducedMotion="never"
  />
);

void (
  <StickerNavbar
    brand="Scout"
    items={items}
    renderLink={(_item, linkProps) => {
      // @ts-expect-error destinations stay on the item, not the forwarded props.
      void linkProps.href;
      return null;
    }}
  />
);
