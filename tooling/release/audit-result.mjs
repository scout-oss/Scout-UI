import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [file, rawStatus] = process.argv.slice(2);
assert.ok(file, "audit report path is required");
const status = Number(rawStatus);
const report = JSON.parse(await readFile(file, "utf8"));
if (report.error) {
  throw new Error(
    `pnpm audit registry failure: ${report.error.code ?? report.error.message ?? "unknown"}`,
  );
}
if (status === 0) {
  process.stdout.write("Dependency audit PASS\n");
} else {
  const counts = report.metadata?.vulnerabilities ?? {};
  throw new Error(
    `Dependency audit found vulnerabilities: ${JSON.stringify(counts)}`,
  );
}
