import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const repositoryRoot = path.resolve(docsRoot, "../..");
const port = "4312";
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Refused connections are expected while the production server starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Docs server did not become ready at ${url}`);
}

const nextBin = path.join(
  docsRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const server = spawn(
  process.execPath,
  [nextBin, "start", "-H", "127.0.0.1", "-p", port],
  {
    cwd: docsRoot,
    env: { ...process.env, PORT: port },
    stdio: "inherit",
  },
);

try {
  await waitForServer(baseUrl);
  const forwarded = process.argv
    .slice(2)
    .filter((argument) => argument !== "--");
  const args = [
    "pnpm",
    "exec",
    "playwright",
    "test",
    "--config",
    "apps/docs/playwright.config.ts",
    ...forwarded,
  ];
  await new Promise((resolve, reject) => {
    const tests = spawn("corepack", args, {
      cwd: repositoryRoot,
      env: { ...process.env, SCOUT_UI_DOCS_URL: baseUrl },
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    tests.once("error", reject);
    tests.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Docs Playwright failed (${signal ?? code})`));
    });
  });
} finally {
  server.kill("SIGTERM");
}
