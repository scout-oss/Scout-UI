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

async function openPrompt(page: Page, path: string) {
  await page.goto(path);
  const trigger = page.getByRole("button", { name: "Copy AI Prompt" });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function promptText(page: Page) {
  return (
    (await page
      .getByRole("region", { name: "Generated AI implementation prompt" })
      .textContent()) ?? ""
  );
}

async function codeText(page: Page) {
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

test.describe("M15 configuration-aware Copy AI Prompt", () => {
  test("representative prompt remains usable across the browser/device matrix", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    const dialog = await openPrompt(page, "/playground/sticker-trail");
    await expect(dialog).toContainText("Generated locally.");
    await expect(dialog).toContainText("No repository data is sent.");
    await expect(
      page.getByRole("button", { name: "Copy Prompt" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Generated AI implementation prompt",
      }),
    ).toContainText("bounded node");
    await expectNoOverflow(page);
    await expectNoAxeViolations(page, testInfo);
    await diagnostics.expectClean(testInfo);
  });

  test("all eight defaults expose useful detailed prompts and summaries", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    for (const slug of slugs) {
      const dialog = await openPrompt(page, `/playground/${slug}`);
      await expect(
        dialog.getByRole("heading", { name: "Generated prompt" }),
      ).toBeVisible();
      await expect(
        dialog.getByText("Detailed", { exact: true }).last(),
      ).toBeVisible();
      await expect(dialog.locator(".sui-docs-prompt-summary")).toContainText(
        "Component",
      );
      const text = await promptText(page);
      expect(text).toContain("## Objective");
      expect(text).toContain("## Exact selected configuration");
      expect(text).toContain("## Verification and non-regression");
      await page.getByRole("button", { name: "Close AI Prompt" }).click();
    }
  });

  test("prompt context is isolated from config, preview, code, URL, history, and storage", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      const historyWithMetrics = history as History & {
        __promptWrites?: number;
      };
      historyWithMetrics.__promptWrites = 0;
      const replace = history.replaceState.bind(history);
      const push = history.pushState.bind(history);
      history.replaceState = (...args) => {
        historyWithMetrics.__promptWrites =
          (historyWithMetrics.__promptWrites ?? 0) + 1;
        replace(...args);
      };
      history.pushState = (...args) => {
        historyWithMetrics.__promptWrites =
          (historyWithMetrics.__promptWrites ?? 0) + 1;
        push(...args);
      };
    });
    const dialog = await openPrompt(page, "/playground/sticker-button");
    const before = {
      code: await codeText(page),
      dirty: await page
        .locator(".sui-docs-playground-session")
        .getAttribute("data-config-dirty"),
      preview: await page.locator(".sui-docs-preview-stage").innerHTML(),
      url: page.url(),
    };
    await page.evaluate(() => {
      for (const selector of [
        ".sui-docs-preview-stage",
        ".sui-docs-code-output",
        "body > .sui-sticker-navbar",
      ]) {
        const node = document.querySelector(selector);
        if (node) Reflect.set(node, "__m15Stable", selector);
      }
      (history as History & { __promptWrites?: number }).__promptWrites = 0;
    });

    await dialog.getByLabel("Target framework").selectOption("next-app-router");
    await dialog.getByLabel("Target location").fill("Hero section");
    await dialog.getByLabel("Asset strategy").selectOption("local");
    await dialog.getByLabel("Preserve existing layout").uncheck();
    await dialog
      .getByLabel(/Project context/)
      .fill("Keep the existing CTA analytics and typography unchanged.");
    await dialog.getByRole("radio", { name: "Concise" }).check();

    const text = await promptText(page);
    expect(text).toContain("Next.js App Router");
    expect(text).toContain('"Hero section"');
    expect(text).toContain("assets already present");
    expect(text).toContain("Keep the existing CTA analytics");
    expect(text).not.toEqual(before.code);
    expect(await codeText(page)).toBe(before.code);
    expect(await page.locator(".sui-docs-preview-stage").innerHTML()).toBe(
      before.preview,
    );
    await expect(page.locator(".sui-docs-playground-session")).toHaveAttribute(
      "data-config-dirty",
      before.dirty ?? "false",
    );
    expect(page.url()).toBe(before.url);
    expect(
      await page.evaluate(
        () => (history as History & { __promptWrites?: number }).__promptWrites,
      ),
    ).toBe(0);
    expect(
      await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
        stable: [
          ".sui-docs-preview-stage",
          ".sui-docs-code-output",
          "body > .sui-sticker-navbar",
        ].every(
          (selector) =>
            Reflect.get(
              document.querySelector(selector) ?? {},
              "__m15Stable",
            ) === selector,
        ),
      })),
    ).toEqual({ local: [], session: [], stable: true });
    expect(page.url()).not.toContain("Hero");
    expect(page.url()).not.toContain("analytics");
  });

  test("component config, preset, Reset, Back, and Forward synchronize prompt while context stays local", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    const dialog = await openPrompt(page, "/playground/sticker-stack");
    await dialog.getByLabel("Target location").fill("Story rail");
    const initial = await promptText(page);
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await page
      .getByRole("button", { name: "Interactive", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect(page.getByRole("dialog")).toContainText("Story rail");
    const preset = await promptText(page);
    expect(preset).not.toBe(initial);
    expect(preset).toContain("Drag enhancement: enabled");
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await page
      .getByRole("button", { name: "Reset", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect.poll(() => promptText(page)).toBe(initial);
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await page.goBack();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect.poll(() => promptText(page)).toBe(preset);
    await expect(page.getByRole("dialog")).toContainText("Story rail");
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await page.goForward();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect.poll(() => promptText(page)).toBe(initial);
    await expect(page.getByRole("dialog")).toContainText("Story rail");
  });

  test("fresh shared URL restores component config but not prompt context", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    const dialog = await openPrompt(page, "/playground/sticker");
    await dialog.getByLabel("Target framework").selectOption("unknown");
    await dialog.getByLabel(/Project context/).fill("Private handoff note");
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await page
      .getByRole("button", { name: "Loud", exact: true })
      .first()
      .click();
    const shareUrl = page.url();
    expect(shareUrl).toContain("cfg=");
    expect(shareUrl).not.toContain("Private");
    await page.goto(shareUrl);
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    const restored = page.getByRole("dialog");
    await expect(restored.getByLabel("Target framework")).toHaveValue("react");
    await expect(restored.getByLabel(/Project context/)).toHaveValue("");
    await expect(restored.locator(".sui-docs-prompt-summary")).toContainText(
      "Preset · Loud",
    );
  });

  test("component and playground surfaces produce the same prompt", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await openPrompt(page, "/components/sticker-peel");
    const componentPrompt = await promptText(page);
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    await openPrompt(page, "/playground/sticker-peel");
    expect(await promptText(page)).toBe(componentPrompt);
  });

  test("Copy writes the exact visible prompt, restarts one timer, and announces success", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (source: string) => {
            (
              window as typeof window & { __copiedPrompt?: string }
            ).__copiedPrompt = source;
            return Promise.resolve();
          },
        },
      });
    });
    await openPrompt(page, "/playground/sticker-cursor");
    const visible = await promptText(page);
    await page.getByRole("button", { name: "Copy Prompt" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(page.getByRole("status").last()).toContainText(
      "Generated AI prompt copied",
    );
    expect(
      await page.evaluate(
        () =>
          (window as typeof window & { __copiedPrompt?: string })
            .__copiedPrompt,
      ),
    ).toBe(visible);
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Copied" }).click();
    await page.waitForTimeout(1700);
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Prompt" })).toBeVisible(
      {
        timeout: 900,
      },
    );
  });

  test("clipboard failure focuses and selects the exact readonly fallback", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await openPrompt(page, "/playground/sticker-badge");
    const visible = await promptText(page);
    await page.getByRole("button", { name: "Copy Prompt" }).click();
    const fallback = page.getByLabel(
      "Clipboard unavailable. Copy the selected prompt manually.",
    );
    await expect(fallback).toBeFocused();
    await expect(fallback).toHaveAttribute("readonly", "");
    await expect(fallback).toHaveValue(visible);
    expect(
      await fallback.evaluate((element: HTMLTextAreaElement) => ({
        end: element.selectionEnd,
        length: element.value.length,
        start: element.selectionStart,
      })),
    ).toEqual({ end: visible.length, length: visible.length, start: 0 });
  });

  test("prompt Reset restores prompt defaults without resetting the component", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/playground/sticker-button");
    await page
      .getByRole("button", { name: "Editorial link", exact: true })
      .click();
    const codeBefore = await codeText(page);
    const dialog = await openPrompt(page, page.url());
    await dialog.getByLabel("Target framework").selectOption("unknown");
    await dialog.getByLabel("Target location").fill("Marketing hero");
    await dialog.getByLabel(/Project context/).fill("Keep the CTA position.");
    await dialog.getByRole("radio", { name: "Concise" }).check();
    await dialog.getByRole("button", { name: "Reset prompt context" }).click();
    await expect(dialog.getByLabel("Target framework")).toHaveValue("react");
    await expect(dialog.getByLabel("Target location")).toHaveValue("");
    await expect(dialog.getByLabel(/Project context/)).toHaveValue("");
    await expect(dialog.getByRole("radio", { name: "Detailed" })).toBeChecked();
    expect(await codeText(page)).toBe(codeBefore);
    await expect(page.locator(".sui-docs-playground-session")).toHaveAttribute(
      "data-current-preset",
      "link",
    );
  });

  test("Dialog traps focus, closes with Escape, returns focus, and cleans ten portal cycles", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & { __scoutUiPromptMetrics?: object }
      ).__scoutUiPromptMetrics = {
        activeCopyTimers: 0,
        activeEmphasisTimers: 0,
        calculations: 0,
        closedDialogs: 0,
        copiedPrompts: 0,
        openedDialogs: 0,
        renders: 0,
      };
    });
    await page.goto("/playground/sticker");
    const trigger = page.getByRole("button", { name: "Copy AI Prompt" });
    for (let cycle = 0; cycle < 10; cycle += 1) {
      await trigger.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Close AI Prompt" }),
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Copy Prompt" }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.locator(".sui-docs-prompt-overlay").count()).toBe(0);
    }
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiPromptMetrics?: Record<string, number>;
            }
          ).__scoutUiPromptMetrics,
      ),
    ).toMatchObject({
      activeCopyTimers: 0,
      activeEmphasisTimers: 0,
      closedDialogs: 10,
      openedDialogs: 10,
    });
  });

  test("prompt changes use no network, Shiki worker, analytics, or storage", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
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
    const dialog = await openPrompt(page, "/playground/sticker-navbar");
    await expect(page.locator(".sui-docs-code-output")).toHaveAttribute(
      "data-code-highlight",
      "settled",
    );
    const workersBefore = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __scoutUiCodeOutputMetrics?: Record<string, number>;
          }
        ).__scoutUiCodeOutputMetrics?.createdWorkers,
    );
    requests.length = 0;
    await dialog.getByLabel("Target framework").selectOption("unknown");
    await dialog.getByLabel(/Project context/).fill("No network handoff.");
    await dialog.getByRole("radio", { name: "Concise" }).check();
    await page.waitForTimeout(250);
    expect(requests).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __scoutUiCodeOutputMetrics?: Record<string, number>;
            }
          ).__scoutUiCodeOutputMetrics?.createdWorkers,
      ),
    ).toBe(workersBefore);
    expect(
      await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      })),
    ).toEqual({ local: [], session: [] });
  });

  test("rapid component updates keep page identities stable and resources bounded", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & { __scoutUiPromptMetrics?: object }
      ).__scoutUiPromptMetrics = {
        activeCopyTimers: 0,
        activeEmphasisTimers: 0,
        calculations: 0,
        closedDialogs: 0,
        copiedPrompts: 0,
        openedDialogs: 0,
        renders: 0,
      };
      (window as typeof window & { __m15LongTasks?: number }).__m15LongTasks =
        0;
      new PerformanceObserver((entries) => {
        (window as typeof window & { __m15LongTasks?: number }).__m15LongTasks =
          ((window as typeof window & { __m15LongTasks?: number })
            .__m15LongTasks ?? 0) + entries.getEntries().length;
      }).observe({ type: "longtask" });
    });
    await openPrompt(page, "/playground/sticker");
    await page.evaluate(() => {
      for (const selector of [
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-code-output",
        "body > .sui-sticker-navbar",
      ]) {
        const node = document.querySelector(selector);
        if (node) Reflect.set(node, "__m15RapidStable", selector);
      }
      const metrics = (
        window as typeof window & {
          __scoutUiPromptMetrics?: Record<string, number>;
        }
      ).__scoutUiPromptMetrics;
      if (metrics) {
        metrics.calculations = 0;
        metrics.renders = 0;
      }
      (window as typeof window & { __m15LongTasks?: number }).__m15LongTasks =
        0;
    });
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
    const slider = page.getByRole("slider", { name: "Rotation" }).first();
    await slider.evaluate((element) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.bind(input);
      for (let index = 0; index < 25; index += 1) {
        setter?.(String(index - 12));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect(page.getByRole("dialog")).toContainText("Rotation: 12");
    await page.waitForTimeout(950);
    const result = await page.evaluate(() => ({
      longTasks:
        (window as typeof window & { __m15LongTasks?: number })
          .__m15LongTasks ?? 0,
      metrics: (
        window as typeof window & {
          __scoutUiPromptMetrics?: Record<string, number>;
        }
      ).__scoutUiPromptMetrics,
      portals: document.querySelectorAll(".sui-docs-prompt-overlay").length,
      stable: [
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-code-output",
        "body > .sui-sticker-navbar",
      ].every(
        (selector) =>
          Reflect.get(
            document.querySelector(selector) ?? {},
            "__m15RapidStable",
          ) === selector,
      ),
    }));
    expect(result.stable).toBe(true);
    expect(result.portals).toBe(1);
    expect(result.metrics?.calculations).toBeGreaterThan(0);
    expect(result.metrics?.calculations).toBeLessThanOrEqual(25);
    expect(result.metrics?.activeCopyTimers).toBe(0);
    expect(result.metrics?.activeEmphasisTimers).toBe(0);
    expect(result.longTasks).toBe(0);
    await testInfo.attach("prompt-rapid-update.json", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });
  });

  test("preview failure leaves prompt, Code, reference content, and Copy actions available", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator('[data-preview-error="true"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Code" })).toBeVisible();
    await page.getByRole("button", { name: "Copy AI Prompt" }).click();
    await expect(
      page.getByRole("button", { name: "Copy Prompt" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Generated prompt");
    await page.getByRole("button", { name: "Close AI Prompt" }).click();
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

  test("320px, keyboard, focus, overflow, and axe remain sound", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.setViewportSize({ width: 320, height: 720 });
    const dialog = await openPrompt(page, "/playground/sticker-navbar");
    const box = await dialog.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(320);
    expect(box?.height).toBeLessThanOrEqual(720);
    await expect(
      page.getByRole("button", { name: "Copy Prompt" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Copy Prompt" }).focus();
    await expect(
      page.getByRole("button", { name: "Copy Prompt" }),
    ).toBeFocused();
    await expectNoOverflow(page);
    await expectNoAxeViolations(page, testInfo);
  });
});
