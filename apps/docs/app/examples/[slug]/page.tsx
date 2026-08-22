import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CodeBlock } from "../../../components/code-block";
import { ExampleCanvas } from "../../../components/examples/example-canvas";
import { PageEdgeNav } from "../../../components/page-edge-nav";
import { exampleCode } from "../../../lib/content/example-code";
import { examples, getExample } from "../../../lib/content/examples";
import { routeMetadata } from "../../../lib/site";

export function generateStaticParams() {
  return examples.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const example = getExample((await params).slug);
  return example
    ? routeMetadata({
        path: `/examples/${example.slug}`,
        title: example.title,
        description: example.description,
        category: "Example",
      })
    : {};
}

export default async function ExamplePage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const example = getExample((await params).slug);
  if (!example) notFound();
  return (
    <article className="sui-docs-page sui-docs-example-page" data-pagefind-body>
      <header className="sui-docs-example-header">
        <p className="sui-docs-eyebrow">
          Runnable recipe · {example.packageName}
        </p>
        <h1 data-route-heading tabIndex={-1}>
          {example.title}
        </h1>
        <p className="sui-docs-lede">{example.description}</p>
      </header>
      <p className="sui-docs-visually-hidden">
        Search terms: {example.searchTerms.join(", ")}
      </p>
      <section id="live-example">
        <h2>Live example</h2>
        <div className="sui-docs-recipe-canvas">
          <ExampleCanvas slug={example.slug} />
        </div>
      </section>
      <section id="source">
        <h2>Source</h2>
        <CodeBlock
          code={exampleCode[example.slug]}
          language="tsx"
          surface="night"
        />
      </section>
      <section id="dependencies">
        <h2>Dependencies</h2>
        <p>
          Install <code>{example.packageName}</code> and the shared{" "}
          <code>@scout-ui/react/styles.css</code> stylesheet. Artwork may come
          from <code>@scout-ui/stickers</code> or your own source.
        </p>
      </section>
      <section id="accessibility">
        <h2>Accessibility contract</h2>
        <p>{example.accessibility}</p>
      </section>
      <section id="adaptation">
        <h2>Motion, touch, and adaptation</h2>
        <p>{example.adaptation}</p>
      </section>
      <PageEdgeNav
        items={[
          { id: "live-example", label: "Live example", level: 2 },
          { id: "source", label: "Source", level: 2 },
          { id: "dependencies", label: "Dependencies", level: 2 },
          { id: "accessibility", label: "Accessibility", level: 2 },
          { id: "adaptation", label: "Adaptation", level: 2 },
        ]}
      />
    </article>
  );
}
