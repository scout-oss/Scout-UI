import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { expectNoAxeViolations } from "../browser/helpers/accessibility.ts";
import { captureBrowserDiagnostics } from "../browser/helpers/browser-diagnostics.ts";

/**
 * Probes installed before any page script:
 * - every pending requestAnimationFrame handle (must drain to zero at rest);
 * - React commits, via a minimal DevTools hook (pointer/scroll work must not
 *   commit React at all).
 */
async function installProbes(page: Page) {
  await page.addInitScript(() => {
    const scope = window as typeof window & {
      __kFrames?: Set<number>;
      __kCommits?: number;
      __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
    };
    const frames = new Set<number>();
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const handle = request((time) => {
        frames.delete(handle);
        callback(time);
      });
      frames.add(handle);
      return handle;
    };
    window.cancelAnimationFrame = (handle) => {
      frames.delete(handle);
      cancel(handle);
    };
    scope.__kFrames = frames;
    scope.__kCommits = 0;
    scope.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      checkDCE() {},
      inject() {
        return 1;
      },
      isDisabled: false,
      onCommitFiberRoot() {
        scope.__kCommits = (scope.__kCommits ?? 0) + 1;
      },
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
      renderers: new Map(),
      supportsFiber: true,
    };
  });
}

const pendingFrames = (page: Page) =>
  page.evaluate(
    () =>
      (window as typeof window & { __kFrames?: Set<number> }).__kFrames?.size ??
      -1,
  );
const commits = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { __kCommits?: number }).__kCommits ?? -1,
  );
const runningAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running").length,
  );

function only(testInfo: TestInfo, ...projects: string[]) {
  test.skip(!projects.includes(testInfo.project.name));
}

test.describe("Kinetic hero", () => {
  test("headline keeps its accessible name and hides the letter art", async ({
    page,
  }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveAccessibleName("UI THAT STICKS.");
    await expect(page.locator(".sui-k-headline-art")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("pressure, carry and throw never commit React and the loop sleeps", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop", "firefox-desktop", "webkit-desktop");
    await installProbes(page);
    const diagnostics = captureBrowserDiagnostics(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    await page.waitForTimeout(1200);
    const before = await commits(page);

    const letter = page.locator("[data-k-letter]").first();
    const box = await letter.boundingBox();
    if (!box) throw new Error("Hero letter is not rendered.");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let step = 0; step < 30; step += 1) {
      await page.mouse.move(cx + step * 12, cy + Math.sin(step) * 20);
    }
    await expect
      .poll(() =>
        letter.evaluate((node) => node.style.getPropertyValue("--sui-k-press")),
      )
      .not.toBe("");

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 260, cy + 90, { steps: 10 });
    await expect(letter).toHaveAttribute("data-k-grabbed", "true");
    await page.mouse.move(cx + 520, cy - 40, { steps: 3 });
    await page.mouse.up();
    await page.mouse.move(4, 4);

    await expect
      .poll(() => letter.evaluate((node) => node.style.transform), {
        timeout: 6000,
      })
      .toBe("translate3d(0px, 0px, 0px) rotate(0deg)");
    await expect.poll(() => pendingFrames(page), { timeout: 4000 }).toBe(0);
    expect(await commits(page)).toBe(before);
    await diagnostics.expectClean(testInfo);
  });

  test("Test the adhesive is the keyboard path and settles completely", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop");
    await installProbes(page);
    await page.goto("/");
    const button = page.getByRole("button", { name: "Test the adhesive" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() =>
        page
          .locator("[data-k-letter]")
          .nth(2)
          .evaluate((node) => node.style.transform),
      )
      .not.toBe("");
    await expect.poll(() => pendingFrames(page), { timeout: 6000 }).toBe(0);
    expect(await runningAnimations(page)).toBe(0);
  });

  test("touch keeps vertical scrolling on the letters", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-coarse-pointer", "webkit-mobile");
    await page.goto("/");
    const touchAction = await page
      .locator("[data-k-letter]")
      .first()
      .evaluate((node) => getComputedStyle(node).touchAction);
    expect(touchAction).toBe("pan-y");
  });
});

