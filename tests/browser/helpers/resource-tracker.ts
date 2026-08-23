import type { Page } from "@playwright/test";

export interface ResourceCounts {
  animations: number;
  detachedListeners: number;
  intervals: number;
  listeners: number;
  /** Live listener count per event type. */
  listenersByType: Record<string, number>;
  resizeObservers: number;
  intersectionObservers: number;
  frames: number;
  mutationObservers: number;
  pointerCaptures: number;
  timeouts: number;
  workers: number;
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
    let mutationObservers = 0;
    const connectedMutationObservers = new WeakSet<MutationObserver>();
    const frames = new Set<number>();
    const intervals = new Set<number>();
    const timeouts = new Set<number>();
    const workers = new Set<Worker>();
    const activeWorkers = new WeakSet<Worker>();
    const pointerCaptures = new Set<{
      element: Element;
      pointerId: number;
    }>();

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

    class TrackedMutationObserver extends MutationObserver {
      constructor(callback: MutationCallback) {
        super(callback);
        connectedMutationObservers.add(this);
        mutationObservers += 1;
      }

      override disconnect() {
        if (connectedMutationObservers.has(this)) {
          connectedMutationObservers.delete(this);
          mutationObservers -= 1;
        }
        super.disconnect();
      }

      override observe(target: Node, options?: MutationObserverInit) {
        if (!connectedMutationObservers.has(this)) {
          connectedMutationObservers.add(this);
          mutationObservers += 1;
        }
        super.observe(target, options);
      }
    }

    window.ResizeObserver = TrackedResizeObserver;
    window.IntersectionObserver = TrackedIntersectionObserver;
    window.MutationObserver = TrackedMutationObserver;

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

    const originalSetTimeout = window.setTimeout.bind(window);
    const originalClearTimeout = window.clearTimeout.bind(window);
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      if (typeof handler !== "function") {
        return originalSetTimeout(handler, timeout, ...args);
      }
      const callback = handler as (...callbackArguments: unknown[]) => void;
      const handle = originalSetTimeout(() => {
        timeouts.delete(handle);
        callback(...args);
      }, timeout);
      timeouts.add(handle);
      return handle;
    }) as typeof window.setTimeout;
    window.clearTimeout = (handle) => {
      timeouts.delete(handle);
      originalClearTimeout(handle);
    };

    const originalSetInterval = window.setInterval.bind(window);
    const originalClearInterval = window.clearInterval.bind(window);
    window.setInterval = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      const handle = originalSetInterval(handler, timeout, ...args);
      intervals.add(handle);
      return handle;
    }) as typeof window.setInterval;
    window.clearInterval = (handle) => {
      intervals.delete(handle);
      originalClearInterval(handle);
    };

    const NativeWorker = window.Worker;
    class TrackedWorker extends NativeWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options);
        activeWorkers.add(this);
        workers.add(this);
      }

      override terminate() {
        if (activeWorkers.has(this)) {
          activeWorkers.delete(this);
          workers.delete(this);
        }
        super.terminate();
      }
    }
    window.Worker = TrackedWorker;

    // eslint-disable-next-line @typescript-eslint/unbound-method -- deliberately detached; every call site supplies the receiver.
    const originalSetPointerCapture = Element.prototype.setPointerCapture;
    const originalReleasePointerCapture =
      // eslint-disable-next-line @typescript-eslint/unbound-method -- deliberately detached; every call site supplies the receiver.
      Element.prototype.releasePointerCapture;
    Element.prototype.setPointerCapture = function trackedSetPointerCapture(
      this: Element,
      pointerId: number,
    ) {
      for (const capture of pointerCaptures) {
        if (capture.element === this && capture.pointerId === pointerId) {
          pointerCaptures.delete(capture);
        }
      }
      pointerCaptures.add({ element: this, pointerId });
      originalSetPointerCapture.call(this, pointerId);
    };
    Element.prototype.releasePointerCapture =
      function trackedReleasePointerCapture(this: Element, pointerId: number) {
        for (const capture of pointerCaptures) {
          if (capture.element === this && capture.pointerId === pointerId) {
            pointerCaptures.delete(capture);
          }
        }
        originalReleasePointerCapture.call(this, pointerId);
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
          animations: document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
          detachedListeners,
          frames: frames.size,
          intervals: intervals.size,
          intersectionObservers,
          listeners: live.size,
          listenersByType,
          mutationObservers,
          pointerCaptures: [...pointerCaptures].filter(
            ({ element, pointerId }) =>
              element.isConnected && element.hasPointerCapture(pointerId),
          ).length,
          resizeObservers,
          timeouts: timeouts.size,
          workers: workers.size,
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
