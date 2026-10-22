import type { CSSProperties } from "react";

/**
 * Letter-by-letter display name. The accessible name is the plain text; the
 * individually animated letters are aria-hidden and excluded from search.
 */
export function SplitChars({ text }: { readonly text: string }) {
  return (
    <>
      <span className="sui-docs-visually-hidden">{text}</span>
      <span aria-hidden="true" className="sui-k-chars" data-pagefind-ignore>
        {Array.from(text).map((char, index) => (
          <span
            className="sui-k-char"
            // Characters repeat; position is their identity.
            key={index}
            style={{ "--sui-k-c": index } as CSSProperties}
          >
            {char}
          </span>
        ))}
      </span>
    </>
  );
}
