import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "../../../components/page-heading";
import { PlaygroundSession } from "../../../components/playground/playground-session";
import {
  componentCatalog,
  getComponentDefinition,
  isComponentSlug,
} from "../../../lib/registry";
import { decodePlaygroundConfig } from "../../../lib/component-registry/url-state";
import type { JsonPrimitive } from "../../../lib/component-registry/types";
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
  const component = getComponentDefinition(slug);
  if (!component) return {};
  return routeMetadata({
    path: `/playground/${component.slug}`,
    title: `${component.name} playground`,
    description: `Configure and share a safe ${component.name} preview from the Scout UI typed registry.`,
  });
}

export default async function ComponentPlaygroundPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isComponentSlug(slug)) notFound();
  const component = getComponentDefinition(slug);
  const cfg = Array.isArray(query.cfg) ? query.cfg[0] : query.cfg;
  const version = Array.isArray(query.v) ? query.v[0] : query.v;
  const restored = decodePlaygroundConfig(component, {
    ...(cfg ? { cfg } : {}),
    ...(version ? { v: version } : {}),
  });

  return (
    <div className="sui-docs-page sui-docs-full-playground">
      <PageHeading
        eyebrow={`${component.status} · ${component.packageName}`}
        lede={component.purpose}
      >
        {component.name} playground
      </PageHeading>
      <PlaygroundSession
        initialConfig={
          restored.config as unknown as Record<string, JsonPrimitive>
        }
        initialNotice={restored.notice}
        mode="playground"
        slug={component.slug}
      />
    </div>
  );
}
