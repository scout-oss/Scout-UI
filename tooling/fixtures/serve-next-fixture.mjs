/**
 * Serve the packed Next.js consumer fixture.
 *
 * Scout UI is a library monorepo: `turbo run dev` starts Rollup and tsc
 * watchers, not a web server, so there is no page to open. The runnable
 * surface is the consumer fixture, which installs the real `@scout-ui/*`
 * tarballs and hosts every engineering test surface.
 *
 * Launched through `node` rather than a package manager because only the Node
 * binary is guaranteed to be on PATH; a `pnpm` entry fails with ENOENT wherever
 * Corepack shims are not installed.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const consumer = path.join(
  root,
  ".artifacts",
  "packed-fixtures",
  "consumers",
  "next",
);
const nextBin = path.join(
  consumer,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const port = process.env.PORT ?? "4310";

if (!existsSync(nextBin) || !existsSync(path.join(consumer, ".next"))) {
  console.error(
    [
      "The packed consumer fixture is not built yet.",
      "",
      "Build it first, which packs the workspace packages as real tarballs",
      "and installs them into an isolated consumer:",
      "",
      "  pnpm test:fixtures",
      "",
      `Expected: ${consumer}`,
    ].join("\n"),
  );
  process.exit(1);
}

// Next resolves `.next` from the working directory, so the server must run
// inside the consumer rather than at the repository root.
const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", "127.0.0.1", "-p", port],
  { cwd: consumer, env: { ...process.env, PORT: port }, stdio: "inherit" },
);

const stop = () => {
  child.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.once("exit", (code) => {
  process.exit(code ?? 0);
});
