"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { foundationSearchSource } from "../lib/navigation";

interface PagefindResultData {
  readonly excerpt: string;
  readonly meta: { readonly title?: string };
  readonly url: string;
}

interface PagefindResult {
  data(): Promise<PagefindResultData>;
}

interface PagefindModule {
  init(): Promise<void>;
  search(
    query: string,
  ): Promise<{ readonly results: readonly PagefindResult[] }>;
}

interface DisplayResult {
  readonly href: string;
  readonly id: string;
  readonly label: string;
  readonly summary: string;
}

let pagefindPromise: Promise<PagefindModule> | undefined;

function loadPagefind(): Promise<PagefindModule> {
  pagefindPromise ??= (async () => {
    const moduleUrl = "/_pagefind/pagefind.js";
    const module = (await import(
      /* webpackIgnore: true */ moduleUrl
    )) as unknown as PagefindModule;
    await module.init();
    return module;
  })();
  return pagefindPromise;
}

function textOnly(html: string): string {
  return new DOMParser()
    .parseFromString(html, "text/html")
    .body.textContent.trim();
}

function routeUrl(indexUrl: string): string {
  if (indexUrl === "/index.html") return "/";
  return indexUrl.replace(/(?:\/index)?\.html$/u, "");
}

function isEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='textbox'], [data-shortcut-ignore]",
    ),
  );
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly DisplayResult[]>(() =>
    foundationSearchSource.search(""),
  );
  const [status, setStatus] = useState(
    "Type to search every public documentation page.",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const normalizedQuery = query.trim();
  const visibleResults =
    normalizedQuery.length < 2
      ? foundationSearchSource.search(normalizedQuery)
      : results;
  const visibleStatus =
    normalizedQuery.length < 2
      ? "Type two or more characters to search the full Pagefind index."
      : status;

  useEffect(() => {
    if (!open) return;
    const normalized = query.trim();
    if (normalized.length < 2) return;
    let current = true;
    void loadPagefind()
      .then(async (pagefind) => {
        const response = await pagefind.search(normalized);
        const records = await Promise.all(
          response.results.slice(0, 12).map(async (result, index) => {
            const data = await result.data();
            return {
              href: routeUrl(data.url),
              id: `${data.url}:${String(index)}`,
              label: data.meta.title ?? data.url,
              summary: textOnly(data.excerpt),
            };
          }),
        );
        if (current) {
          setResults(records);
          setStatus(
            records.length === 0
              ? "No indexed pages found."
              : `${String(records.length)} indexed result${records.length === 1 ? "" : "s"}.`,
          );
        }
      })
      .catch(() => {
        if (current) {
          setResults(foundationSearchSource.search(normalized));
          setStatus(
            "The generated index is unavailable in development; showing route matches.",
          );
        }
      });
    return () => {
      current = false;
    };
  }, [open, query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditingTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Search documentation"
          aria-keyshortcuts="/"
          className="sui-docs-search-trigger"
          ref={triggerRef}
          type="button"
        >
          <span aria-hidden="true">⌕</span>
          <span>Search</span>
          <kbd>/</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="sui-docs-search-overlay" />
        <Dialog.Content
          aria-describedby="search-foundation-note"
          className="sui-docs-search-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <div className="sui-docs-search-heading">
            <div>
              <p className="sui-docs-eyebrow">Find your way</p>
              <Dialog.Title>Search Scout UI</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close search" type="button">
                Close
              </button>
            </Dialog.Close>
          </div>
          <label htmlFor="docs-search-input">Search routes and guides</label>
          <input
            autoComplete="off"
            id="docs-search-input"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setQuery(value);
              if (value.trim().length >= 2)
                setStatus("Searching the static documentation index…");
            }}
            placeholder="Try “stickers” or “getting started”"
            ref={inputRef}
            type="search"
            value={query}
          />
          <p id="search-foundation-note">
            Search loads the local Pagefind index on demand. No query leaves
            this site.
          </p>
          <div aria-live="polite" className="sui-docs-search-results">
            <p className="sui-docs-eyebrow">{visibleStatus}</p>
            {visibleResults.length > 0 ? (
              <ul>
                {visibleResults.map((result) => (
                  <li key={result.id}>
                    <Dialog.Close asChild>
                      <Link href={result.href}>
                        <strong>{result.label}</strong>
                        <span>{result.summary}</span>
                      </Link>
                    </Dialog.Close>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
