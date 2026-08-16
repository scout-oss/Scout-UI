import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentPageShell } from "../../../components/component-page-shell";
import { componentCatalog } from "../../../lib/registry";
import { routeMetadata } from "../../../lib/site";

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
  return <ComponentPageShell component={component} />;
}