test.describe("Collage trail", () => {
  const liveStickers = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".sui-k-collage-sticker")]
        .filter((node) => node.style.visibility === "visible")
        .map((node) => ({
          src: node.getAttribute("src") ?? "",
          z: Number(node.style.zIndex),
        })),
    );

  test("stamps a dense ribbon, newest on top, hard-cut after one second", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop", "firefox-desktop", "webkit-desktop");
    await installProbes(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    await page.waitForTimeout(800);
    const before = await commits(page);
    await expect(page.locator(".sui-k-collage-layer")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    for (let x = 200; x <= 1000; x += 40) {
      await page.mouse.move(x, 420, { steps: 2 });
    }
    const live = await liveStickers(page);
    expect(live.length).toBeGreaterThanOrEqual(20);
    expect(live.length).toBeLessThanOrEqual(48);
    expect(new Set(live.map((sticker) => sticker.src)).size).toBeGreaterThan(6);
    expect(new Set(live.map((sticker) => sticker.z)).size).toBe(live.length);
    // Primary actions stay above the collage.
    const actionsOnTop = await page.evaluate(() => {
      const button = document.querySelector(".sui-k-hero-actions a");
      if (!button) return false;
      const box = button.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 8, box.top + 8);
      return hit !== null && button.contains(hit);
    });
    expect(actionsOnTop).toBe(true);
    await page.mouse.move(4, 890);
    await expect
      .poll(() => liveStickers(page).then((s) => s.length), {
        intervals: [100],
        timeout: 1600,
      })
      .toBe(0);
    await expect.poll(() => pendingFrames(page), { timeout: 2000 }).toBe(0);
    expect(await runningAnimations(page)).toBe(0);
    expect(await commits(page)).toBe(before);
  });

  test("touch: a tap stamps one sticker and never blocks scrolling", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-coarse-pointer");
    await page.goto("/");
    await page.waitForTimeout(600);
    const lede = page.locator(".sui-k-hero-lede");
    await lede.tap();
    await expect.poll(() => liveStickers(page).then((s) => s.length)).toBe(1);
    await expect
      .poll(() => liveStickers(page).then((s) => s.length), {
        intervals: [100],
        timeout: 1600,
      })
      .toBe(0);
  });

  test("reduced motion never stamps", async ({ page }, testInfo) => {
    only(testInfo, "chromium-reduced-motion");
    await page.goto("/");
    for (let x = 200; x <= 900; x += 40) await page.mouse.move(x, 420);
    expect(await liveStickers(page)).toEqual([]);
    expect(await page.locator(".sui-k-collage-sticker").count()).toBe(0);
  });
});

test.describe("Kinetic surfaces settle and respect preferences", () => {
  for (const route of ["/", "/components", "/stickers"]) {
    test(`${route} reduced motion: no running animations, no hidden content`, async ({
      page,
    }, testInfo) => {
      only(testInfo, "chromium-reduced-motion");
      await page.goto(route);
      await page.waitForTimeout(400);
      expect(await runningAnimations(page)).toBe(0);
      await expect(page.locator("html")).not.toHaveAttribute("data-k-armed");
      if (route === "/") {
        await expect(
          page.getByRole("button", { name: "Test the adhesive" }),
        ).toBeHidden();
      }
      await expectNoAxeViolations(page, testInfo);
    });

    test(`${route} reflows at 320 CSS pixels`, async ({ page }, testInfo) => {
      only(testInfo, "chromium-desktop");
      await page.setViewportSize({ height: 720, width: 320 });
      await page.goto(route);
      const widths = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    });
  }

  test("user 'Reduce effects' disarms reveals and stops kinetic motion", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop");
    await installProbes(page);
    await page.goto("/");
    await page.getByRole("button", { name: /reduce effects/iu }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-sui-docs-effects-effective",
      "reduced",
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-k-armed");
    await expect(
      page.getByRole("button", { name: "Test the adhesive" }),
    ).toBeHidden();
    const letter = page.locator("[data-k-letter]").first();
    const box = await letter.boundingBox();
    if (!box) throw new Error("Hero letter is not rendered.");
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + 60, box.y + 40);
    expect(await letter.evaluate((node) => node.style.transform)).toBe("");
    await page.getByRole("button", { name: /use system effects/iu }).click();
  });

  test("homepage scroll velocity tape coasts, stops and releases frames", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop");
    await installProbes(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    await page.waitForTimeout(800);
    const before = await commits(page);
    for (let index = 0; index < 8; index += 1) {
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(24);
    }
    await expect
      .poll(() =>
        page
          .locator(".sui-k-velocity-track")
          .evaluate((node) => node.style.transform),
      )
      .toContain("translate3d");
    await expect.poll(() => pendingFrames(page), { timeout: 3000 }).toBe(0);
    // Scrolling may lazily mount nearby specimens (one commit each, at most
    // eight); per-frame scroll work would commit dozens of times.
    expect((await commits(page)) - before).toBeLessThanOrEqual(8);
  });
});

