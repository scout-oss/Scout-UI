import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  desktopNavbarNav,
  expectNoHorizontalOverflow,
  expectTargetClearsNavbar,
  navbar,
  NAVBAR_COLLAGE_PATH,
  navbarClose,
  NAVBAR_CUSTOM_PATH,
  NAVBAR_CUSTOM_RIBBON_PATH,
  navbarDialog,
  NAVBAR_INVALID_PATH,
  navbarItem,
  NAVBAR_NIGHT_PATH,
  NAVBAR_PATH,
  navbarMenuTrigger,
  navbarOverlay,
  navbarProgress,
  NAVBAR_REDUCED_PATH,
  NAVBAR_SHORT_PATH,
  NAVBAR_STATIC_PATH,
  openNavbarMenu,
  readNavbarProgress,
} from "./helpers/navbar.ts";

test.describe("StickerNavbar semantics and navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NAVBAR_PATH);
  });

  test("renders a named header/nav landmark with anchors and unchanged slots", async ({
    page,
  }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    const header = navbar(page);
    await expect(header).toHaveJSProperty("tagName", "HEADER");
    await expect(header).toHaveAttribute("data-navbar", "true");

    const nav = desktopNavbarNav(page);
    await expect(nav).toHaveJSProperty("tagName", "NAV");
    await expect(nav).toHaveAttribute("aria-label", "Primary navigation");
    if (await nav.isVisible()) {
      await expect(nav).toHaveAccessibleName("Primary navigation");
    }
    await expect(nav.locator("a[data-navbar-item]")).toHaveCount(4);
    await expect(navbarItem(page, "components")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(navbarItem(page, "components")).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(nav.locator('[data-navbar-item="disabled"]')).toHaveCount(0);
    await expect(page.getByTestId("navbar-brand")).toHaveAccessibleName(
      "Scout UI fixture home",
    );
    await expect(page.getByTestId("navbar-switcher")).toHaveText("OSS");
    await expect(page.getByTestId("navbar-action")).toHaveAttribute(
      "href",
      "#fixture-action",
    );
    await diagnostics.expectClean(testInfo);
  });

  test("default links preserve hash navigation and notify exactly once", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await expect(page.getByTestId("navbar-navigate-count")).toHaveText("0");
    await navbarItem(page, "overview").click();
    await expect(page).toHaveURL(/#section-one$/u);
    await expect(page.getByTestId("navbar-navigate-count")).toHaveText("1");
    await expect(page.getByTestId("navbar-last-navigated")).toHaveText(
      "overview",
    );
  });

  test("external links apply safe default browsing-context semantics", async ({
    page,
  }) => {
    const external = navbarItem(page, "external");
    await expect(external).toHaveAttribute("target", "_blank");
    await expect(external).toHaveAttribute("rel", /\bnoopener\b/u);
    await expect(external).toHaveAttribute("rel", /\bnoreferrer\b/u);
  });

  test("Ribbon and Collage layers are decorative and pointer transparent", async ({
    page,
  }) => {
    const ribbon = navbar(page).locator('[data-navbar-ribbon="true"]');
    await expect(ribbon).toHaveJSProperty("tagName", "svg");
    await expect(ribbon).toHaveAttribute("aria-hidden", "true");
    await expect(ribbon).toHaveCSS("pointer-events", "none");

    await page.goto(NAVBAR_COLLAGE_PATH);
    const collage = navbar(page).locator('[data-navbar-collage="true"]');
    await expect(collage).toHaveAttribute("aria-hidden", "true");
    await expect(collage).toHaveCSS("pointer-events", "none");
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.getByTestId("navbar-action").click();
    await expect(page).toHaveURL(/#fixture-action$/u);
    await expect(collage.locator("img:not([alt=''])")).toHaveCount(0);
  });

  test("custom renderers preserve direct/framework anchors, state, classes, and callbacks", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(NAVBAR_CUSTOM_PATH);
    const direct = navbarItem(page, "overview");
    const framework = navbarItem(page, "components");
    await expect(direct).toHaveAttribute("data-custom-link", "direct");
    await expect(direct).toHaveAttribute("class", /sui-/u);
    await expect(framework).toHaveAttribute("data-framework-link", "true");
    await expect(framework).toHaveAttribute("data-custom-link", "framework");
    await expect(framework).toHaveAttribute("aria-current", "page");
    await direct.click();
    await expect(page.getByTestId("navbar-navigate-count")).toHaveText("1");

    await page.setViewportSize({ height: 844, width: 390 });
    await openNavbarMenu(page);
    const mobileFramework = navbarItem(page, "accessibility", "mobile");
    await expect(mobileFramework).toHaveAttribute(
      "data-framework-link",
      "true",
    );
    await mobileFramework.click();
    await expect(navbarDialog(page)).toBeHidden();
    await expect(page.getByTestId("navbar-navigate-count")).toHaveText("2");
    await expect(page.getByTestId("navbar-last-navigated")).toHaveText(
      "accessibility",
    );
  });

  test("invalid renderLink output remains non-fatal and silent in production", async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.goto(NAVBAR_INVALID_PATH);
    await expect(navbar(page)).toBeVisible();
    await expect(page.locator("[data-invalid-render-link]")).toHaveCount(4);
    await expect(
      page.locator('[data-invalid-render-link="button"]'),
    ).toHaveCount(1);
    await expect(page.locator('[data-invalid-render-link="span"]')).toHaveCount(
      3,
    );
    await page.waitForTimeout(250);
    expect(
      warnings.filter((entry) => /renderLink.*anchor/iu.test(entry)),
    ).toEqual([]);
  });

  test("custom Ribbon geometry is retained as a static SVG path", async ({
    page,
  }) => {
    await page.goto(NAVBAR_CUSTOM_RIBBON_PATH);
    await expect(
      navbar(page).locator('[data-navbar-ribbon="true"] path').last(),
    ).toHaveAttribute(
      "d",
      "M -20 68 C 120 8, 280 132, 450 58 S 760 22, 1040 72 S 1320 116, 1500 42",
    );
  });
});

