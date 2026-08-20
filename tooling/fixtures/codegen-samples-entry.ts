import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { canonicalGeneratedSamples } from "../../apps/docs/lib/codegen/canonical-samples";

const destinations = process.argv.slice(2);
if (destinations.length === 0) {
  throw new Error("Codegen sample generation requires a destination directory");
}

const samples = canonicalGeneratedSamples();
for (const destination of destinations) {
  await rm(destination, { force: true, recursive: true });
  await mkdir(destination, { recursive: true });
  for (const [index, sample] of samples.entries()) {
    const name = `${String(index + 1).padStart(2, "0")}-${sample.id.replaceAll("/", "-")}.tsx`;
    await writeFile(path.join(destination, name), sample.source, "utf8");
  }
}

process.stdout.write(
  `Generated ${String(samples.length)} deterministic Copy Code samples in ${String(destinations.length)} packed consumer(s).\n`,
);
