import { Fragment, type CSSProperties } from "react";

/**
 * Splits display copy into masked words for staggered reveals. Real spaces
 * stay between the word boxes so headings keep their accessible text and
 * search indexing; each word only adds an inline-block mask.
 *
 * `*word*` marks an applied-label highlight (one per heading, by convention).
 */
export function SplitWords({ text }: { readonly text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((raw, index) => {
        const match = /^\*(.+)\*([.,!?;:]*)$/u.exec(raw);
        const highlighted = match !== null;
        const word = match ? `${match[1] ?? ""}${match[2] ?? ""}` : raw;
        return (
          // Words can repeat; their order is their identity.
          <Fragment key={index}>
            {index > 0 ? " " : null}
            <span
              className="sui-k-word"
              data-k-highlight={highlighted ? "true" : undefined}
              style={{ "--sui-k-w": index } as CSSProperties}
            >
              <span className="sui-k-word-inner">{word}</span>
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