test.describe("StickerNavbar responsive Radix Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(NAVBAR_PATH);
  });

  test("opens a modal sheet with current-page state and trapped forward/backward focus", async ({
    page,
  }, testInfo) => {
    const dialog = await openNavbarMenu(page);
    await expect(dialog).toHaveAttribute("role", "dialog");
    await expect(dialog).toHaveAccessibleName(/navigation/iu);
    await expect(
      dialog.locator('[data-navbar-nav="mobile"]'),
    ).toHaveAccessibleName("Primary navigation");
    await expect(navbarMenuTrigger(page)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(navbarItem(page, "components", "mobile")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const [normalBackground, activeBackground] = await Promise.all([
      navbarItem(page, "overview", "mobile").evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      navbarItem(page, "components", "mobile").evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ]);
    expect(normalBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(activeBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(activeBackground).not.toBe(normalBackground);
    await expect(dialog.locator(":focus")).toHaveCount(1);

    const close = navbarClose(page);
    await close.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);

    const backgroundAction = page.getByTestId("navbar-action");
    const backgroundBox = await backgroundAction.boundingBox();
    expect(backgroundBox).not.toBeNull();
    if (backgroundBox !== null) {
      const point = {
        x: backgroundBox.x + backgroundBox.width / 2,
        y: backgroundBox.y + backgroundBox.height / 2,
      };
      expect(
        await page.evaluate(
          ({ x, y }) =>
            document
              .elementFromPoint(x, y)
              ?.closest('[data-testid="navbar-action"]') === null,
          point,
        ),
      ).toBe(true);
      await page.mouse.click(point.x, point.y);
      await expect(page.getByTestId("navbar-navigate-count")).toHaveText("0");
      await expect(page).not.toHaveURL(/#fixture-action$/u);
    }
    await expectNoAxeViolations(page, testInfo);
  });

  test("Escape, explicit close, and outside interaction close and return focus", async ({
    page,
  }) => {
    const trigger = navbarMenuTrigger(page);
    await openNavbarMenu(page);
    await page.keyboard.press("Escape");
    await expect(navbarDialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();

    await openNavbarMenu(page);
    await navbarClose(page).click();
    await expect(navbarDialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();

    await openNavbarMenu(page);
    const overlayBox = await navbarOverlay(page).boundingBox();
    expect(overlayBox).not.toBeNull();
    if (overlayBox !== null) {
      await page.mouse.click(
        overlayBox.x + 5,
        overlayBox.y + overlayBox.height - 5,
      );
    }
    await expect(navbarDialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("resizing an open mobile Dialog to desktop releases the modal", async ({
    page,
  }) => {
    await openNavbarMenu(page);
    await page.setViewportSize({ height: 900, width: 1280 });
    await expect(navbarDialog(page)).toHaveCount(0);
    await expect(desktopNavbarNav(page)).toBeVisible();
    await expect(navbarMenuTrigger(page)).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => document.body.style.pointerEvents))
      .toBe("");
  });

  test("mobile navigation closes, returns focus, and invokes onNavigate once", async ({
    page,
  }) => {
    const trigger = navbarMenuTrigger(page);
    await openNavbarMenu(page);
    await navbarItem(page, "accessibility", "mobile").click();
    await expect(navbarDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/#section-three$/u);
    await expect(page.getByTestId("navbar-navigate-count")).toHaveText("1");
    await expect(trigger).toBeFocused();
  });
});

test.describe("StickerNavbar responsive, anchor, progress, and accessibility proofs", () => {
  test("desktop, tablet, mobile, 375, 360, and 320 reflow without duplicate tab stops or collisions", async ({
    page,
  }) => {
    await page.goto(NAVBAR_PATH);
    for (const width of [1280, 820, 390, 375, 360, 320]) {
      await page.setViewportSize({ height: 844, width });
      await expectNoHorizontalOverflow(page);
      if (width >= 1024) {
        await expect(desktopNavbarNav(page)).toBeVisible();
        await expect(navbarMenuTrigger(page)).toBeHidden();
        continue;
      }

      await expect(desktopNavbarNav(page)).toBeHidden();
      await expect(navbarMenuTrigger(page)).toBeVisible();
      await expect(page.getByTestId("navbar-action")).toBeVisible();
      const triggerBox = await navbarMenuTrigger(page).boundingBox();
      expect(triggerBox).not.toBeNull();
      if (triggerBox !== null) {
        expect(Math.round(triggerBox.width)).toBeGreaterThanOrEqual(44);
        expect(Math.round(triggerBox.height)).toBeGreaterThanOrEqual(44);
      }
      const [brandBox, actionBox] = await Promise.all([
        page.getByTestId("navbar-brand").boundingBox(),
        page.getByTestId("navbar-action").boundingBox(),
      ]);
      expect(brandBox).not.toBeNull();
      expect(actionBox).not.toBeNull();
      if (brandBox !== null && actionBox !== null && triggerBox !== null) {
        expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(
          actionBox.x + 1,
        );
        expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
          triggerBox.x + 1,
        );
      }
      await openNavbarMenu(page);
      await expect(navbarItem(page, "components", "mobile")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(navbarDialog(page)).toBeHidden();
      await expect
        .poll(() =>
          page.evaluate(() => document.body.hasAttribute("data-scroll-locked")),
        )
        .toBe(false);
    }
  });

  test("200% zoom preserves one-dimensional reflow", async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 640 });
    await page.goto(NAVBAR_PATH);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect(navbarMenuTrigger(page)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("sticky hash targets clear the Navbar on desktop and mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 1280 });
    await page.goto(NAVBAR_PATH);
    const desktopOffset = await page
      .getByTestId("navbar-anchor-section-three")
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).scrollMarginTop),
      );
    const desktopHeaderBox = await navbar(page).boundingBox();
    expect(desktopHeaderBox).not.toBeNull();
    if (desktopHeaderBox !== null) {
      expect(desktopOffset).toBeGreaterThanOrEqual(desktopHeaderBox.height);
    }
    await navbarItem(page, "accessibility").click();
    await expectTargetClearsNavbar(
      page,
      page.getByTestId("navbar-anchor-section-three"),
    );

    await page.setViewportSize({ height: 800, width: 390 });
    await page.goto(NAVBAR_PATH);
    await page.locator(".navbar-fixture").evaluate((element: HTMLElement) => {
      element.style.setProperty("--sui-navbar-sticky-offset", "9rem");
    });
    await expect
      .poll(() =>
        page
          .getByTestId("navbar-anchor-section-three")
          .evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).scrollMarginTop),
          ),
      )
      .toBe(144);
    await openNavbarMenu(page);
    await navbarItem(page, "accessibility", "mobile").click();
    await expectTargetClearsNavbar(
      page,
      page.getByTestId("navbar-anchor-section-three"),
    );
  });

  test("optional progress is hidden from assistive tech and tracks top/middle/bottom", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 1280 });
    await page.goto(NAVBAR_PATH);
    await expect(navbarProgress(page)).toHaveAttribute("aria-hidden", "true");
    await expect(navbarProgress(page)).not.toHaveAttribute(
      "role",
      "progressbar",
    );
    expect(await readNavbarProgress(page)).toBeLessThanOrEqual(0.01);

    await page.evaluate(() => {
      const maximum =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, maximum / 2);
    });
    await expect
      .poll(async () => await readNavbarProgress(page))
      .toBeGreaterThan(0.35);
    expect(await readNavbarProgress(page)).toBeLessThan(0.65);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect
      .poll(async () => await readNavbarProgress(page))
      .toBeGreaterThan(0.99);

    await page.goto(NAVBAR_STATIC_PATH);
    await expect(navbarProgress(page)).toHaveCount(0);
    await expect(navbar(page)).toHaveAttribute(
      "data-navbar-frame-pending",
      "false",
    );
  });

  test("short-page progress remains finite and clamped", async ({ page }) => {
    await page.goto(NAVBAR_SHORT_PATH);
    const value = await readNavbarProgress(page);
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  test("reduced motion keeps navigation semantic and Ribbon immediately revealed", async ({
    page,
  }, testInfo) => {
    await page.goto(NAVBAR_REDUCED_PATH);
    await expect(navbar(page)).toHaveAttribute("data-reduced-motion", "always");
    await expect(navbarItem(page, "components")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const ribbon = navbar(page).locator('[data-navbar-ribbon="true"]');
    if (testInfo.project.name === "chromium-forced-colors") {
      await expect(ribbon).toBeHidden();
    } else {
      await expect(ribbon).toBeVisible();
    }
    await expect(navbar(page)).toHaveAttribute(
      "data-navbar-frame-pending",
      "false",
    );
    await page.setViewportSize({ height: 844, width: 390 });
    await openNavbarMenu(page);
    const mobileItem = navbarItem(page, "components", "mobile");
    await mobileItem.hover();
    await expect
      .poll(() =>
        mobileItem.evaluate((element) => {
          const styles = getComputedStyle(element);
          return {
            animation: styles.animationName,
            transition: styles.transitionDuration,
            translate: styles.translate,
          };
        }),
      )
      .toEqual({ animation: "none", transition: "0s", translate: "none" });
  });

  test("system reduced motion independently suppresses Ribbon and Dialog motion", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-reduced-motion");
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(NAVBAR_PATH);
    await openNavbarMenu(page);
    const styles = await navbarItem(page, "components", "mobile").evaluate(
      (element) => {
        const computed = getComputedStyle(element);
        return {
          animation: computed.animationName,
          transition: computed.transitionDuration,
          translate: computed.translate,
        };
      },
    );
    expect(styles).toEqual({
      animation: "none",
      transition: "0s",
      translate: "none",
    });
    await expect(
      navbar(page).locator(".sui-sticker-navbar-ribbon-reveal"),
    ).toHaveCSS("animation-name", "none");
  });

  test("forced colors preserves Ribbon, Collage, slot, and Dialog boundaries", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-forced-colors");
    for (const path of [NAVBAR_PATH, NAVBAR_COLLAGE_PATH]) {
      await page.setViewportSize({ height: 900, width: 1280 });
      await page.goto(path);
      const root = navbar(page);
      const systemColors = await root.evaluate((element) => {
        const probe = document.createElement("span");
        probe.style.color = "CanvasText";
        probe.style.border = "1px solid CanvasText";
        probe.style.background = "Canvas";
        document.body.append(probe);
        const probeStyles = getComputedStyle(probe);
        const rootStyles = getComputedStyle(element);
        const result = {
          canvas: probeStyles.backgroundColor,
          canvasText: probeStyles.color,
          rootBackground: rootStyles.backgroundColor,
          rootBorder: rootStyles.borderBottomColor,
          rootColor: rootStyles.color,
        };
        probe.remove();
        return result;
      });
      expect(systemColors.rootBackground).toBe(systemColors.canvas);
      expect(systemColors.rootColor).toBe(systemColors.canvasText);
      expect(systemColors.rootBorder).toBe(systemColors.canvasText);
      await expect(root.locator(".sui-sticker-navbar-decoration")).toBeHidden();

      for (const control of [
        page.getByTestId("navbar-brand"),
        page.getByTestId("navbar-switcher"),
        page.getByTestId("navbar-action"),
      ]) {
        await control.focus();
        expect(
          await control.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).outlineWidth),
          ),
        ).toBeGreaterThanOrEqual(3);
      }

      await page.setViewportSize({ height: 844, width: 390 });
      await openNavbarMenu(page);
      await navbarClose(page).focus();
      expect(
        await navbarClose(page).evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).outlineWidth),
        ),
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("server HTML is semantic and hydration is diagnostic-clean", async ({
    page,
    request,
  }, testInfo) => {
    const response = await request.get(NAVBAR_PATH);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toMatch(/<header\b/u);
    expect(html).toMatch(/<nav\b/u);
    expect(html).toContain('href="#section-two"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain("Unavailable preview");

    const diagnostics = captureBrowserDiagnostics(page);
    await page.goto(NAVBAR_PATH);
    await expect(navbar(page)).toBeVisible();
    await page.reload();
    await expect(navbar(page)).toBeVisible();
    await diagnostics.expectClean(testInfo);
  });

  test("representative Ribbon, Collage, active, forced-color, and night surfaces pass axe", async ({
    page,
  }, testInfo) => {
    for (const path of [NAVBAR_PATH, NAVBAR_COLLAGE_PATH, NAVBAR_NIGHT_PATH]) {
      await page.goto(path);
      await expect(navbar(page)).toBeVisible();
      await expectNoAxeViolations(page, testInfo);
    }
  });
});
