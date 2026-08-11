import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prettier from "prettier";
import sharp from "sharp";

import { optimizeRasterAsset } from "./asset-raster.mjs";
import {
  normalizeSvg,
  validateCatalog,
  validateRasterMetadata,
  validateSvgSource,
  validateTransparentBounds,
} from "./asset-validation.mjs";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const assetsDirectory = path.join(packageRoot, "assets");
const definitionsDirectory = path.join(packageRoot, "src", "definitions");
const catalogPath = path.join(packageRoot, "source", "catalog.json");
const mode = process.argv[2] ?? "--check";

assert.ok(["--check", "--write"].includes(mode), `unknown mode: ${mode}`);

function variableName(id) {
  return id.replace(/-([a-z0-9])/gu, (_, letter) => letter.toUpperCase());
}

async function alphaBounds(asset, sticker, expectedWidth, expectedHeight) {
  const source = Buffer.isBuffer(asset) ? asset : Buffer.from(asset);
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(
    info.width,
    expectedWidth,
    `${sticker.id} rendered width drifted`,
  );
  assert.equal(
    info.height,
    expectedHeight,
    `${sticker.id} rendered height drifted`,
  );
  assert.equal(info.channels, 4);

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if ((alpha ?? 0) <= 4) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  assert.ok(maxX >= minX && maxY >= minY, `${sticker.id} rendered empty`);
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function definitionRecord(
  catalog,
  sticker,
  checksum,
  bounds,
  format,
  width,
  height,
) {
  return {
    id: sticker.id,
    name: sticker.name,
    category: sticker.category,
    tags: sticker.tags,
    width,
    height,
    ...(format === "svg" ? { viewBox: `0 0 ${width} ${height}` } : {}),
    transparentBounds: bounds,
    dominantTone: sticker.dominantTone,
    format,
    creator: catalog.pack.creator,
    source: catalog.pack.source,
    license: catalog.pack.artworkLicense,
    attributionStatus: catalog.pack.attributionStatus,
    sourceFile: `assets/${sticker.id}.${format}`,
    editableSource: `assets/${sticker.id}.${format}`,
    aiAssistance: catalog.pack.aiAssistance,
    checksum,
  };
}

async function renderDefinition(record) {
  const name = variableName(record.id);
  const data = JSON.stringify(record, null, 2);
  return prettier.format(
    `// Generated from source/catalog.json and assets/${record.id}.${record.format}.\nimport type { StickerDefinition } from "../types.js";\n\nexport const ${name} = { ...${data}, src: new URL("../../assets/${record.id}.${record.format}", import.meta.url).href } as const satisfies StickerDefinition;\nexport default ${name};\n`,
    { parser: "typescript" },
  );
}

async function renderManifest(records) {
  const imports = records
    .map(
      (record) =>
        `import { ${variableName(record.id)} } from "./definitions/${record.id}.js";`,
    )
    .join("\n");
  const names = records.map((record) => variableName(record.id)).join(",\n");
  return prettier.format(
    `// Generated from source/catalog.json. Do not edit manually.\nimport type { StickerDefinition, StickerPackManifest } from "./types.js";\n${imports}\n\nexport const stickerDefinitions = [${names}] as const satisfies readonly StickerDefinition[];\nexport const stickersById = Object.freeze(Object.fromEntries(stickerDefinitions.map((sticker) => [sticker.id, sticker]))) as Readonly<Record<string, StickerDefinition>>;\nexport const officialStickerPack = { id: "scout-ui-official-v0-1", name: "Scout UI Official v0.1", version: "0.1.0", artworkLicense: "CC0-1.0", codeLicense: "MIT", stickers: stickerDefinitions } as const satisfies StickerPackManifest;\n`,
    { parser: "typescript" },
  );
}

async function writeOrCheck(file, expected) {
  if (mode === "--write") {
    await writeFile(file, expected);
    return;
  }
  const actual = await readFile(
    file,
    Buffer.isBuffer(expected) ? undefined : "utf8",
  ).catch(() => (Buffer.isBuffer(expected) ? Buffer.alloc(0) : ""));
  assert.deepEqual(
    actual,
    expected,
    `${path.relative(packageRoot, file)} drifted; run assets:generate`,
  );
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
validateCatalog(catalog);
if (mode === "--write") {
  await mkdir(definitionsDirectory, { recursive: true });
}
const expectedAssetFiles = catalog.stickers
  .map(({ format = "svg", id }) => `${id}.${format}`)
  .sort();
const actualAssetFiles = (await readdir(assetsDirectory))
  .filter((file) => /\.(?:png|svg|webp)$/u.test(file))
  .sort();
assert.deepEqual(
  actualAssetFiles,
  expectedAssetFiles,
  "asset/catalog parity failed",
);

const records = [];
for (const sticker of catalog.stickers) {
  const format = sticker.format ?? "svg";
  const assetPath = path.join(assetsDirectory, `${sticker.id}.${format}`);
  const input = await readFile(assetPath);
  let optimized;
  let width;
  let height;
  if (format === "svg") {
    optimized = normalizeSvg(input.toString("utf8"));
    validateSvgSource(optimized, sticker);
    width = 160;
    height = 160;
  } else {
    optimized = await optimizeRasterAsset(input, format, sticker.id);
    const metadata = await sharp(optimized).metadata();
    validateRasterMetadata(metadata, optimized.length, sticker.id);
    width = metadata.width;
    height = metadata.height;
  }
  await writeOrCheck(assetPath, optimized);
  const bounds = await alphaBounds(optimized, sticker, width, height);
  validateTransparentBounds(bounds, sticker, width, height);
  const checksum = `sha256-${createHash("sha256").update(optimized).digest("hex")}`;
  const record = definitionRecord(
    catalog,
    sticker,
    checksum,
    bounds,
    format,
    width,
    height,
  );
  records.push(record);
  await writeOrCheck(
    path.join(definitionsDirectory, `${sticker.id}.ts`),
    await renderDefinition(record),
  );
}

await writeOrCheck(
  path.join(packageRoot, "src", "manifest.generated.ts"),
  await renderManifest(records),
);
const jsonManifest = {
  ...catalog.pack,
  stickers: records.map((record) => ({
    ...record,
    src: `./${record.id}.${record.format}`,
  })),
};
await writeOrCheck(
  path.join(assetsDirectory, "manifest.json"),
  await prettier.format(JSON.stringify(jsonManifest), { parser: "json" }),
);
