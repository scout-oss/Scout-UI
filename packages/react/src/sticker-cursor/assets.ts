/**
 * Cursor asset readiness.
 *
 * The native cursor may only be hidden once the artwork that would replace it
 * has actually decoded. Everything here exists to make "ready" mean decoded,
 * and to make a stale async completion incapable of resurrecting an obsolete
 * source.
 */

export type AssetStatus = "pending" | "ready" | "failed";

export interface AssetRegistry {
  /** Begin decoding every source; safe to call repeatedly. */
  load(sources: readonly string[]): void;
  status(src: string): AssetStatus;
  /** True when the source decoded successfully and may be displayed. */
  isReady(src: string): boolean;
  /** Cancel this generation: later completions are ignored. */
  dispose(): void;
}

export interface AssetRegistryOptions {
  /**
   * Called when a source settles. The engine re-evaluates readiness rather
   * than polling, so nothing re-renders React.
   */
  onSettled: () => void;
  /**
   * A decode that never settles must not strand the user without a cursor, so
   * it is treated as a failure after this long.
   */
  timeoutMs?: number;
}

const DEFAULT_DECODE_TIMEOUT_MS = 8000;

/**
 * Create a registry scoped to one engine generation.
 *
 * Every callback checks `disposed` before touching state, so a decode that
 * resolves after a configuration change, a disable, or an unmount can neither
 * mark an obsolete source ready nor mutate a dead component.
 */
export function createAssetRegistry({
  onSettled,
  timeoutMs = DEFAULT_DECODE_TIMEOUT_MS,
}: AssetRegistryOptions): AssetRegistry {
  const statuses = new Map<string, AssetStatus>();
  const images = new Map<string, HTMLImageElement>();
  const timers = new Map<string, number>();
  let disposed = false;

  function settle(src: string, status: AssetStatus) {
    if (disposed || statuses.get(src) !== "pending") {
      return;
    }

    const timer = timers.get(src);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.delete(src);
    }

    statuses.set(src, status);
    onSettled();
  }

  function load(sources: readonly string[]) {
    if (disposed) {
      return;
    }

    for (const src of sources) {
      if (src.length === 0 || statuses.has(src)) {
        continue;
      }

      statuses.set(src, "pending");

      const image = new Image();
      images.set(src, image);
      image.decoding = "async";

      timers.set(
        src,
        window.setTimeout(() => {
          settle(src, "failed");
        }, timeoutMs),
      );

      // `decode()` resolves only once the bitmap is usable, which is exactly
      // the guarantee needed before hiding the native cursor. `load` alone
      // would allow a first paint with no pixels.
      image.addEventListener(
        "error",
        () => {
          settle(src, "failed");
        },
        { once: true },
      );

      image.src = src;

      void image
        .decode()
        .then(() => {
          settle(src, "ready");
        })
        .catch(() => {
          settle(src, "failed");
        });
    }
  }

  return {
    dispose() {
      disposed = true;
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
      for (const image of images.values()) {
        // Detaching the source cancels an in-flight fetch in most engines and
        // drops the decode reference either way.
        image.removeAttribute("src");
      }
      images.clear();
      statuses.clear();
    },
    isReady(src) {
      return statuses.get(src) === "ready";
    },
    load,
    status(src) {
      return statuses.get(src) ?? "pending";
    },
  };
}
