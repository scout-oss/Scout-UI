import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentPageShell } from "../../../components/component-page-shell";
import { componentCatalog } from "../../../lib/registry";
import { absoluteUrl, repositoryUrl, routeMetadata } from "../../../lib/site";

export function generateStaticParams() {
  return componentCatalog.entries.map((component) => ({
    slug: component.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const component = componentCatalog.get(slug);
  if (!component) return {};
  return routeMetadata({
    path: `/components/${component.slug}`,
    title: component.name,
    description: component.purpose,
    category: "Component",
  });
}

export default async function ComponentPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const component = componentCatalog.get(slug);
  if (!component) notFound();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${component.name} — Scout UI`,
    description: component.purpose,
    url: absoluteUrl(`/components/${component.slug}`),
    codeRepository: repositoryUrl,
  };
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
      <ComponentPageShell component={component} />
    </>
  );
}
