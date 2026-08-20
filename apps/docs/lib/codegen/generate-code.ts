import { isFieldVisible, normalizeConfig } from "../component-registry/schema";
import { getPlaygroundStickerImport } from "../component-registry/sticker-options";
import type {
  CodegenContext,
  ComponentConfigMap,
  ComponentDocDefinitionBase,
  ComponentSlug,
  ConfigField,
  JsonPrimitive,
} from "../component-registry/types";

export const defaultCodegenContext = Object.freeze({
  framework: "react",
} as const satisfies CodegenContext);

export const generatedCodePublicImportPatterns = Object.freeze([
  /^react$/u,
  /^@scout-ui\/react$/u,
  /^@scout-ui\/react\/styles\.css$/u,
  /^@scout-ui\/sticker-trail$/u,
  /^@scout-ui\/sticker-trail\/styles\.css$/u,
  /^@scout-ui\/stickers\/definitions\/[a-z0-9-]+$/u,
]);

export interface GeneratedCodeResult {
  readonly source: string;
  readonly fieldLines: Readonly<Record<string, readonly number[]>>;
}

interface Draft {
  readonly body: readonly DraftLine[];
  readonly imports: ImportTable;
  readonly useClient?: boolean;
}

interface DraftLine {
  readonly text: string;
  readonly field?: string;
}

type ImportTable = Map<string, Set<string>>;

type Generator<S extends ComponentSlug> = (
  definition: ComponentDocDefinitionBase<ComponentConfigMap[S]>,
  config: Readonly<ComponentConfigMap[S]>,
  context: CodegenContext,
) => Draft;

type PropEmitter<C extends object> = (
  value: JsonPrimitive,
  config: Readonly<C>,
) => string | readonly string[] | null;

type PropEmitters<C extends object> = Partial<
  Record<keyof C & string, PropEmitter<C>>
>;

function line(text: string, field?: string): DraftLine {
  return field === undefined ? { text } : { field, text };
}

function imports(): ImportTable {
  return new Map<string, Set<string>>();
}

function addImport(table: ImportTable, module: string, name: string) {
  const names = table.get(module) ?? new Set<string>();
  names.add(name);
  table.set(module, names);
}

