import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output = path.join(root, ".artifacts/packed-artwork");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = {};
function stopServer(child) {
  if (process.platform === "win32") child.kill("SIGTERM");
  else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}
try {
  for (const kind of ["next", "vite"]) {
    const socket = createServer();
    await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const args =
      kind === "next"
        ? [
            "pnpm",
            "fixture:start",
            "--hostname",
            "127.0.0.1",
            "--port",
            String(port),
          ]
        : [
            "pnpm",
            "fixture:preview",
            "--host",
            "127.0.0.1",
            "--port",
            String(port),
            "--strictPort",
          ];
    const child = spawn("corepack", args, {
      cwd: path.join(root, ".artifacts/packed-fixtures/consumers", kind),
      shell: process.platform === "win32",
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const log = [];
    child.stdout.on("data", (data) => log.push(data));
    child.stderr.on("data", (data) => log.push(data));
    const origin = `http://127.0.0.1:${port}`;
    const page = await browser.newPage();
    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null)
          throw new Error(`${kind} server exited: ${Buffer.concat(log)}`);
        ready = await fetch(origin)
          .then((response) => response.ok)
          .catch(() => false);
        if (ready) break;
        await setTimeout(200);
      }
      assert.ok(ready, `${kind} server did not become ready`);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin);
      const image = page.getByAltText("Wonky star", { exact: true }).first();
      await image.waitFor({ state: "visible" });
      const result = await image.evaluate(async (element) => {
        await element.decode();
        const response = await fetch(element.src);
        return {
          decoded: element.naturalWidth > 0,
          source: element.src,
          status: response.status,
          contentType: response.headers.get("content-type"),
          svg: /^\s*<svg\b/u.test(await response.text()),
        };
      });
      assert.ok(
        result.decoded && result.svg,
        `${kind} official artwork failed`,
      );
      assert.equal(result.status, 200);
      assert.match(result.contentType, /image\/svg\+xml/u);
      assert.deepEqual(errors, []);
      report[kind] = { ...result, errors, result: "PASS" };
      console.log(`Packed ${kind} browser artwork decode PASS`);
    } finally {
      await page.close();
      await writeFile(path.join(output, `${kind}.log`), Buffer.concat(log));
      stopServer(child);
    }
  }
} finally {
  await browser.close();
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
