import type { Page } from "@playwright/test";

export interface ResourceCounts {
  detachedListeners: number;
  listeners: number;
  /** Live listener count per event type. */
  listenersByType: Record<string, number>;
  resizeObservers: number;
  intersectionObservers: number;
  frames: number;
}

/**
 * The event types the Trail engine registers. Asserting on these isolates the
 * library's own cleanup from the host framework's listener churn, which a
 * repeated mount/unmount of a Next.js route legitimately produces.
 */
export const TRAIL_LISTENER_TYPES = [
  "pointerenter",
  "pointermove",
  "pointerleave",
  "pointercancel",
  "pointerdown",
  "pointerup",
  "resize",
  "scroll",
  "visibilitychange",
  "change",
] as const;

export function trailListenerTotal(counts: ResourceCounts): number {
  return TRAIL_LISTENER_TYPES.reduce(
    (total, type) => total + (counts.listenersByType[type] ?? 0),
    0,
  );
}

/**
 * Counts live browser resources so a mount/unmount cycle can be proven leak
 * free.
 *
 * Listener accounting has to understand `AbortSignal` removal: Scout UI removes
 * listeners by aborting a controller, which never calls `removeEventListener`.
 * Counting add/remove pairs alone would report a false leak.
 */
export async function installResourceTracker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const live = new Set<object>();
    let resizeObservers = 0;
    let intersectionObservers = 0;
    const frames = new Set<number>();

    interface ListenerEntry {
      listener: EventListenerOrEventListenerObject | null;
      target: EventTarget;
      type: string;
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method -- deliberately detached; every call site supplies the receiver.
    const originalAdd = EventTarget.prototype.addEventListener;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- deliberately detached; every call site supplies the receiver.
    const originalRemove = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function patchedAdd(
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      const entry: ListenerEntry = { listener, target: this, type };
      live.add(entry);

      const signal = typeof options === "object" ? options.signal : undefined;

      if (signal !== undefined) {
        if (signal.aborted) {
          live.delete(entry);
        } else {
          // Use the unpatched method so bookkeeping is not itself counted.
          originalAdd.call(
            signal,
            "abort",
            () => {
              live.delete(entry);
            },
            { once: true },
          );
        }
      }

      originalAdd.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function patchedRemove(
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      for (const entry of live) {
        const record = entry as ListenerEntry;
        if (
          record.target === this &&
          record.type === type &&
          record.listener === listener
        ) {
          live.delete(entry);
          break;
        }
      }

      originalRemove.call(this, type, listener, options);
    };

    class TrackedResizeObserver extends ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback);
        resizeObservers += 1;
      }

      override disconnect() {
        resizeObservers -= 1;
        super.disconnect();
      }
    }

    class TrackedIntersectionObserver extends IntersectionObserver {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super(callback, options);
        intersectionObservers += 1;
      }

      override disconnect() {
        intersectionObservers -= 1;
        super.disconnect();
      }
    }

    window.ResizeObserver = TrackedResizeObserver;
    window.IntersectionObserver = TrackedIntersectionObserver;

    const originalRequest = window.requestAnimationFrame.bind(window);
    const originalCancel = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = (callback) => {
      const handle = originalRequest((timestamp) => {
        frames.delete(handle);
        callback(timestamp);
      });
      frames.add(handle);
      return handle;
    };

    window.cancelAnimationFrame = (handle) => {
      frames.delete(handle);
      originalCancel(handle);
    };

    Object.defineProperty(window, "__scoutUiResourceCounts", {
      configurable: false,
      value: () => {
        let detachedListeners = 0;
        const listenersByType: Record<string, number> = {};
        for (const entry of live) {
          const { target, type } = entry as ListenerEntry;
          listenersByType[type] = (listenersByType[type] ?? 0) + 1;
          if (target instanceof Node && !target.isConnected) {
            detachedListeners += 1;
          }
        }

        return {
          detachedListeners,
          frames: frames.size,
          intersectionObservers,
          listeners: live.size,
          listenersByType,
          resizeObservers,
        };
      },
    });
  });
}

export async function readResourceCounts(page: Page): Promise<ResourceCounts> {
  return await page.evaluate(() => {
    const scope = window as typeof window & {
      __scoutUiResourceCounts?: () => ResourceCounts;
    };

    if (scope.__scoutUiResourceCounts === undefined) {
      throw new Error("Resource tracker was not installed");
    }

    return scope.__scoutUiResourceCounts();
  });
}