test.describe("Sticker desk and drawer", () => {
  test("desk is a labelled image with keyboard Shuffle and Tidy", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop", "webkit-mobile");
    await installProbes(page);
    await page.goto("/stickers");
    const board = page.getByRole("img", { name: /official stickers/iu });
    await expect(board).toBeVisible();
    await expect(board.locator("[data-k-desk-item]").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const shuffle = page
      .getByRole("button", { name: "Shuffle the desk" })
      .first();
    await shuffle.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Stickers shuffled across the desk."),
    ).toBeAttached();
    await page.getByRole("button", { name: "Tidy up" }).first().click();
    await expect(page.getByText("Stickers tidied into a grid.")).toBeAttached();
    await expect.poll(() => pendingFrames(page), { timeout: 6000 }).toBe(0);
  });

  test("inspector follows selection and copies the public import", async ({
    context,
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/stickers");
    // Wonky Star is not the Sticker playground default, so its deep link
    // must carry an encoded configuration.
    const tile = page.getByRole("button", { name: /Wonky Star/u });
    await tile.click();
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    const inspector = page.getByRole("complementary", {
      name: "Inspector: Wonky Star",
    });
    await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
      "Wonky Star",
    );
    await inspector.getByRole("button", { name: "Copy import" }).click();
    await expect(
      inspector.getByRole("button", { name: "Copied" }),
    ).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(
      'import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";',
    );
    await expect(
      inspector.getByRole("link", { name: /Sticker playground/u }),
    ).toHaveAttribute("href", /\/playground\/sticker\?v=1&cfg=/u);
  });
});

test.describe("Specimen sheet", () => {
  test("eight specimens, each with a reference heading and playground link", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop", "chromium-forced-colors");
    await page.goto("/components");
    const specimens = page.locator(".sui-k-specimen");
    await expect(specimens).toHaveCount(8);
    for (const name of [
      "Sticker",
      "StickerButton",
      "StickerBadge",
      "StickerTrail",
      "StickerCursor",
      "StickerPeel",
      "StickerStack",
      "StickerNavbar",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: `${name} playground` }),
      ).toBeVisible();
    }
    await expectNoAxeViolations(page, testInfo);
  });

  test("engines mount only near the viewport", async ({ page }, testInfo) => {
    only(testInfo, "chromium-desktop");
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    await expect(page.locator(".sui-k-specimens .sui-trail")).toHaveCount(0);
    await page.locator("#specimen-sticker-trail").scrollIntoViewIfNeeded();
    await expect(page.locator(".sui-k-specimens .sui-trail")).toHaveCount(1);
  });

  test("StickerButton specimen counts presses with native button semantics", async ({
    page,
  }, testInfo) => {
    only(testInfo, "chromium-desktop", "webkit-mobile");
    await page.goto("/components");
    const press = page.getByRole("button", { name: "Press it" });
    await press.click();
    await press.click();
    await expect(page.locator(".sui-k-press-count")).toHaveText("×2");
  });
});
