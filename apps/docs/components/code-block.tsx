export interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  readonly label?: string;
  readonly surface?: "night" | "paper";
}

export function CodeBlock({
  code,
  language = "text",
  label,
  surface = "night",
}: CodeBlockProps) {
  return (
    <figure className="sui-docs-code" data-surface={surface}>
      <figcaption>{language}</figcaption>
      {/* The overflow region must be keyboard-scrollable when code is wider. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
      <pre
        aria-label={label ?? `${language} code example`}
        role="region"
        tabIndex={0}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </figure>
  );
}
