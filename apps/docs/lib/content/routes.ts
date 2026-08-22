import { guideDocuments } from "../../content/guides";
import { componentCatalog } from "../registry";
import { examples } from "./examples";

export interface PublicRouteRecord {
  readonly path: `/${string}` | "/";
  readonly title: string;
  readonly description: string;
  readonly kind: "page" | "component" | "example" | "guide" | "playground";
}

const pages = [
  ["/", "Scout UI", "The open-source sticker UI library."],
  ["/components", "Components", "Eight accessible sticker-native primitives."],
  ["/stickers", "Stickers", "The framework-neutral official sticker drawer."],
  [
    "/playground",
    "Playground",
    "Configure, preview, share, and hand off Scout UI.",
  ],
  ["/examples", "Examples", "Six bounded recipes for real interface regions."],
  [
    "/guides",
    "Guides",
    "Installation, design, accessibility, and engineering guidance.",
  ],
  [
    "/changelog",
    "Changelog",
    "Reviewed repository milestones before public alpha.",
  ],
  [
    "/open-source",
    "Open source",
    "Licenses, provenance, security, and contribution routes.",
  ],
] as const;

export const publicRoutes: readonly PublicRouteRecord[] = [
  ...pages.map(([path, title, description]) => ({
    path,
    title,
    description,
    kind: "page" as const,
  })),
  ...componentCatalog.entries.map((component) => ({
    path: `/components/${component.slug}` as const,
    title: component.name,
    description: component.purpose,
    kind: "component" as const,
  })),
  ...componentCatalog.entries.map((component) => ({
    path: `/playground/${component.slug}` as const,
    title: `${component.name} playground`,
    description: `Configure and share ${component.name}.`,
    kind: "playground" as const,
  })),
  ...examples.map((example) => ({
    path: `/examples/${example.slug}` as const,
    title: example.title,
    description: example.description,
    kind: "example" as const,
  })),
  ...guideDocuments.map((guide) => ({
    path: `/guides/${guide.metadata.slug}` as const,
    title: guide.metadata.title,
    description: guide.metadata.description,
    kind: "guide" as const,
  })),
];
