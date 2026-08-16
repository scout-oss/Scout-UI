export interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  readonly surface?: "night" | "paper";
}

export function CodeBlock({
  code,
  language = "text",
  surface = "night",
}: CodeBlockProps) {
  return (
    <figure className="sui-docs-code" data-surface={surface}>
      <figcaption>{language}</figcaption>
      {/* The overflow region must be keyboard-scrollable when code is wider. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre aria-label={`${language} code example`} role="region" tabIndex={0}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </figure>
  );
}
