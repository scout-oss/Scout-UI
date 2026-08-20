import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";

const slugs = [
  "sticker",
  "sticker-badge",
  "sticker-button",
  "sticker-trail",
  "sticker-cursor",
  "sticker-peel",
  "sticker-stack",
  "sticker-navbar",
] as const;

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
}

function desktopOnly(projectName: string) {
  test.skip(projectName !== "chromium-desktop");
}

test.describe("M13 playground registry integration", () => {
  test("representative playground stays healthy across the browser/device matrix", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto("/playground/sticker");
    await expect(
      page.getByRole("heading", { level: 1, name: "Sticker playground" }),
    ).toBeVisible();
    await expect(page.locator('[data-session-slug="sticker"]')).toBeVisible();
    await expectNoOverflow(page);
    await diagnostics.expectClean(testInfo);
  });

  for (const slug of slugs) {
    test(`${slug} full playground and component page share one working definition`, async ({
      page,
    }, testInfo) => {
      desktopOnly(testInfo.project.name);
      const diagnostics = captureBrowserDiagnostics(page);
      await page.goto(`/playground/${slug}`);
      const session = page.locator(`[data-session-slug="${slug}"]`);
      await expect(session).toHaveAttribute("data-session-mode", "playground");
      await expect(
        session.getByRole("heading", { name: /customize/iu }).first(),
      ).toBeVisible();
      await expect(
        session.locator("[data-preview-value]").first(),
      ).toBeVisible();
      await expectNoAxeViolations(page, testInfo);

      await page.goto(`/components/${slug}`);
      await expect(
        page.locator(`[data-session-slug="${slug}"]`),
      ).toHaveAttribute("data-session-mode", "component");
      await expect(
        page.getByRole("link", { name: "Open full playground" }),
      ).toHaveAttribute("href", new RegExp(`/playground/${slug}`, "u"));
      await expect(
        page.getByRole("heading", { name: "Install", exact: true }),
      ).toBeVisible();
      await diagnostics.expectClean(testInfo);
    });
  }

  test("control edits update preview, dirty state, preset recognition and Reset", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/playground/sticker");
    const session = page.locator('[data-session-slug="sticker"]');
    const before = await session
      .locator("[data-preview-value]")
      .getAttribute("data-preview-value");
    await page.getByRole("radio", { name: "XL" }).first().check();
    await expect(session).toHaveAttribute("data-config-dirty", "true");
    await expect(session).toHaveAttribute("data-current-preset", "custom");
    await expect(session.locator("[data-preview-value]")).not.toHaveAttribute(
      "data-preview-value",
      before ?? "",
    );
    await page
      .getByRole("button", { name: "Reset", exact: true })
      .first()
      .click();
    await expect(session).toHaveAttribute("data-config-dirty", "false");
    await expect(page).toHaveURL(/\/playground\/sticker$/u);
  });

  test("presets create durable history while rapid live edits coalesce replaceState", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __scoutUiPlaygroundPreviewCommits?: number;
      };
      scope.__scoutUiPlaygroundPreviewCommits = 0;
    });
    await page.goto("/playground/sticker");
    await page.evaluate(() => {
      const historyWithCount = history as History & {
        __replaceWrites?: number;
      };
      historyWithCount.__replaceWrites = 0;
      const original = history.replaceState.bind(history);
      history.replaceState = (...args) => {
        historyWithCount.__replaceWrites =
          (historyWithCount.__replaceWrites ?? 0) + 1;
        original(...args);
      };
      (
        window as typeof window & {
          __scoutUiPlaygroundMetrics?: {
            layoutShift: number;
            longTasks: number;
          };
          __scoutUiPlaygroundPreviewCommits?: number;
        }
      ).__scoutUiPlaygroundPreviewCommits = 0;
      const scope = window as typeof window & {
        __scoutUiPlaygroundMetrics?: {
          layoutShift: number;
          longTasks: number;
        };
      };
      const metrics = { layoutShift: 0, longTasks: 0 };
      scope.__scoutUiPlaygroundMetrics = metrics;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!shift.hadRecentInput) metrics.layoutShift += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift" });
      new PerformanceObserver((list) => {
        metrics.longTasks += list.getEntries().length;
      }).observe({ type: "longtask" });
    });
    const slider = page.getByRole("slider", { name: "Rotation" }).first();
    await slider.evaluate((element) => {
      const input = element as HTMLInputElement;
      // React's value tracker requires the native setter before the input event.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      for (let value = -10; value < 20; value += 1) {
        setter?.call(input, String(Math.min(12, value)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await page.waitForTimeout(350);
    await expect(page.locator('[data-session-slug="sticker"]')).toHaveAttribute(
      "data-current-preset",
      "custom",
    );
    const [replaceWrites, previewCommits, layoutShift, longTasks] =
      await page.evaluate(
        () =>
          [
            (history as History & { __replaceWrites?: number })
              .__replaceWrites ?? 0,
            (
              window as typeof window & {
                __scoutUiPlaygroundPreviewCommits?: number;
              }
            ).__scoutUiPlaygroundPreviewCommits ?? 0,
            (
              window as typeof window & {
                __scoutUiPlaygroundMetrics?: { layoutShift: number };
              }
            ).__scoutUiPlaygroundMetrics?.layoutShift ?? 0,
            (
              window as typeof window & {
                __scoutUiPlaygroundMetrics?: { longTasks: number };
              }
            ).__scoutUiPlaygroundMetrics?.longTasks ?? 0,
          ] as const,
      );
    expect(replaceWrites).toBeLessThanOrEqual(2);
    expect(previewCommits).toBeGreaterThan(0);
    expect(previewCommits).toBeLessThanOrEqual(30);
    expect(layoutShift).toBeLessThanOrEqual(0.01);
    expect(longTasks).toBe(0);
    await testInfo.attach("playground-input-burst.json", {
      body: JSON.stringify(
        {
          inputs: 30,
          layoutShift,
          longTasks,
          previewCommits,
          replaceStateWrites: replaceWrites,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });

    await page
      .getByRole("button", { name: "Calm", exact: true })
      .first()
      .click();
    await expect(page.locator('[data-session-slug="sticker"]')).toHaveAttribute(
      "data-current-preset",
      "calm",
    );
    await page.goBack();
    await expect(page.locator('[data-session-slug="sticker"]')).toHaveAttribute(
      "data-current-preset",
      "custom",
    );
    await page.goForward();
    await expect(page.locator('[data-session-slug="sticker"]')).toHaveAttribute(
      "data-current-preset",
      "calm",
    );
  });

  test("dependent fields disappear semantically and move focus predictably", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/playground/sticker-button");
    await page.getByRole("radio", { name: "Link" }).first().check();
    await page.waitForTimeout(300);
    const linkUrl = page.url();
    await page
      .getByRole("button", { name: "Reset", exact: true })
      .first()
      .click();
    const loading = page.getByRole("checkbox", { name: "Loading" }).first();
    await loading.focus();
    await expect(loading).toBeFocused();
    await page.evaluate((url) => {
      history.pushState({}, "", url);
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    }, linkUrl);
    await expect(page.getByRole("checkbox", { name: "Loading" })).toHaveCount(
      0,
    );
    const controllingField = page
      .getByRole("radio", { name: "Button" })
      .first();
    const [activeId, controllingId] = await Promise.all([
      page.evaluate(() => (document.activeElement as HTMLElement | null)?.id),
      controllingField.getAttribute("id"),
    ]);
    expect(activeId).toBe(controllingId);
  });

  test("mobile Customize sheet traps focus, closes with Escape and returns focus", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/playground/sticker-button");
    const trigger = page.getByRole("button", { name: /customize/iu }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Customize StickerButton",
    });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect(bounds?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(844);
    expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
    await expect(
      dialog.getByRole("button", { name: "Close customization controls" }),
    ).toBeFocused();
    await expectNoAxeViolations(page, testInfo);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("320px sheet fits, keeps actions reachable, and creates no body overflow", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/playground/sticker");
    await page
      .getByRole("button", { name: /customize/iu })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Customize Sticker" });
    await expect(
      dialog.getByRole("button", { name: "Share", exact: true }),
    ).toBeAttached();
    await expect(
      dialog.getByRole("button", { name: "Close customization controls" }),
    ).toBeVisible();
    await expectNoOverflow(page);
  });

  test("Share copies current canonical state and restores it in a fresh page", async ({
    browser,
    context,
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/playground/sticker-stack");
    await page
      .getByRole("button", { name: "Interactive", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Share", exact: true })
      .first()
      .click();
    await expect(
      page.locator('[data-share-status="copied"]').first(),
    ).toContainText("Share link copied");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("/playground/sticker-stack?v=1&cfg=");
    const freshContext = await browser.newContext();
    const fresh = await freshContext.newPage();
    await fresh.goto(copied);
    await expect(
      fresh.locator('[data-session-slug="sticker-stack"]'),
    ).toHaveAttribute("data-current-preset", "interactive");
    await expect(
      fresh.getByRole("checkbox", { name: "Drag enhancement" }).first(),
    ).toBeChecked();
    await expect(fresh.locator("[data-preview-value='spark']")).toBeVisible();
    await freshContext.close();
  });

  test("Share provides a visible manual-copy fallback", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await page.goto("/playground/sticker-peel");
    await page
      .getByRole("button", { name: "Revealed", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Share", exact: true })
      .first()
      .click();
    await expect(
      page.locator('[data-share-status="manual"]').first(),
    ).toContainText("Clipboard unavailable");
    await expect(page.getByLabel("Share URL").first()).toHaveValue(
      /\/playground\/sticker-peel\?v=1&cfg=/u,
    );
  });

  test("invalid, future and oversized links recover to working defaults with notices", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    const cases = [
      ["/playground/sticker?v=1&cfg=%%%", "invalid"],
      ["/playground/sticker?v=2&cfg=x", "future-version"],
      [`/playground/sticker?v=1&cfg=${"a".repeat(3073)}`, "oversized"],
    ] as const;
    for (const [url, kind] of cases) {
      await page.goto(url);
      await expect(page.locator(`[data-notice-kind="${kind}"]`)).toBeVisible();
      await expect(
        page.locator('[data-session-slug="sticker"]'),
      ).toHaveAttribute("data-config-dirty", "false");
      await page
        .getByRole("button", { name: "Dismiss configuration notice" })
        .click();
      await expect(page.locator("[data-notice-kind]")).toHaveCount(0);
    }
  });

  test("25 control updates preserve shell, session, preview and reference nodes", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/components/sticker");
    await page.evaluate(() => {
      for (const selector of [
        ".sui-sticker-navbar",
        ".sui-docs-playground-session",
        ".sui-docs-preview-stage",
        ".sui-docs-reading-column",
      ]) {
        const node = document.querySelector(selector);
        if (node) Reflect.set(node, "__stable", selector);
      }
    });
    const slider = page.getByRole("slider", { name: "Rotation" }).first();
    for (let index = 0; index < 25; index += 1) {
      await slider.fill(String((index % 25) - 12));
    }
    await expect
      .poll(() =>
        page.evaluate(() =>
          [
            ".sui-sticker-navbar",
            ".sui-docs-playground-session",
            ".sui-docs-preview-stage",
            ".sui-docs-reading-column",
          ].every(
            (selector) =>
              Reflect.get(
                document.querySelector(selector) ?? {},
                "__stable",
              ) === selector,
          ),
        ),
      )
      .toBe(true);
  });

  test("preview failure preserves controls and reference content, then retries", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/test-surfaces/preview-error");
    await expect(page.locator('[data-preview-error="true"]')).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Customize Sticker/u }).first(),
    ).toBeVisible();
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
    await page.getByRole("button", { name: "Retry preview" }).click();
    await expect(
      page.locator('[data-preview-value^="sunny-smile"]'),
    ).toBeVisible();
  });

  test("repeated mobile sheet cycles leave no Dialog portals", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/playground/sticker-navbar");
    const trigger = page.getByRole("button", { name: /customize/iu }).first();
    for (let cycle = 0; cycle < 10; cycle += 1) {
      await trigger.click();
      await page
        .getByRole("button", { name: "Close customization controls" })
        .click();
    }
    await expect(
      page.getByRole("dialog", { name: "Customize StickerNavbar" }),
    ).toHaveCount(0);
    expect(await page.locator("[data-radix-portal]").count()).toBe(0);
  });

  test("client transition removes the session popstate listener and pending URL timer", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      (
        window as typeof window & {
          __scoutUiPlaygroundPopstateListeners?: number;
        }
      ).__scoutUiPlaygroundPopstateListeners = 0;
    });
    await page.goto("/playground/sticker");
    const before = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __scoutUiPlaygroundPopstateListeners?: number;
          }
        ).__scoutUiPlaygroundPopstateListeners ?? 0,
    );
    expect(before).toBeGreaterThan(0);
    await page.evaluate(() => {
      const original = history.replaceState.bind(history);
      const historyWithCount = history as History & {
        __latePlaygroundWrites?: number;
        __trackLatePlaygroundWrites?: boolean;
      };
      historyWithCount.__latePlaygroundWrites = 0;
      historyWithCount.__trackLatePlaygroundWrites = false;
      history.replaceState = (...args) => {
        if (
          historyWithCount.__trackLatePlaygroundWrites === true &&
          String(args[2] ?? "").includes("/playground/sticker")
        )
          historyWithCount.__latePlaygroundWrites =
            (historyWithCount.__latePlaygroundWrites ?? 0) + 1;
        original(...args);
      };
    });
    await page.getByRole("slider", { name: "Rotation" }).first().fill("9");
    await page
      .getByRole("link", { name: "Guides", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/guides$/u);
    await page.evaluate(() => {
      const historyWithCount = history as History & {
        __latePlaygroundWrites?: number;
        __trackLatePlaygroundWrites?: boolean;
      };
      historyWithCount.__latePlaygroundWrites = 0;
      historyWithCount.__trackLatePlaygroundWrites = true;
    });
    await page.waitForTimeout(350);
    const after = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __scoutUiPlaygroundPopstateListeners?: number;
          }
        ).__scoutUiPlaygroundPopstateListeners ?? 0,
    );
    const pendingWrites = await page.evaluate(
      () =>
        (history as History & { __latePlaygroundWrites?: number })
          .__latePlaygroundWrites ?? 0,
    );
    expect(after).toBe(before - 1);
    expect(pendingWrites).toBe(0);
    await testInfo.attach("playground-resource-cleanup.json", {
      body: JSON.stringify(
        {
          pendingUrlTimerWritesAfterUnmount: pendingWrites,
          popstateListenersAfter: after,
          popstateListenersBefore: before,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  });

  test("OS reduced motion, forced colors, and 200 percent reflow preserve controls", async ({
    page,
  }, testInfo) => {
    if (
      !new Set([
        "chromium-reduced-motion",
        "chromium-forced-colors",
        "chromium-desktop",
      ]).has(testInfo.project.name)
    )
      test.skip();
    if (testInfo.project.name === "chromium-desktop")
      await page.setViewportSize({ width: 640, height: 500 });
    await page.goto("/playground/sticker-trail");
    await expect(
      page.getByRole("heading", { name: "StickerTrail playground" }),
    ).toBeVisible();
    const customize = page.getByRole("button", { name: /customize/iu }).first();
    if (await customize.isVisible()) await customize.click();
    await expect(
      page.getByRole("button", { name: "Share", exact: true }).first(),
    ).toBeAttached();
    await expectNoOverflow(page);
    await expectNoAxeViolations(page, testInfo);
  });
});
