import type { Metadata } from "next";

export const repositoryUrl = "https://github.com/scout-oss/Scout-UI";
export const docsOriginEnvironmentKey = "SCOUT_UI_DOCS_ORIGIN";

function validatedOrigin(raw: string | undefined): URL {
  const candidate = raw ?? "http://127.0.0.1:4300";
  const origin = new URL(candidate);
  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    throw new Error(`${docsOriginEnvironmentKey} must use http or https.`);
  }
  return origin;
}

export const siteOrigin = validatedOrigin(
  process.env[docsOriginEnvironmentKey],
);

export interface RouteMetadataInput {
  path: `/${string}` | "/";
  title: string;
  description: string;
  category?: "Component" | "Example" | "Guide" | "Reference";
}

export function absoluteUrl(path: `/${string}` | "/"): string {
  return new URL(path, siteOrigin).href;
}

export function routeMetadata({
  description,
  path,
  title,
  category = "Reference",
}: RouteMetadataInput): Metadata {
  return {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      images: [`/og/${category.toLowerCase()}/${encodeURIComponent(title)}`],
      siteName: "Scout UI",
      title,
      type: "website",
      url: path,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [`/og/${category.toLowerCase()}/${encodeURIComponent(title)}`],
      title,
    },
  };
}
