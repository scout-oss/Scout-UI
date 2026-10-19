import type { ReactNode } from "react";

import { SplitWords } from "./kinetic/split-words";

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
    <header className="sui-docs-page-heading sui-k-page-heading">
      <p className="sui-docs-eyebrow">{eyebrow}</p>
      <h1 data-route-heading tabIndex={-1}>
        {typeof children === "string" ? (
          <>
            {/* The title stays one contiguous text node in server HTML for
                search engines and the accessible name; the masked words are
                a decorative, search-ignored layer. */}
            <span className="sui-docs-visually-hidden">{children}</span>
            <span aria-hidden="true" data-pagefind-ignore>
              <SplitWords text={children} />
            </span>
          </>
        ) : (
          children
        )}
      </h1>
      <p className="sui-docs-lede">{lede}</p>
    </header>
  );
}
