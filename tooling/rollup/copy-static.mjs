import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [, , sourceArgument, destinationArgument] = process.argv;

if (sourceArgument === undefined || destinationArgument === undefined) {
  throw new Error("Usage: copy-static.mjs <source> <destination>");
}

const source = resolve(sourceArgument);
const destination = resolve(destinationArgument);

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
