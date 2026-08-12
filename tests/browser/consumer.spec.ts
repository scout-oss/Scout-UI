import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "./helpers/browser-diagnostics.ts";
import {
  advanceAnimationFrame,
  followStablePointerPath,
  installDeterministicAnimationClock,
} from "./helpers/deterministic-motion.ts";
import { prepareStableScreenshot } from "./helpers/stable-screenshot.ts";

test("packed Next.js consumer renders and hydrates", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Next.js packed consumer" }),
  ).toBeVisible();
  await expect(page.getByTestId("server-package-values")).toContainText(
    "StickerButton",
  );

  // Replaces the milestone-2 version sentinel with the production API: the
  // React client leaf must resolve, hydrate, and build a real bounded pool.
  await expect(page.getByTestId("client-entry-value")).toHaveText(
    "client trail ready",
  );
  await expect(
    page.getByTestId("client-entry-trail").locator("[data-sui-trail-slot]"),
  ).toHaveCount(6);

  const activation = page.getByRole("button", { name: "Activations: 0" });
  await activation.click();
  await expect(
    page.getByRole("button", { name: "Activations: 1" }),
  ).toBeVisible();

  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("server-compatible root and subpath render", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/server-root");
  await expect(page.getByTestId("server-root-value")).toHaveText(
    "server-compatible primitives",
  );
  await page.goto("/server-only");
  await expect(page.getByTestId("server-only-value")).toHaveText(
    "server-compatible primitives",
  );
  await diagnostics.expectClean(testInfo);
});

test("packed Vite consumer renders", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  const diagnostics = captureBrowserDiagnostics(page);
  const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(viteURL).toBeTruthy();
  await page.goto(viteURL ?? "about:blank");
  await expect(
    page.getByRole("heading", { name: "Vite packed consumer" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("sticker-button");
  await expect(page.getByTestId("packed-sticker-definition")).toHaveText(
    "wonky-star",
  );
  // The broad package's Trail works from both the root and the subpath, using
  // only `@scout-ui/react/styles.css`.
  await expect(
    page.getByTestId("vite-root-trail").locator("[data-sui-trail-slot]"),
  ).toHaveCount(6);
  await expect(
    page.getByTestId("vite-subpath-trail").locator("[data-sui-trail-slot]"),
  ).toHaveCount(6);
  const broadLayerStyles = await page
    .getByTestId("vite-root-trail")
    .locator(".sui-trail-layer")
    .evaluate((element) => {
      const styles = getComputedStyle(element);
      return { pointerEvents: styles.pointerEvents, position: styles.position };
    });
  expect(broadLayerStyles.position).toBe("absolute");
  expect(broadLayerStyles.pointerEvents).toBe("none");
  // Real artwork must load. Inert trail slots are excluded by design: they
  // carry no source until the engine activates them.
  await expect
    .poll(() =>
      page
        .locator("img:not([data-sui-trail-slot])")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  expect(
    await page
      .locator("img[data-sui-trail-slot]")
      .evaluateAll((images) =>
        images.every((image) => !image.hasAttribute("src")),
      ),
  ).toBe(true);
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("standalone Trail consumer works without the broad package", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  const diagnostics = captureBrowserDiagnostics(page);
  const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(viteURL).toBeTruthy();
  await page.goto(
    `${viteURL ?? "about:blank"}/standalone/standalone-trail.html`,
  );

  await expect(
    page.getByRole("heading", { name: "Standalone trail consumer" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("standalone-trail").locator("[data-sui-trail-slot]"),
  ).toHaveCount(8);
  await expect(
    page.getByTestId("standalone-hook-trail").locator("[data-sui-trail-slot]"),
  ).toHaveCount(6);

  // The standalone stylesheet alone must fully style the layer and the slots.
  const styles = await page
    .getByTestId("standalone-trail")
    .locator(".sui-trail-layer")
    .evaluate((element) => {
      const computed = getComputedStyle(element);
      const slot = element.querySelector("[data-sui-trail-slot]");
      const slotStyles = slot === null ? null : getComputedStyle(slot);
      return {
        layerPointerEvents: computed.pointerEvents,
        layerPosition: computed.position,
        slotPosition: slotStyles?.position ?? "",
        slotVisibility: slotStyles?.visibility ?? "",
      };
    });

  expect(styles.layerPosition).toBe("absolute");
  expect(styles.layerPointerEvents).toBe("none");
  expect(styles.slotPosition).toBe("absolute");
  expect(styles.slotVisibility).toBe("hidden");

  // And it still runs: a sweep spawns nodes with no broad package present.
  const box = await page.getByTestId("standalone-trail").boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    for (let step = 0; step <= 8; step += 1) {
      await page.mouse.move(box.x + 10 + step * 20, box.y + box.height / 2);
      await page.waitForTimeout(40);
    }
  }

  expect(
    await page
      .getByTestId("standalone-trail")
      .locator('[data-sui-trail-slot][data-active="true"]')
      .count(),
  ).toBeGreaterThan(0);

  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("project capability is active", async ({ page }, testInfo) => {
  await page.goto("/test-surfaces/pointer");

  const project = testInfo.project.name;
  if (project === "chromium-reduced-motion") {
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
  } else if (project === "chromium-forced-colors") {
    expect(
      await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    ).toBe(true);
  } else if (project === "chromium-coarse-pointer") {
    expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(
      0,
    );
  } else if (project === "webkit-mobile") {
    expect(page.viewportSize()?.width).toBe(390);
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Mobile");
  } else {
    await expect(page.getByTestId("pointer-surface")).toBeVisible();
  }
});

test("deterministic motion helpers control frames and pointer input", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await installDeterministicAnimationClock(page);
  await page.goto("/test-surfaces/pointer");

  await page.evaluate(() => {
    const target = window as typeof window & { __frameTimestamp?: number };
    requestAnimationFrame((timestamp) => {
      target.__frameTimestamp = timestamp;
    });
  });
  await advanceAnimationFrame(page, 24);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __frameTimestamp?: number })
          .__frameTimestamp,
    ),
  ).toBe(24);

  await followStablePointerPath(page);
  await expect(page.getByTestId("pointer-surface")).toBeVisible();
});

test("stable screenshot probe", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/themes");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("screenshot-probe")).toHaveScreenshot(
    "stable-probe.png",
  );
});

