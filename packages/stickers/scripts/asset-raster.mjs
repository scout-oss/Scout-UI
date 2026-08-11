import assert from "node:assert/strict";

import sharp from "sharp";

import {
  rasterOptimizationOptions,
  validateRasterMetadata,
} from "./asset-validation.mjs";

export async function optimizeRasterAsset(input, format, label) {
  assert.ok(
    ["png", "webp"].includes(format),
    `${label} has unsupported format`,
  );

  const inputMetadata = await sharp(input, { failOn: "error" }).metadata();
  validateRasterMetadata(inputMetadata, input.length, label);

  const pipeline = sharp(input, { failOn: "error" }).ensureAlpha();
  const output =
    format === "png"
      ? await pipeline.png(rasterOptimizationOptions.png).toBuffer()
      : await pipeline.webp(rasterOptimizationOptions.webp).toBuffer();
  const outputMetadata = await sharp(output, { failOn: "error" }).metadata();
  validateRasterMetadata(outputMetadata, output.length, label);

  return output;
}