function stringLiteral(value: string): string {
  return JSON.stringify(value)
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function finiteNumber(value: number): string {
  if (!Number.isFinite(value))
    throw new Error("Codegen received a non-finite number");
  return String(Object.is(value, -0) ? 0 : value);
}

function booleanProp(name: string, value: boolean): string {
  return value ? name : `${name}={false}`;
}

function enumProp(name: string, value: string): string {
  return `${name}=${stringLiteral(value)}`;
}

function textProp(name: string, value: string): string {
  return `${name}={${stringLiteral(value)}}`;
}

function numberProp(name: string, value: number): string {
  return `${name}={${finiteNumber(value)}}`;
}

function differs(left: JsonPrimitive, right: unknown): boolean {
  return left !== right;
}

function emittedSchemaProps<C extends object>(
  definition: ComponentDocDefinitionBase<C>,
  config: Readonly<C>,
  emitters: PropEmitters<C>,
): DraftLine[] {
  const output: DraftLine[] = [];
  for (const field of definition.schema.fields) {
    const emitter = emitters[field.key];
    if (!emitter) continue;
    if (!isFieldVisible(field, config)) continue;
    const value = config[field.key] as JsonPrimitive;
    if (
      field.codegen.omitWhenDefault &&
      !differs(value, definition.defaults[field.key])
    ) {
      continue;
    }
    const rendered = emitter(value, config);
    if (rendered === null) continue;
    for (const prop of typeof rendered === "string" ? [rendered] : rendered) {
      output.push(line(`      ${prop}`, field.key));
    }
  }
  return output;
}

function requiredFieldProp<C extends object>(
  definition: ComponentDocDefinitionBase<C>,
  fieldKey: keyof C & string,
  rendered: string,
): DraftLine {
  const exists = definition.schema.fields.some(
    (field) => field.key === fieldKey,
  );
  if (!exists) throw new Error(`Missing codegen field ${fieldKey}`);
  return line(`      ${rendered}`, fieldKey);
}

function trustedSticker(id: string) {
  const entry = getPlaygroundStickerImport(id);
  if (!entry) throw new Error(`Unsupported Scout UI sticker id: ${id}`);
  return entry;
}

function addStickerImport(table: ImportTable, id: string) {
  const entry = trustedSticker(id);
  addImport(table, entry.module, entry.exportName);
  return entry.exportName;
}

function renderImports(table: ImportTable, useClient: boolean): string[] {
  const result: string[] = [];
  if (useClient) result.push('"use client";', "");

  const frameworkModules = ["react"];
  const componentModules = ["@scout-ui/react", "@scout-ui/sticker-trail"];
  const assetModules = [...table.keys()]
    .filter((module) => module.startsWith("@scout-ui/stickers/"))
    .sort();
  const ordered = [...frameworkModules, ...componentModules, ...assetModules];

  for (const module of ordered) {
    const names = table.get(module);
    if (!names || names.size === 0) continue;
    const sorted = [...names].sort();
    result.push(
      `import { ${sorted.join(", ")} } from ${stringLiteral(module)};`,
    );
  }

  const styleModules = [...table.keys()]
    .filter((module) => module.endsWith("/styles.css"))
    .sort();
  for (const module of styleModules)
    result.push(`import ${stringLiteral(module)};`);
  if (result.length > 0) result.push("");
  return result;
}

function finish(draft: Draft): GeneratedCodeResult {
  const header = renderImports(draft.imports, draft.useClient === true);
  const all = [...header.map((text) => line(text)), ...draft.body];
  const fieldLines: Record<string, number[]> = {};
  all.forEach((entry, index) => {
    if (!entry.field) return;
    (fieldLines[entry.field] ??= []).push(index + 1);
  });
  return {
    fieldLines: Object.freeze(fieldLines),
    source: `${all.map((entry) => entry.text).join("\n")}\n`,
  };
}

function baseImports(component: string, packageName = "@scout-ui/react") {
  const table = imports();
  addImport(table, packageName, component);
  table.set(`${packageName}/styles.css`, new Set());
  return table;
}

const stickerGenerator: Generator<"sticker"> = (definition, config) => {
  const table = baseImports("Sticker");
  const source = addStickerImport(table, config.sourceId);
  const useClient = config.interactive;
  const props = [
    requiredFieldProp(definition, "sourceId", `source={${source}}`),
    requiredFieldProp(definition, "alt", textProp("alt", config.alt)),
    ...emittedSchemaProps(definition, config, {
      size: (value) => enumProp("size", String(value)),
      tone: (value) => enumProp("tone", String(value)),
      material: (value) => enumProp("material", String(value)),
      outline: (value) => enumProp("outline", String(value)),
      shadow: (value) => enumProp("shadow", String(value)),
      rotation: (value) => numberProp("rotation", Number(value)),
      intensity: (value) => enumProp("intensity", String(value)),
      interactive: (value) =>
        value === true
          ? ["interactive", 'onClick={() => window.alert("Sticker activated")}']
          : null,
    }),
  ];
  return {
    imports: table,
    useClient,
    body: [
      line("export default function StickerExample() {"),
      line("  return ("),
      line("    <Sticker"),
      ...props,
      line("    />"),
      line("  );"),
      line("}"),
    ],
  };
};

const badgeGenerator: Generator<"sticker-badge"> = (definition, config) => {
  const table = baseImports("StickerBadge");
  const useClient = config.mode !== "static";
  if (config.mode === "select" || config.mode === "remove") {
    addImport(table, "react", "useState");
  }
  const props = emittedSchemaProps(definition, config, {
    mode: (value) => enumProp("mode", String(value)),
    tone: (value) => enumProp("tone", String(value)),
    shape: (value) => enumProp("shape", String(value)),
    size: (value) => enumProp("size", String(value)),
    rotation: (value) => numberProp("rotation", Number(value)),
    selected: () => null,
  });
  if (config.mode === "select") {
    props.push(
      requiredFieldProp(definition, "selected", "selected={selected}"),
      line("      onSelectedChange={setSelected}", "mode"),
    );
  } else if (config.mode === "remove") {
    props.push(
      line(
        `      removeLabel={${stringLiteral(`Remove tag: ${config.label}`)}}`,
        "mode",
      ),
      line("      onRemove={() => setVisible(false)}", "mode"),
    );
  }
  const setup =
    config.mode === "select"
      ? [
          line(
            `  const [selected, setSelected] = useState(${String(config.selected)});`,
          ),
        ]
      : config.mode === "remove"
        ? [
            line("  const [visible, setVisible] = useState(true);"),
            line("  if (!visible) return null;"),
          ]
        : [];
  return {
    imports: table,
    useClient,
    body: [
      line("export default function StickerBadgeExample() {"),
      ...setup,
      ...(setup.length > 0 ? [line("")] : []),
      line("  return ("),
      line("    <StickerBadge"),
      ...props,
      line("    >"),
      line(`      {${stringLiteral(config.label)}}`, "label"),
      line("    </StickerBadge>"),
      line("  );"),
      line("}"),
    ],
  };
};

const buttonGenerator: Generator<"sticker-button"> = (definition, config) => {
  const table = baseImports("StickerButton");
  const props = emittedSchemaProps(definition, config, {
    element: (value) => (value === "anchor" ? 'href="/components"' : null),
    tone: (value) => enumProp("tone", String(value)),
    size: (value) => enumProp("size", String(value)),
    shape: (value) => enumProp("shape", String(value)),
    leading: (value) =>
      value === true ? 'leading={<span aria-hidden="true">✦</span>}' : null,
    trailing: (value) =>
      value === true ? 'trailing={<span aria-hidden="true">→</span>}' : null,
    fullWidth: (value) => booleanProp("fullWidth", Boolean(value)),
    loading: (value, current) =>
      current.element === "button" && value === true
        ? ["loading", 'loadingLabel="Sticking…"']
        : null,
    reducedMotion: (value) => enumProp("reducedMotion", String(value)),
  });
  return {
    imports: table,
    body: [
      line("export default function StickerButtonExample() {"),
      line("  return ("),
      line("    <StickerButton"),
      ...props,
      line("    >"),
      line(`      {${stringLiteral(config.label)}}`, "label"),
      line("    </StickerButton>"),
      line("  );"),
      line("}"),
    ],
  };
};

const trailGenerator: Generator<"sticker-trail"> = (definition, config) => {
  const table = baseImports("StickerTrail", "@scout-ui/sticker-trail");
  const selected = addStickerImport(table, config.stickerId);
  const sparkle = addStickerImport(table, "sparkle-pop");
  const star = addStickerImport(table, "wonky-star");
  const props = [
    requiredFieldProp(
      definition,
      "stickerId",
      `stickers={[${[selected, sparkle, star].filter((name, index, all) => all.indexOf(name) === index).join(", ")}]}`,
    ),
    ...emittedSchemaProps(definition, config, {
      preset: (value) => enumProp("preset", String(value)),
      enabled: (value) => booleanProp("enabled", Boolean(value)),
      size: (value) => {
        const center = Number(value);
        return `size={{ min: ${finiteNumber(Math.max(16, center - 14))}, max: ${finiteNumber(center + 14)} }}`;
      },
      spacing: (value) => {
        const center = Number(value);
        return `spacing={{ min: ${finiteNumber(Math.max(12, center - 10))}, max: ${finiteNumber(center + 10)} }}`;
      },
      lifetime: (value) => numberProp("lifetime", Number(value)),
      maxActive: (value) => numberProp("maxActive", Number(value)),
      exit: (value) => enumProp("exit", String(value)),
      sequence: (value) => enumProp("sequence", String(value)),
      touch: (value) => enumProp("touch", String(value)),
      clip: (value) => booleanProp("clip", Boolean(value)),
      reducedMotion: (value) => enumProp("reducedMotion", String(value)),
    }),
  ];
  return {
    imports: table,
    body: [
      line("export default function StickerTrailExample() {"),
      line("  return ("),
      line("    <StickerTrail"),
      ...props,
      line("    >"),
      line("      <section style={{ minHeight: 320, padding: 32 }}>"),
      line("        <h2>Move inside this bounded region</h2>"),
      line("        <p>The trail stays decorative and pointer-safe.</p>"),
      line("      </section>"),
      line("    </StickerTrail>"),
      line("  );"),
      line("}"),
    ],
  };
};

const cursorGenerator: Generator<"sticker-cursor"> = (definition, config) => {
  const table = baseImports("StickerCursor");
  const selected = addStickerImport(table, config.visualId);
  const hover = addStickerImport(table, "chunky-check");
  const visualField = definition.schema.fields.find(
    (field) => field.key === "visualId",
  );
  if (!visualField) throw new Error("Missing codegen field visualId");
  const props = [
    line("      visuals={{", "visualId"),
    line(`        default: { source: ${selected} },`, "visualId"),
    line(`        hover: { source: ${hover} },`, "visualId"),
    line("      }}", "visualId"),
    ...emittedSchemaProps(definition, config, {
      enabled: (value) => booleanProp("enabled", Boolean(value)),
      size: (value) => numberProp("size", Number(value)),
      tilt: (value) => numberProp("tilt", Number(value)),
      smoothing: (value) => numberProp("smoothing", Number(value)),
      clickFeedback: (value) => enumProp("clickFeedback", String(value)),
      hideNative: (value) => enumProp("hideNative", String(value)),
      reducedMotion: (value) => enumProp("reducedMotion", String(value)),
    }),
  ];
  return {
    imports: table,
    body: [
      line("export default function StickerCursorExample() {"),
      line("  return ("),
      line("    <StickerCursor"),
      ...props,
      line("    >"),
      line("      <section style={{ minHeight: 320, padding: 32 }}>"),
      line("        <h2>Cursor showcase</h2>"),
      line('        <button data-sticker-cursor="hover" type="button">'),
      line("          Hover target"),
      line("        </button>"),
      line('        <input aria-label="Native cursor text field" />'),
      line("      </section>"),
      line("    </StickerCursor>"),
      line("  );"),
      line("}"),
    ],
  };
};

const peelGenerator: Generator<"sticker-peel"> = (definition, config) => {
  const table = baseImports("StickerPeel");
  const props = emittedSchemaProps(definition, config, {
    open: (value) => (value === true ? "defaultOpen" : null),
    origin: (value) => enumProp("origin", String(value)),
    peelSize: (value) => numberProp("peelSize", Number(value)),
    drag: (value) => booleanProp("drag", Boolean(value)),
    dragThreshold: (value) => numberProp("dragThreshold", Number(value)),
    disabled: (value) => booleanProp("disabled", Boolean(value)),
    reducedMotion: (value) => enumProp("reducedMotion", String(value)),
  });
  return {
    imports: table,
    body: [
      line("export default function StickerPeelExample() {"),
      line("  return ("),
      line("    <StickerPeel"),
      line("      front={"),
      line("        <article>"),
      line("          <h2>Front layer</h2>"),
      line("          <p>Peel for the detail.</p>"),
      line("        </article>"),
      line("      }"),
      line("      back={"),
      line("        <article>"),
      line("          <h2>Revealed layer</h2>"),
      line("          <p>Complete semantic content.</p>"),
      line("        </article>"),
      line("      }"),
      ...props,
      line("    />"),
      line("  );"),
      line("}"),
    ],
  };
};

const stackGenerator: Generator<"sticker-stack"> = (definition, config) => {
  const table = baseImports("StickerStack");
  const props = emittedSchemaProps(definition, config, {
    index: (value) => numberProp("defaultIndex", Number(value)),
    visibleCount: (value) => numberProp("visibleCount", Number(value)),
    loop: (value) => booleanProp("loop", Boolean(value)),
    axis: (value) => enumProp("axis", String(value)),
    drag: (value) => booleanProp("drag", Boolean(value)),
    keyboard: (value) => booleanProp("keyboard", Boolean(value)),
    disabled: (value) => booleanProp("disabled", Boolean(value)),
    reducedMotion: (value) => enumProp("reducedMotion", String(value)),
  });
  return {
    imports: table,
    useClient: true,
    body: [
      line("const items = ["),
      line('  { id: "shape", title: "Give the idea a shape." },'),
      line('  { id: "ship", title: "Ship the bounded version." },'),
      line('  { id: "learn", title: "Learn from real use." },'),
      line('  { id: "repeat", title: "Keep what sticks." },'),
      line("] as const;"),
      line(""),
      line("export default function StickerStackExample() {"),
      line("  return ("),
      line("    <StickerStack"),
      line("      items={items}"),
      line("      getKey={(item) => item.id}"),
      line("      renderItem={(item) => ("),
      line("        <article>"),
      line("          <h2>{item.title}</h2>"),
      line("        </article>"),
      line("      )}"),
      ...props,
      line("    />"),
      line("  );"),
      line("}"),
    ],
  };
};

const navbarGenerator: Generator<"sticker-navbar"> = (definition, config) => {
  const table = baseImports("StickerNavbar");
  const props = emittedSchemaProps(definition, config, {
    variant: (value) => enumProp("variant", String(value)),
    activeId: (value) => enumProp("activeId", String(value)),
    sticky: (value) => booleanProp("sticky", Boolean(value)),
    showScrollProgress: (value) =>
      booleanProp("showScrollProgress", Boolean(value)),
    collageAssetId: (value, current) => {
      if (current.variant !== "collage") return null;
      const asset = addStickerImport(table, String(value));
      return `collage={[${asset}]}`;
    },
    reducedMotion: (value) => enumProp("reducedMotion", String(value)),
  });
  return {
    imports: table,
    body: [
      line("const items = ["),
      line('  { id: "components", label: "Components", href: "/components" },'),
      line('  { id: "guides", label: "Guides", href: "/guides" },'),
      line('  { id: "examples", label: "Examples", href: "/examples" },'),
      line("] as const;"),
      line(""),
      line("export default function StickerNavbarExample() {"),
      line("  return ("),
      line("    <StickerNavbar"),
      line('      brand={<a href="/">STICK/WORK</a>}'),
      line("      items={items}"),
      ...props,
      line("    />"),
      line("  );"),
      line("}"),
    ],
  };
};

export const componentCodeGenerators = Object.freeze({
  sticker: stickerGenerator,
  "sticker-badge": badgeGenerator,
  "sticker-button": buttonGenerator,
  "sticker-trail": trailGenerator,
  "sticker-cursor": cursorGenerator,
  "sticker-peel": peelGenerator,
  "sticker-stack": stackGenerator,
  "sticker-navbar": navbarGenerator,
} as const satisfies { [S in ComponentSlug]: Generator<S> });

export function generateCodeForDefinition<C extends object>(
  definition: ComponentDocDefinitionBase<C>,
  config: Readonly<C>,
  context: CodegenContext = defaultCodegenContext,
): GeneratedCodeResult {
  const candidate = context as { readonly framework?: unknown };
  if (candidate.framework !== "react") {
    throw new Error(
      `Unsupported codegen framework: ${String(candidate.framework)}`,
    );
  }
  const normalized = normalizeConfig(definition, config).config;
  const generator = componentCodeGenerators[definition.slug] as unknown as (
    currentDefinition: ComponentDocDefinitionBase<C>,
    currentConfig: Readonly<C>,
    currentContext: CodegenContext,
  ) => Draft;
  return finish(generator(definition, normalized, context));
}

export function extractModuleSpecifiers(source: string): readonly string[] {
  return [
    ...source.matchAll(
      /\bfrom\s+["']([^"']+)["']|\bimport\s+["']([^"']+)["']/gu,
    ),
  ]
    .map((match) => match[1] ?? match[2])
    .filter((value): value is string => value !== undefined);
}

export function isApprovedGeneratedImport(module: string): boolean {
  return generatedCodePublicImportPatterns.some((pattern) =>
    pattern.test(module),
  );
}

export function schemaFieldOrder<C extends object>(
  definition: ComponentDocDefinitionBase<C>,
): readonly string[] {
  return definition.schema.fields.map((field: ConfigField<C>) => field.key);
}
