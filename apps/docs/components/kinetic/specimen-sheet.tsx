import Link from "next/link";
import type { CSSProperties } from "react";

import { componentCatalog, type ComponentSlug } from "../../lib/registry";
import { SpecimenStage } from "./specimen-stage";

/**
 * The component gallery as a kiss-cut specimen sheet: eight live components on
 * one backing, each tile sized by the job it does and labelled with the motion
 * verb it demonstrates. The list stays semantic (one heading + two links per
 * item); the live stage is a narrow client leaf.
 */
const verbs: Record<ComponentSlug, string> = {
  sticker: "carry",
  "sticker-badge": "select",
  "sticker-button": "press",
  "sticker-cursor": "follow",
  "sticker-navbar": "frame",
  "sticker-peel": "peel",
  "sticker-stack": "shuffle",
  "sticker-trail": "trail",
};

// Authored composition order and footprint: loud engines get the big cuts.
const layout: readonly { slug: ComponentSlug; span: string; tilt: number }[] = [
  { slug: "sticker-trail", span: "wide", tilt: -0.6 },
  { slug: "sticker-peel", span: "tall", tilt: 0.8 },
  { slug: "sticker", span: "third", tilt: 0.5 },
  { slug: "sticker-button", span: "third", tilt: -0.9 },
  { slug: "sticker-badge", span: "third", tilt: 0.4 },
  { slug: "sticker-stack", span: "half", tilt: -0.4 },
  { slug: "sticker-cursor", span: "half", tilt: 0.7 },
  { slug: "sticker-navbar", span: "full", tilt: -0.3 },
];

export function SpecimenSheet({
  headingLevel = 3,
}: {
  readonly headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <ul className="sui-k-specimens">
      {layout.map(({ slug, span, tilt }, order) => {
        const component = componentCatalog.get(slug);
        if (!component) return null;
        const number = componentCatalog.entries.indexOf(component) + 1;
        return (
          <li
            className="sui-k-specimen"
            data-accent={component.accent}
            data-kind={component.kind}
            data-span={span}
            id={`specimen-${slug}`}
            key={slug}
            style={
              {
                "--sui-k-tilt": `${String(tilt)}deg`,
                "--sui-k-i": order,
              } as CSSProperties
            }
          >
            <div className="sui-k-specimen-stage">
              <SpecimenStage slug={slug} />
            </div>
            <div className="sui-k-specimen-label">
              <span aria-hidden="true" className="sui-k-specimen-number">
                {String(number).padStart(2, "0")}
              </span>
              <span className="sui-k-specimen-verb">{verbs[slug]}</span>
              <Heading>
                <Link href={`/components/${slug}`}>{component.name}</Link>
              </Heading>
              <p>{component.purpose}</p>
              <p className="sui-k-specimen-caps">
                <span>{component.status}</span>
                {component.capabilities.join(" · ")}
              </p>
              <div className="sui-k-specimen-links">
                <code>{component.packageName}</code>
                <Link
                  aria-label={`${component.name} playground`}
                  href={`/playground/${slug}`}
                >
                  Playground →
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
