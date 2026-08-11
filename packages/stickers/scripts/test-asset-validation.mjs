import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import sharp from "sharp";

import { optimizeRasterAsset } from "./asset-raster.mjs";
import {
  normalizeSvg,
  validateCatalog,
  validateRasterMetadata,
  validateSvgSource,
} from "./asset-validation.mjs";

const catalog = JSON.parse(
  await readFile(new URL("../source/catalog.json", import.meta.url), "utf8"),
);
validateCatalog(catalog);

const duplicateCatalog = structuredClone(catalog);
duplicateCatalog.stickers[1].id = duplicateCatalog.stickers[0].id;
assert.throws(() => validateCatalog(duplicateCatalog), /duplicate ID/u);

const malformedCatalog = structuredClone(catalog);
delete malformedCatalog.pack.creator;
assert.throws(() => validateCatalog(malformedCatalog), /creator/u);

const sticker = catalog.stickers[0];
const safeSvg = normalizeSvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" stroke-linecap="round" stroke-linejoin="round"><path fill="#d4ff5f" stroke="#fffefa" d="M20 20h120v120H20z"/><path fill="#d4ff5f" stroke="#121116" d="M20 20h120v120H20z"/></svg>`,
);
validateSvgSource(safeSvg, sticker);
assert.throws(
  () =>
    validateSvgSource(safeSvg.replace("</svg>", "<script/></svg>"), sticker),
  /unsafe SVG/u,
);
assert.throws(
  () =>
    validateSvgSource(
      safeSvg.replace(
        "</svg>",
        '<path href="https://example.com/a.svg"/></svg>',
      ),
      sticker,
    ),
  /unsafe SVG/u,
);
assert.throws(
  () =>
    validateSvgSource(safeSvg.replace('width="160"', 'width="159"'), sticker),
  /width/u,
);

validateRasterMetadata(
  { format: "webp", hasAlpha: true, height: 256, width: 256 },
  32_000,
  "future-raster.webp",
);
assert.throws(
  () =>
    validateRasterMetadata(
      { format: "webp", hasAlpha: false, height: 256, width: 256 },
      32_000,
      "opaque.webp",
    ),
  /transparency/u,
);

const rasterSource = await sharp({
  create: {
    background: { alpha: 0.5, b: 30, g: 220, r: 90 },
    channels: 4,
    height: 64,
    width: 64,
  },
})
  .png()
  .toBuffer();
const optimizedRasterA = await optimizeRasterAsset(
  rasterSource,
  "png",
  "deterministic.png",
);
const optimizedRasterB = await optimizeRasterAsset(
  rasterSource,
  "png",
  "deterministic.png",
);
assert.deepEqual(optimizedRasterA, optimizedRasterB);
