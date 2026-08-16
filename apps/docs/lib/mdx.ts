import type { ComponentType } from "react";

export interface MdxMetadata {
  readonly title: string;
  readonly description: string;
  readonly order: number;
}

export interface TableOfContentsItem {
  readonly id: string;
  readonly label: string;
  readonly level: 2 | 3;
}

export interface MdxDocument {
  readonly Content: ComponentType;
  readonly metadata: MdxMetadata;
  readonly tableOfContents: readonly TableOfContentsItem[];
}

function isMetadata(value: unknown): value is MdxMetadata {
  if (typeof value !== "object" || value === null) return false;
  const metadata = value as Record<string, unknown>;
  return (
    typeof metadata.title === "string" &&
    metadata.title.length > 0 &&
    typeof metadata.description === "string" &&
    metadata.description.length > 0 &&
    typeof metadata.order === "number" &&
    Number.isFinite(metadata.order)
  );
}

function isTableOfContents(value: unknown): value is TableOfContentsItem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const entry = item as Record<string, unknown>;
      return (
        typeof entry.id === "string" &&
        typeof entry.label === "string" &&
        (entry.level === 2 || entry.level === 3)
      );
    })
  );
}

export function defineMdxDocument(input: {
  readonly Content: ComponentType;
  readonly metadata: unknown;
  readonly tableOfContents: unknown;
}): MdxDocument {
  if (!isMetadata(input.metadata)) {
    throw new Error("Invalid MDX metadata.");
  }
  if (!isTableOfContents(input.tableOfContents)) {
    throw new Error("Invalid MDX table of contents.");
  }
  return Object.freeze({
    Content: input.Content,
    metadata: Object.freeze({ ...input.metadata }),
    tableOfContents: Object.freeze(
      input.tableOfContents.map((entry) => Object.freeze({ ...entry })),
    ),
  });
}
