import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const cssPath = path.join(root, "packages/react/src/styles.css");
const outputPath = path.join(root, "packages/react/src/tokens.generated.ts");

function readTokens(css) {
  assert.doesNotMatch(
    css,
    /@font-face|tailwind/iu,
    "Public styles must not bundle fonts or depend on Tailwind",
  );
  assert.doesNotMatch(
    css,
    /(?:^|\})\s*(?:\*|body|button|html|input)\s*\{/gmu,
    "Public styles must not leak a global reset",
  );
  assert.match(css, /@media \(forced-colors: active\)/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(css, /\[data-sui-intensity="calm"\]/u);
  assert.match(css, /\[data-sui-density="sparse"\]/u);

  const groupPattern =
    /\/\* sui-token-group: ([a-z-]+) \*\/([\s\S]*?)(?=\/\* sui-token-group:|\/\* sui-token-groups:end \*\/)/gu;
  const declarationPattern = /(--sui-[a-z0-9-]+)\s*:\s*([^;]+);/gu;
  const tokens = [];
  const names = new Set();

  for (const groupMatch of css.matchAll(groupPattern)) {
    const [, group, declarations] = groupMatch;
    assert.ok(group && declarations, "Token group marker must include a body");
    for (const declaration of declarations.matchAll(declarationPattern)) {
      const [, name, rawValue] = declaration;
      assert.ok(name && rawValue, `Invalid token declaration in ${group}`);
      assert.equal(
        names.has(name),
        false,
        `Duplicate canonical token: ${name}`,
      );
      names.add(name);
      tokens.push({
        group,
        name,
        value: rawValue.replace(/\s+/gu, " ").trim(),
      });
    }
  }

  assert.ok(
    tokens.length >= 100,
    "Expected the complete v0.1 token foundation",
  );
  return tokens;
}

async function render(tokens) {
  const source = `// Generated from packages/react/src/styles.css. Do not edit manually.\n\nexport const scoutUiTokens = ${JSON.stringify(tokens, null, 2)} as const;\n\nexport type ScoutUiToken = (typeof scoutUiTokens)[number];\nexport type ScoutUiTokenName = ScoutUiToken["name"];\nexport type ScoutUiTokenGroup = ScoutUiToken["group"];\n`;

  return prettier.format(source, { parser: "typescript" });
}

const expected = await render(readTokens(await readFile(cssPath, "utf8")));
const mode = process.argv[2] ?? "--check";

if (mode === "--write") {
  await writeFile(outputPath, expected);
} else if (mode === "--check") {
  const actual = await readFile(outputPath, "utf8").catch(() => "");
  assert.equal(
    actual,
    expected,
    "Token metadata drifted from styles.css. Run pnpm --filter @scout-ui/react tokens:generate.",
  );
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