test("token canvas renders without accessibility or runtime errors", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/test-surfaces/tokens");
  await expect(page.getByTestId("token-canvas")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Accent palette" }),
  ).toBeVisible();
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("token environment baselines remain functional", async ({
  page,
}, testInfo) => {
  await page.goto("/test-surfaces/tokens");
  const motionProbe = page.getByTestId("motion-probe").locator("span").first();

  if (testInfo.project.name === "chromium-reduced-motion") {
    await expect
      .poll(() =>
        motionProbe.evaluate((element) => ({
          duration: getComputedStyle(element).transitionDuration,
          rotation: getComputedStyle(element).getPropertyValue(
            "--sui-intensity-rotation",
          ),
        })),
      )
      .toEqual({ duration: "0.001s", rotation: "0deg" });
  } else if (testInfo.project.name === "chromium-forced-colors") {
    const button = page.getByRole("button", { name: "Paper focus" });
    await button.focus();
    const styles = await button.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
      };
    });
    expect(styles.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(3);
  }
});

test("plain CSS theming and focus tokens resolve", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/tokens");

  const customTheme = page.getByTestId("consumer-theme");
  expect(
    await customTheme.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(223, 248, 240)");

  for (const name of [
    "Paper focus",
    "Night focus",
    "Ultraviolet focus",
    "Acid focus",
    "Cyan focus",
    "Custom theme focus",
  ]) {
    const button = page.getByRole("button", { name });
    await button.focus();
    await expect(button).toBeFocused();
    const outline = await button.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    );
    expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(3);
  }
});

test("token canvas visual baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/tokens");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("token-canvas")).toHaveScreenshot(
    "token-canvas.png",
  );
});

test("official sticker gallery renders every packed asset", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/test-surfaces/sticker-gallery");
  await expect(page.getByTestId("sticker-gallery")).toBeVisible();
  await expect(page.getByTestId("official-sticker")).toHaveCount(25);
  await expect
    .poll(() =>
      page
        .locator(".gallery-grid img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("official sticker gallery visual baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/sticker-gallery");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("sticker-gallery")).toHaveScreenshot(
    "official-sticker-gallery.png",
  );
});

