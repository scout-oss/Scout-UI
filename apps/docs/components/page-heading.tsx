import type { ReactNode } from "react";

export function PageHeading({
  children,
  eyebrow,
  lede,
}: {
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly lede: string;
}) {
  return (
    <header className="sui-docs-page-heading">
      <p className="sui-docs-eyebrow">{eyebrow}</p>
      <h1 data-route-heading tabIndex={-1}>
        {children}
      </h1>
      <p className="sui-docs-lede">{lede}</p>
    </header>
  );
}
