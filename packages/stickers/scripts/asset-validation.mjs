import assert from "node:assert/strict";

export const stickerCategories = new Set([
  "signal",
  "expression",
  "direction",
  "object",
  "label",
]);

export const scoutPalette = new Set([
  "#0b0a0e",
  "#121116",
  "#1664ff",
  "#61dbe8",
  "#7c2cff",
  "#d4ff5f",
  "#f7f5ef",
  "#ff3d9a",
  "#ff7a1a",
  "#fffefa",
]);

export const rasterOptimizationOptions = Object.freeze({
  png: Object.freeze({
    adaptiveFiltering: false,
    compressionLevel: 9,
    palette: false,
  }),
  webp: Object.freeze({
    alphaQuality: 100,
    effort: 6,
    lossless: true,
    quality: 100,
    smartSubsample: false,
  }),
});

const forbiddenSvg = [
  /<\/?(?:script|foreignObject|iframe|object|embed|image|style|text)\b/iu,
  /\bon[a-z]+\s*=/iu,
  /\b(?:href|xlink:href)\s*=/iu,
  /\b(?:data:|javascript:|file:)/iu,
  /\burl\s*\(/iu,
  /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/iu,
  /\bid\s*=/iu,
  /@import/iu,
];

const prohibitedTerms =
  /\b(?:apple|disney|marvel|nike|pokemon|scout(?:-in)?|ugly[ -]cash|wordmark|logo)\b/iu;

export function normalizeSvg(source) {
  return `${source
    .replace(/<!--[^]*?-->/gu, "")
    .replace(/\s+/gu, " ")
    .replace(/> </gu, "><")
    .trim()}\n`;
}

export function validateCatalog(catalog) {
  assert.equal(typeof catalog, "object", "catalog must be an object");
  assert.equal(typeof catalog.pack, "object", "pack metadata is required");
  assert.match(catalog.pack.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
  assert.equal(typeof catalog.pack.name, "string", "pack name is required");
  assert.ok(catalog.pack.name.length > 0, "pack name is required");
  assert.match(catalog.pack.version, /^\d+\.\d+\.\d+$/u);
  assert.equal(catalog.pack.artworkLicense, "CC0-1.0");
  assert.equal(catalog.pack.codeLicense, "MIT");
  assert.equal(catalog.pack.attributionStatus, "not-required");
  assert.equal(
    typeof catalog.pack.creator,
    "string",
    "pack creator is required",
  );
  assert.ok(catalog.pack.creator.length > 0, "pack creator is required");
  assert.equal(typeof catalog.pack.source, "string", "pack source is required");
  assert.ok(catalog.pack.source.length > 0, "pack source is required");
  assert.equal(
    typeof catalog.pack.aiAssistance,
    "string",
    "AI-assistance disclosure is required",
  );
  assert.match(catalog.pack.aiAssistance, /Codex-assisted/u);
  assert.ok(Array.isArray(catalog.stickers), "stickers must be an array");
  assert.ok(
    catalog.stickers.length >= 24 && catalog.stickers.length <= 36,
    "official pack must contain 24–36 stickers",
  );

  const ids = new Set();
  for (const sticker of catalog.stickers) {
    assert.equal(typeof sticker, "object", "sticker metadata is required");
    assert.match(sticker.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    assert.equal(ids.has(sticker.id), false, `duplicate ID: ${sticker.id}`);
    ids.add(sticker.id);
    assert.equal(typeof sticker.name, "string", `${sticker.id} needs a name`);
    assert.match(sticker.name, /^[\w -]+$/u);
    assert.ok(stickerCategories.has(sticker.category));
    assert.ok(["svg", "png", "webp"].includes(sticker.format ?? "svg"));
    assert.ok(Array.isArray(sticker.tags) && sticker.tags.length >= 2);
    assert.ok(sticker.tags.every((tag) => /^[a-z0-9-]+$/u.test(tag)));
    assert.equal(
      typeof sticker.dominantTone,
      "string",
      `${sticker.id} needs a dominant tone`,
    );
    assert.match(sticker.dominantTone, /^[a-z-]+$/u);
    assert.doesNotMatch(
      [sticker.id, sticker.name, ...sticker.tags].join(" "),
      prohibitedTerms,
      `${sticker.id} contains a protected/trademark marker`,
    );
  }
}

export function validateSvgSource(source, sticker) {
  assert.ok(Buffer.byteLength(source) <= 12_000, `${sticker.id} exceeds 12KB`);
  assert.match(source, /^<svg\b/u, `${sticker.id} must begin with svg`);
  assert.match(source, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/u);
  assert.match(source, /width="160"/u);
  assert.match(source, /height="160"/u);
  assert.match(source, /viewBox="0 0 160 160"/u);
  assert.match(source, /stroke-linecap="round"/u);
  assert.match(source, /stroke-linejoin="round"/u);

  for (const pattern of forbiddenSvg) {
    assert.doesNotMatch(source, pattern, `${sticker.id} contains unsafe SVG`);
  }

  const colors = new Set(
    [...source.matchAll(/(?:fill|stroke)="(#[\da-f]{6})"/giu)].map((match) =>
      match[1].toLowerCase(),
    ),
  );
  assert.ok(colors.has("#fffefa"), `${sticker.id} needs a paper cut line`);
  assert.ok(colors.has("#121116"), `${sticker.id} needs an ink outline`);
  for (const color of colors) {
    assert.ok(scoutPalette.has(color), `${sticker.id} uses ${color}`);
  }
  const artworkColors = [...colors].filter(
    (color) => color !== "#fffefa" && color !== "#121116",
  );
  assert.ok(
    artworkColors.length >= 1 && artworkColors.length <= 4,
    `${sticker.id} must use 1–4 accent/foundation colors`,
  );
}

export function validateTransparentBounds(
  bounds,
  sticker,
  canvasWidth = 160,
  canvasHeight = 160,
) {
  const right = canvasWidth - (bounds.x + bounds.width);
  const bottom = canvasHeight - (bounds.y + bounds.height);
  assert.ok(bounds.x >= 6, `${sticker.id} is cropped on the left`);
  assert.ok(bounds.y >= 6, `${sticker.id} is cropped on the top`);
  assert.ok(right >= 6, `${sticker.id} is cropped on the right`);
  assert.ok(bottom >= 6, `${sticker.id} is cropped on the bottom`);
  assert.ok(
    bounds.width >= 40 && bounds.height >= 40,
    `${sticker.id} has insufficient optical size`,
  );
}

export function validateRasterMetadata(metadata, fileSize, label) {
  assert.ok(["png", "webp"].includes(metadata.format));
  assert.ok(metadata.width >= 32 && metadata.height >= 32);
  assert.ok(metadata.width <= 2048 && metadata.height <= 2048);
  assert.equal(metadata.hasAlpha, true, `${label} must retain transparency`);
  assert.ok(fileSize > 0, `${label} must not be empty`);
  assert.ok(fileSize <= 500_000, `${label} exceeds 500KB`);
}
