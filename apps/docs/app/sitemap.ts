import type { MetadataRoute } from "next";

import { publicRoutes } from "../lib/content/routes";
import { absoluteUrl } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.path === "/" ? 1 : route.kind === "component" ? 0.9 : 0.7,
  }));
}
