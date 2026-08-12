import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { preparePackedConsumers } from "./test-packed-consumers.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const port = "4310";
const vitePort = "4311";

async function waitForServer(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is expected to refuse connections while it starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Fixture server did not become ready at ${url}`);
}

const manifest = await preparePackedConsumers();
const nextBin = path.join(
  manifest.consumers.next,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const nextServer = spawn(
  process.execPath,
  [nextBin, "start", "-H", "127.0.0.1", "-p", port],
  {
    cwd: manifest.consumers.next,
    env: { ...process.env, PORT: port },
    stdio: "inherit",
  },
);
const viteBin = path.join(
  manifest.consumers.vite,
  "node_modules",
  "vite",
  "bin",
  "vite.js",
);
const viteServer = spawn(
  process.execPath,
  [
    viteBin,
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    vitePort,
    "--strictPort",
  ],
  {
    cwd: manifest.consumers.vite,
    env: { ...process.env },
    stdio: "inherit",
  },
);

try {
  await waitForServer(`http://127.0.0.1:${port}`);
  await waitForServer(`http://127.0.0.1:${vitePort}`);
  const args = ["pnpm", "exec", "playwright", "test"];
  if (process.argv.includes("--visual")) args.push("--update-snapshots");
  await new Promise((resolve, reject) => {
    // `corepack` is a `.cmd` shim on Windows, which `spawn` cannot resolve
    // without a shell.
    const tests = spawn("corepack", args, {
      cwd: root,
      env: {
        ...process.env,
        SCOUT_UI_FIXTURE_URL: `http://127.0.0.1:${port}`,
        SCOUT_UI_VITE_FIXTURE_URL: `http://127.0.0.1:${vitePort}`,
      },
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    tests.once("error", reject);
    tests.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Playwright failed (${signal ?? code})`));
    });
  });
} finally {
  nextServer.kill("SIGTERM");
  viteServer.kill("SIGTERM");
}
