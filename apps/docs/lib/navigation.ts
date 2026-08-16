import type { StickerNavItem } from "@scout-ui/react/sticker-navbar";

export const primaryNavigation = [
  { id: "home", label: "Home", href: "/" },
  { id: "components", label: "Components", href: "/components" },
  { id: "stickers", label: "Stickers", href: "/stickers" },
  { id: "playground", label: "Playground", href: "/playground" },
  { id: "examples", label: "Examples", href: "/examples" },
  { id: "guides", label: "Guides", href: "/guides" },
  { id: "changelog", label: "Changelog", href: "/changelog" },
  { id: "open-source", label: "Open source", href: "/open-source" },
] as const satisfies readonly StickerNavItem[];

export interface SearchResult {
  readonly href: string;
  readonly id: string;
  readonly label: string;
  readonly summary: string;
}

const searchResults = [
  ...primaryNavigation.map((item) => ({
    href: item.href,
    id: item.id,
    label: item.label,
    summary: `Scout UI ${item.label.toLowerCase()} foundation`,
  })),
  {
    href: "/guides/getting-started",
    id: "getting-started",
    label: "Getting started",
    summary: "Install styles and render your first sticker-native control.",
  },
] as const satisfies readonly SearchResult[];

export interface SearchSource {
  search(query: string): readonly SearchResult[];
}

export const foundationSearchSource: SearchSource = {
  search(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchResults;
    return searchResults.filter((item) =>
      `${item.label} ${item.summary}`.toLowerCase().includes(normalized),
    );
  },
};
