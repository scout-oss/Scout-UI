import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  cp,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, expect } from "@playwright/test";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output = path.join(root, ".artifacts/cra-consumer");
const consumer = path.join(output, "consumer");
const report = { builds: {}, runtime: {}, sourceMapWarnings: {} };
await mkdir(output, { recursive: true });
// pnpm keeps orphaned virtual-store entries, so stale packages from an earlier
// graph could survive a reused consumer. Always install from a clean copy.
await rm(consumer, { recursive: true, force: true });
await cp(path.join(root, "tooling/fixtures/cra-consumer"), consumer, {
  recursive: true,
  filter: (file) => !["node_modules", "build"].includes(path.basename(file)),
});

async function run(args, log, env = {}) {
  const chunks = [];
  const code = await new Promise((resolve, reject) => {
    const child = spawn("corepack", ["pnpm", ...args], {
      cwd: consumer,
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => chunks.push(chunk));
    child.once("error", reject);
    child.once("close", resolve);
  });
  const text = Buffer.concat(chunks).toString();
  await writeFile(path.join(output, log), text);
  assert.equal(
    code,
    0,
    `CRA ${args.join(" ")} failed; see ${log}\n${text.slice(-2500)}`,
  );
  return text;
}

let browser;
let server;
try {
  const manifestPath = path.join(consumer, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await mkdir(path.join(consumer, "tarballs"), { recursive: true });
  const tarballs = {};
  for (const slug of ["react", "sticker-trail", "stickers"]) {
    const { version } = JSON.parse(
      await readFile(path.join(root, "packages", slug, "package.json"), "utf8"),
    );
    const name = `scout-ui-${slug}-${version}.tgz`;
    const from = path.join(root, ".artifacts/packed-fixtures/tarballs", name);
    await cp(from, path.join(consumer, "tarballs", name));
    manifest.dependencies[`@scout-ui/${slug}`] = `file:./tarballs/${name}`;
    tarballs[slug] = {
      version,
      sha256: createHash("sha256")
        .update(await readFile(from))
        .digest("hex"),
    };
  }
  report.tarballs = tarballs;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  // braces <=3.0.3 has no patched release; route this graph's only parents
  // through the same private adapter as the root workspace.
  const adapter = path.join(root, "tooling/glob-matcher");
  const link = path.relative(consumer, adapter).split(path.sep).join("/");
  // Keep every template security override. Only the Trail tarball identity and
  // the adapter link path vary; the private CRA fixture has its own lockfile.
  const workspacePath = path.join(consumer, "pnpm-workspace.yaml");
  const workspace = (await readFile(workspacePath, "utf8"))
    .replace(
      /("@scout-ui\/sticker-trail": )"[^"]*"/u,
      `$1"${manifest.dependencies["@scout-ui/sticker-trail"]}"`,
    )
    .replaceAll("link:../../glob-matcher", `link:${link}`);
  assert.ok(workspace.includes(`braces@3.0.3: link:${link}/braces`));
  await writeFile(workspacePath, workspace);
  await run(["install", "--lockfile-only"], "install-lock.log");
  await run(["install", "--frozen-lockfile"], "install-frozen.log");
  const store = path.join(consumer, "node_modules/.pnpm");
  const entries = await readdir(store);
  assert.deepEqual(
    entries.filter((entry) =>
      /^(?:braces@|micromatch@|nth-check@1\.|svgo@1\.|node-forge@|selfsigned@|webpack-dev-(?:middleware|server)@)/u.test(
        entry,
      ),
    ),
    [],
    "vulnerable or removed packages must not be installed",
  );
  report.globAdapter = { micromatch: 0, braces: 0 };
  for (const entry of entries)
    for (const [name, target] of [
      ["micromatch", adapter],
      ["braces", path.join(adapter, "braces")],
    ]) {
      const dependency = path.join(store, entry, "node_modules", name);
      const resolved = await realpath(dependency).catch(() => undefined);
      if (!resolved) continue;
      assert.equal(resolved, await realpath(target), `${entry} -> ${name}`);
      report.globAdapter[name]++;
    }
  assert.ok(report.globAdapter.micromatch > 0 && report.globAdapter.braces > 0);
  const require = createRequire(manifestPath);
  const react = await realpath(require.resolve("react"));
  for (const name of ["@scout-ui/react", "@scout-ui/sticker-trail"]) {
    const entry = await realpath(require.resolve(`${name}/package.json`));
    assert.ok(
      entry.startsWith(consumer + path.sep),
      `${name} is not tarball-isolated`,
    );
    assert.equal(
      await realpath(createRequire(entry).resolve("react")),
      react,
      "duplicate React",
    );
  }
  report.duplicateReact = false;
  for (const [mode, ci] of [
    ["normal", "false"],
    ["ci", "true"],
  ]) {
    const log = await run(["build"], `build-${mode}.log`, { CI: ci });
    report.builds[mode] = "PASS";
    report.sourceMapWarnings[mode] = (
      log.match(/Failed to parse source map/gu) ?? []
    ).length;
    if (process.env.SCOUT_UI_REQUIRE_EMBEDDED_MAPS === "1")
      assert.equal(report.sourceMapWarnings[mode], 0);
  }

  const build = path.join(consumer, "build");
  // Tailwind discovers ./src/**/*.{js,jsx} through fast-glob and the adapter.
  const css = path.join(build, "static/css");
  const styles = await Promise.all(
    (await readdir(css))
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFile(path.join(css, file), "utf8")),
  );
  assert.ok(
    styles.some((text) => text.includes(".p-8{padding:2rem}")),
    "Tailwind content globbing must emit the fixture's utility class",
  );
  report.tailwindContent = "PASS";
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      let file = path.resolve(build, "." + decodeURIComponent(url.pathname));
      assert.ok(file.startsWith(build + path.sep) || file === build);
      if (!path.extname(file)) file = path.join(build, "index.html");
      const types = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
      };
      response.setHeader(
        "Content-Type",
        types[path.extname(file)] ?? "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  report.server = {};
  for (const [name, route] of [
    ["missing", "/static/js/missing.js"],
    ["traversal", "/..%2fpackage.json"],
  ]) {
    report.server[name] = (await fetch(origin + route)).status;
    assert.equal(report.server[name], 404, `${name} must not be served`);
  }
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(origin);
  await page.getByRole("button", { name: "Count 0" }).click();
  await page.getByRole("button", { name: "Count 1" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Count 2" })).toBeVisible();
  await page.getByRole("button", { name: "Selected badge" }).click();
  await expect(
    page.getByRole("button", { name: "Selected badge" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Peel to reveal" }).click();
  await expect(
    page.getByRole("button", { name: "Stick back" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "Second route" }).click();
  await expect(page.getByText("Second route content")).toBeVisible();
  report.runtime.controls = "PASS";
  const poolBefore = await page.locator(".sui-trail-item").count();
  const box = await page.locator(".sui-trail").boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 20, box.y + 90);
  await page.mouse.move(box.x + box.width - 30, box.y + 100, { steps: 40 });
  report.runtime.pool = {
    before: poolBefore,
    after: await page.locator(".sui-trail-item").count(),
  };
  assert.equal(report.runtime.pool.after, poolBefore);
  assert.equal(poolBefore, 24);
  const active = page.locator(".sui-trail-item[data-active=true]");
  assert.ok(
    (await active.count()) > 0,
    "Trail must actually emit, not merely contain idle pool nodes",
  );
  report.runtime.images = await page
    .locator(
      'img[alt="Official wonky star"], img[alt="Direct asset import"], .sui-trail-item[data-active=true]',
    )
    .evaluateAll(async (images) =>
      Promise.all(
        images.map(async (image) => {
          const response = await fetch(image.src);
          const body = await response.text();
          let decoded = false;
          try {
            await image.decode();
            decoded = image.naturalWidth > 0;
          } catch {
            /* report the actual failure */
          }
          return {
            alt: image.alt,
            url: image.src,
            status: response.status,
            contentType: response.headers.get("content-type"),
            bodyPrefix: body.slice(0, 100),
            svg: /^\s*<svg\b/u.test(body),
            decoded,
          };
        }),
      ),
    );
  report.runtime.errors = errors;
  report.runtime.browser = browser.version();
  const screenshots = path.join(output, "output/playwright");
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({
    path: path.join(screenshots, "cra-runtime.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, [], "browser errors");
  assert.ok(
    report.runtime.images.length >= 3,
    "must inspect Sticker, direct asset and emitted Trail artwork",
  );
  for (const image of report.runtime.images) {
    assert.equal(image.status, 200, `asset status: ${image.url}`);
    assert.match(image.contentType, /image\/svg\+xml/u);
    assert.ok(
      image.svg && image.decoded,
      `browser cannot decode ${image.alt || "Trail"}: ${image.url}; ${image.bodyPrefix}`,
    );
  }
  report.result = "PASS";
  console.log(
    "Packed CRA normal/CI builds, image responses/decode and runtime PASS",
  );
} catch (error) {
  report.result = "FAIL";
  report.failure = error.message;
  throw error;
} finally {
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