test("primitive gallery has native semantics and accessible states", async ({
  page,
}, testInfo) => {
  const diagnostics = captureBrowserDiagnostics(page);
  await page.goto("/test-surfaces/primitives");
  const gallery = page.getByTestId("primitive-gallery");
  await expect(gallery).toBeVisible();

  await expect(gallery.locator("span.sui-sticker").first()).toBeVisible();
  await expect(page.getByTestId("interactive-sticker")).toHaveJSProperty(
    "tagName",
    "BUTTON",
  );
  const activationButton = page.getByTestId("interactive-button");
  await page.getByTestId("interactive-sticker").click();
  await expect(activationButton).toContainText("Activations: 1");
  await activationButton.click();
  await expect(activationButton).toContainText("Activations: 2");
  await activationButton.focus();
  await activationButton.press("Enter");
  await expect(activationButton).toContainText("Activations: 3");
  await expect(
    page.getByRole("link", { name: "Anchor action" }),
  ).toHaveAttribute("href", "#badge-heading");
  await expect(
    page.getByRole("button", { name: "Disabled action" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Saving draft" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Saving draft" }),
  ).toHaveAttribute("aria-busy", "true");

  const selectBadge = page.locator(
    ".primitive-interactive-grid button[aria-pressed]",
  );
  await expect(selectBadge).toHaveAttribute("aria-pressed", "false");
  await selectBadge.click();
  await expect(selectBadge).toHaveAttribute("aria-pressed", "true");

  const removeBadge = page.getByRole("button", {
    name: "Remove purple filter",
  });
  await expect(removeBadge.locator("button")).toHaveCount(0);
  await removeBadge.click();
  await expect(page.getByTestId("removed-state")).toHaveText("Badge removed");

  await expectNoAxeViolations(page, testInfo);
  await diagnostics.expectClean(testInfo);
});

test("Sticker source treatment remains intrinsic and format agnostic", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/primitives");

  const official = page.locator(".sui-sticker-source").first();
  await expect(official).toHaveAttribute("data-outline", "none");
  await expect(official.locator("img")).toHaveCount(1);
  expect(
    await official.evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    ),
  ).toBe("none");

  const consumerArtwork = page.locator(".sui-sticker-content-wrapper").first();
  await expect(consumerArtwork).toHaveAttribute("data-outline", "ink");
  await expect(
    page
      .locator('.sui-sticker-content-wrapper[data-outline="cutline"]')
      .first(),
  ).toBeVisible();
});

test("primitive targets and focus treatment meet the interaction contract", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/primitives");

  const interactiveTargets = page.locator(
    "button.sui-sticker, .sui-sticker-button, button.sui-sticker-badge",
  );
  const boxes = await interactiveTargets.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { height: box.height, width: box.width };
    }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }

  for (const control of await page.locator(".primitive-tone-grid a").all()) {
    await control.focus();
    const focus = await control.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        offset: Number.parseFloat(styles.outlineOffset),
        width: Number.parseFloat(styles.outlineWidth),
      };
    });
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.offset).toBeGreaterThanOrEqual(3);
  }
});

test("reduced motion keeps tactile state without translation", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-reduced-motion");
  await page.goto("/test-surfaces/primitives");
  const button = page.getByRole("link", { name: "ultraviolet" });
  const before = await button.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );
  await button.hover();
  const after = await button.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { shadow: styles.boxShadow, translate: styles.translate };
  });

  expect(after.translate).toBe("none");
  expect(after.shadow).not.toBe(before);
});

test("forced colors preserves primitive boundaries and focus", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-forced-colors");
  await page.goto("/test-surfaces/primitives");
  const button = page.getByRole("button", { name: "Activations: 0" });
  await button.focus();
  const styles = await button.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      border: Number.parseFloat(computed.borderWidth),
      outline: Number.parseFloat(computed.outlineWidth),
      shadow: computed.boxShadow,
    };
  });
  expect(styles.border).toBeGreaterThanOrEqual(2);
  expect(styles.outline).toBeGreaterThanOrEqual(3);
  expect(styles.shadow).toBe("none");
});

test("primitive gallery reflows with large text and small viewports", async ({
  page,
}, testInfo) => {
  test.skip(
    !["chromium-desktop", "webkit-mobile"].includes(testInfo.project.name),
  );
  await page.goto("/test-surfaces/primitives");
  await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
  await expect(
    page.getByRole("heading", { name: "StickerButton" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Vite consumer exercises root and subpath primitives", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  const viteURL = process.env.SCOUT_UI_VITE_FIXTURE_URL;
  expect(viteURL).toBeTruthy();
  await page.goto(viteURL ?? "about:blank");
  await expect(
    page.getByRole("heading", { name: "Root primitive imports" }),
  ).toBeVisible();
  const badge = page.getByRole("button", { name: "Select" });
  await badge.click();
  await expect(page.getByRole("button", { name: "Selected" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Subpath button" }),
  ).toBeVisible();
  await expectNoAxeViolations(page, testInfo);
});

test("primitive gallery visual baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.goto("/test-surfaces/primitives");
  await prepareStableScreenshot(page);
  await expect(page.getByTestId("primitive-gallery")).toHaveScreenshot(
    "primitive-gallery.png",
    { maxDiffPixelRatio: 0 },
  );
});
