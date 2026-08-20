"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { foundationSearchSource } from "../lib/navigation";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const results = useMemo(() => foundationSearchSource.search(query), [query]);

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
              setQuery(event.currentTarget.value);
            }}
            placeholder="Try “stickers” or “getting started”"
            ref={inputRef}
            type="search"
            value={query}
          />
          <p id="search-foundation-note">
            Foundation search covers major routes. Full documentation indexing
            arrives with Pagefind in M16.
          </p>
          <div aria-live="polite" className="sui-docs-search-results">
            <p className="sui-docs-eyebrow">
              {results.length === 0
                ? "No foundation routes found"
                : `${String(results.length)} foundation result${results.length === 1 ? "" : "s"}`}
            </p>
            {results.length > 0 ? (
              <ul>
                {results.map((result) => (
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
