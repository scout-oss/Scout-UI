import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";

const slugs = [
  "sticker",
  "sticker-button",
  "sticker-badge",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const;

function desktopOnly(projectName: string) {
  test.skip(projectName !== "chromium-desktop");
}

async function codeSource(page: Page) {
  return (
    (await page.locator(".sui-docs-code-output pre code").textContent()) ?? ""
  );
}

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
}

test.describe("M14 deterministic Copy Code", () => {
  test("representative Code surface stays healthy across the browser/device matrix", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto("/playground/sticker");
    await expect(
      page.getByRole("heading", { name: "Generated code" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible();
    await expect(page.locator(".sui-docs-code-output pre code")).toContainText(
      "StickerExample",
    );
    await expectNoOverflow(page);
    await diagnostics.expectClean(testInfo);
  });

  test("all eight defaults are visible and settle to highlighted TSX", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    for (const slug of slugs) {
      await page.goto(`/playground/${slug}`);
      const output = page.locator(".sui-docs-code-output");
      await expect(output).toBeVisible();
      await output.scrollIntoViewIfNeeded();
      await expect(output.locator("pre code")).toContainText(
        "export default function",
      );
      await expect(output).toHaveAttribute("data-code-highlight", "settled");
      await expect(output.locator("pre code")).toContainText("@scout-ui/");
    }
  });

  test("all eight definitions update source from their shared preset state", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    for (const slug of slugs) {
      await page.goto(`/playground/${slug}`);
      const output = page.locator(".sui-docs-code-output");
      const before = await codeSource(page);
      await page.locator(".sui-docs-presets button").nth(1).click();
      await expect
        .poll(() => codeSource(page), { message: `${slug} source changes` })
        .not.toBe(before);
      await expect(output).toHaveAttribute("data-code-highlight", "plain");
      await output.scrollIntoViewIfNeeded();
      await expect(output).toHaveAttribute("data-code-highlight", "settled");
    }
  });

  test("the Shiki worker stays lazy on ordinary routes and offscreen output", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & {
          __scoutUiCodeOutputMetrics?: Record<string, number>;
        }
      ).__scoutUiCodeOutputMetrics = {
        activeWorkers: 0,
        completedHighlights: 0,
        createdWorkers: 0,
        discardedHighlights: 0,
        generatedSourceCalculations: 0,
        highlightRequests: 0,
        outputRenders: 0,
        pendingCopyTimers: 0,
        pendingHighlightTimers: 0,
        terminatedWorkers: 0,
      };
    });
    await page.goto("/guides");
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiCodeOutputMetrics?: Record<string, number>;
            }
          ).__scoutUiCodeOutputMetrics?.createdWorkers,
      ),
    ).toBe(0);
    await page.goto("/components/sticker");
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "plain",
    );
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiCodeOutputMetrics?: Record<string, number>;
            }
          ).__scoutUiCodeOutputMetrics?.createdWorkers,
      ),
    ).toBe(0);
    await page.locator(".sui-docs-code-output").scrollIntoViewIfNeeded();
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "settled",
    );
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiCodeOutputMetrics?: Record<string, number>;
            }
          ).__scoutUiCodeOutputMetrics?.createdWorkers,
      ),
    ).toBe(1);
  });

  test("plain source is immediately usable without a worker response", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      class NeverVisibleObserver {
        disconnect() {}
        observe() {}
        takeRecords() {
          return [];
        }
        unobserve() {}
      }
      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: NeverVisibleObserver,
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await page.goto("/playground/sticker");
    const output = page.locator(".sui-docs-code-output");
    await expect(output).toHaveAttribute("data-code-highlight", "plain");
    await expect(output.locator("pre code")).toContainText("StickerExample");
    await expect(output.getByText("Plain TSX ready")).toBeVisible();
    await page.getByRole("button", { name: "Copy Code" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  });

  test("Copy writes the exact current visible source and resets one success state", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      const scope = window as typeof window & { __copiedCode?: string };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (source: string) => {
            scope.__copiedCode = source;
            return Promise.resolve();
          },
        },
      });
    });
    await page.goto("/playground/sticker-button");
    await page
      .getByRole("textbox", { name: "Label" })
      .first()
      .fill("Ship this code");
    const visibleSource = await codeSource(page);
    await page.getByRole("button", { name: "Copy Code" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(page.getByRole("status").last()).toContainText(
      "Generated code copied",
    );
    expect(
      await page.evaluate(
        () =>
          (window as typeof window & { __copiedCode?: string }).__copiedCode,
      ),
    ).toBe(visibleSource);
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Copied" }).click();
    await page.waitForTimeout(1700);
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible({
      timeout: 900,
    });
  });

  test("clipboard failure focuses and selects a readonly manual fallback", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await page.goto("/playground/sticker-badge");
    await page.getByRole("button", { name: "Copy Code" }).click();
    const fallback = page.getByLabel("Copy the selected code manually.");
    await expect(fallback).toBeFocused();
    await expect(fallback).toHaveAttribute("readonly", "");
    expect(
      await fallback.evaluate((element: HTMLTextAreaElement) => ({
        end: element.selectionEnd,
        length: element.value.length,
        start: element.selectionStart,
      })),
    ).toEqual({
      end: await fallback.inputValue().then((value) => value.length),
      length: await fallback.inputValue().then((value) => value.length),
      start: 0,
    });
  });

  test("control, preset, Reset, Back, and Forward share one immediate source", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/playground/sticker-stack");
    const initial = await codeSource(page);
    await page
      .getByRole("button", { name: "Interactive", exact: true })
      .first()
      .click();
    await expect(page.locator(".sui-docs-code-output pre code")).toContainText(
      "keyboard",
    );
    const preset = await codeSource(page);
    expect(preset).not.toBe(initial);
    await page
      .getByRole("button", { name: "Reset", exact: true })
      .first()
      .click();
    await expect.poll(() => codeSource(page)).toBe(initial);
    await page.goBack();
    await expect.poll(() => codeSource(page)).toBe(preset);
    await page.goForward();
    await expect.poll(() => codeSource(page)).toBe(initial);
  });

  test("component page and playground produce byte-identical source", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/components/sticker-peel");
    const componentSource = await codeSource(page);
    await page.goto("/playground/sticker-peel");
    expect(await codeSource(page)).toBe(componentSource);
  });

  test("Copy changes no config, URL, preview, session, reference, or code-panel identity", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await page.goto("/components/sticker");
    const beforeUrl = page.url();
    await page.evaluate(() => {
      for (const selector of [
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-reading-column",
        ".sui-docs-code-output",
      ]) {
        const node = document.querySelector(selector);
        if (node) Reflect.set(node, "__m14Stable", selector);
      }
    });
    await page.getByRole("button", { name: "Copy Code" }).click();
    await expect(page.locator('[data-session-slug="sticker"]')).toHaveAttribute(
      "data-config-dirty",
      "false",
    );
    expect(page.url()).toBe(beforeUrl);
    expect(
      await page.evaluate(() =>
        [
          ".sui-docs-playground-session",
          ".sui-docs-preview-stage",
          ".sui-docs-reading-column",
          ".sui-docs-code-output",
        ].every(
          (selector) =>
            Reflect.get(
              document.querySelector(selector) ?? {},
              "__m14Stable",
            ) === selector,
        ),
      ),
    ).toBe(true);
  });

  test("rapid updates coalesce highlighting without remounting the code panel", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & { __scoutUiCodeOutputMetrics?: object }
      ).__scoutUiCodeOutputMetrics = {
        activeWorkers: 0,
        completedHighlights: 0,
        createdWorkers: 0,
        discardedHighlights: 0,
        generatedSourceCalculations: 0,
        highlightRequests: 0,
        outputRenders: 0,
        pendingCopyTimers: 0,
        pendingHighlightTimers: 0,
        terminatedWorkers: 0,
      };
      (window as typeof window & { __m14LongTasks?: number }).__m14LongTasks =
        0;
      new PerformanceObserver((entries) => {
        (window as typeof window & { __m14LongTasks?: number }).__m14LongTasks =
          ((window as typeof window & { __m14LongTasks?: number })
            .__m14LongTasks ?? 0) + entries.getEntries().length;
      }).observe({ type: "longtask" });
    });
    await page.goto("/playground/sticker");
    await page.locator(".sui-docs-code-output").scrollIntoViewIfNeeded();
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "settled",
    );
    await page.evaluate(() => {
      for (const selector of [
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-code-output",
        "body > .sui-sticker-navbar",
      ]) {
        const node = document.querySelector(selector);
        if (node) Reflect.set(node, "__m14Stable", selector);
      }
      const metrics = (
        window as typeof window & {
          __scoutUiCodeOutputMetrics?: Record<string, number>;
          __scoutUiPlaygroundPreviewCommits?: number;
        }
      ).__scoutUiCodeOutputMetrics;
      if (metrics) {
        metrics.completedHighlights = 0;
        metrics.discardedHighlights = 0;
        metrics.generatedSourceCalculations = 0;
        metrics.highlightRequests = 0;
        metrics.outputRenders = 0;
      }
      (window as typeof window & { __m14LongTasks?: number }).__m14LongTasks =
        0;
      (
        window as typeof window & {
          __scoutUiPlaygroundPreviewCommits?: number;
        }
      ).__scoutUiPlaygroundPreviewCommits = 0;
      const trackedHistory = history as History & { __m14Writes?: number };
      trackedHistory.__m14Writes = 0;
      const original = history.replaceState.bind(history);
      history.replaceState = (...args) => {
        trackedHistory.__m14Writes = (trackedHistory.__m14Writes ?? 0) + 1;
        original(...args);
      };
    });
    const slider = page.getByRole("slider", { name: "Rotation" }).first();
    await slider.evaluate((element) => {
      const input = element as HTMLInputElement;
      // React's value tracker requires the native setter before each input.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      for (let index = 0; index < 25; index += 1) {
        setter?.call(input, String(index - 12));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "settled",
    );
    const result = await page.evaluate(() => ({
      longTasks:
        (window as typeof window & { __m14LongTasks?: number })
          .__m14LongTasks ?? 0,
      metrics: (
        window as typeof window & {
          __scoutUiCodeOutputMetrics?: Record<string, number>;
        }
      ).__scoutUiCodeOutputMetrics,
      previewCommits:
        (
          window as typeof window & {
            __scoutUiPlaygroundPreviewCommits?: number;
          }
        ).__scoutUiPlaygroundPreviewCommits ?? 0,
      replaceStateWrites:
        (history as History & { __m14Writes?: number }).__m14Writes ?? 0,
      stable: [
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-code-output",
        "body > .sui-sticker-navbar",
      ].every(
        (selector) =>
          Reflect.get(document.querySelector(selector) ?? {}, "__m14Stable") ===
          selector,
      ),
    }));
    expect(result.stable).toBe(true);
    expect(result.metrics?.createdWorkers).toBe(1);
    expect(result.metrics?.highlightRequests).toBe(1);
    expect(result.metrics?.completedHighlights).toBe(1);
    expect(result.metrics?.pendingHighlightTimers).toBe(0);
    expect(result.metrics?.pendingCopyTimers).toBe(0);
    expect(result.metrics?.generatedSourceCalculations).toBe(25);
    expect(result.metrics?.outputRenders).toBeLessThanOrEqual(60);
    expect(result.longTasks).toBe(0);
    expect(result.previewCommits).toBeGreaterThan(0);
    expect(result.previewCommits).toBeLessThanOrEqual(25);
    expect(result.replaceStateWrites).toBeLessThanOrEqual(2);
    await expect(page.locator(".sui-docs-code-output pre code")).toContainText(
      "rotation={12}",
    );
    await testInfo.attach("copy-code-rapid-update.json", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });
  });

  test("worker lifecycle is balanced across repeated route mount cycles", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & { __scoutUiCodeOutputMetrics?: object }
      ).__scoutUiCodeOutputMetrics = {
        activeWorkers: 0,
        completedHighlights: 0,
        createdWorkers: 0,
        discardedHighlights: 0,
        generatedSourceCalculations: 0,
        highlightRequests: 0,
        outputRenders: 0,
        pendingCopyTimers: 0,
        pendingHighlightTimers: 0,
        terminatedWorkers: 0,
      };
    });
    await page.goto("/playground/sticker");
    for (let cycle = 0; cycle < 10; cycle += 1) {
      await page.locator(".sui-docs-code-output").scrollIntoViewIfNeeded();
      await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
        "data-code-highlight",
        "settled",
      );
      await page
        .getByRole("navigation", { name: "Scout UI documentation" })
        .getByRole("link", { name: "Guides" })
        .click();
      await expect(page).toHaveURL(/\/guides$/);
      if (cycle < 9) {
        await page
          .getByRole("navigation", { name: "Footer navigation" })
          .getByRole("link", { name: "Playground" })
          .click();
        await page.locator('a[href="/playground/sticker"]').click();
      }
    }
    const metrics = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __scoutUiCodeOutputMetrics?: Record<string, number>;
          }
        ).__scoutUiCodeOutputMetrics,
    );
    expect(metrics?.createdWorkers).toBe(10);
    expect(metrics?.terminatedWorkers).toBe(10);
    expect(metrics?.activeWorkers).toBe(0);
    expect(metrics?.pendingCopyTimers).toBe(0);
    expect(metrics?.pendingHighlightTimers).toBe(0);
  });

  test("preview failure preserves generated source, Copy, and reference content", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator('[data-preview-error="true"]')).toBeVisible();
    await expect(page.locator(".sui-docs-code-output pre code")).toContainText(
      "StickerExample",
    );
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible();
    for (const heading of [
      "Install",
      "API",
      "Accessibility",
      "Performance",
      "Source",
    ]) {
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
  });

  test("code semantics, keyboard Copy, local overflow, and axe remain sound", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/playground/sticker-navbar");
    await expect(page.locator(".sui-docs-code-output pre code")).toBeVisible();
    await page.getByRole("button", { name: "Copy Code" }).focus();
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeFocused();
    await expectNoOverflow(page);
    await expectNoAxeViolations(page, testInfo);
  });
});
