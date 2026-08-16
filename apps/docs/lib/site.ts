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
}

export function routeMetadata({
  description,
  path,
  title,
}: RouteMetadataInput): Metadata {
  return {
    alternates: { canonical: path },
    description,
    title,
  };
}
