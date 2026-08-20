import { PreviewAdapter } from "../../components/playground/preview-adapter";
import { generateCodeForDefinition } from "../codegen/generate-code";
import { playgroundStickerOptions } from "./sticker-options";
import type {
  BooleanControlField,
  ChoiceControlField,
  ComponentConfigMap,
  ComponentDocDefinition,
  ComponentDocDefinitionBase,
  ComponentSlug,
  ConfigField,
  ConfigPreset,
  ControlGroup,
  ControlOption,
  ControlVisibility,
  JsonPrimitive,
  NumericControlField,
  StickerControlField,
  TextControlField,
} from "./types";

type PrimitiveKey<C extends object> = {
  [K in keyof C & string]: C[K] extends JsonPrimitive ? K : never;
}[keyof C & string];

interface FieldOptions<C extends object> {
  readonly prop?: string | null;
  readonly shareable?: boolean;
  readonly visibleWhen?: ControlVisibility<C>;
  readonly accessibility?: string;
  readonly motion?: string;
  readonly omitWhenDefault?: boolean;
}

function common<C extends object, K extends PrimitiveKey<C>>(
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & JsonPrimitive,
  options: FieldOptions<C> = {},
) {
  return {
    key,
    label,
    description,
    group,
    default: defaultValue,
    shareable: options.shareable ?? true,
    serialization: options.shareable === false ? "never" : "non-default",
    codegen: {
      prop: options.prop === undefined ? key : options.prop,
      omitWhenDefault: options.omitWhenDefault ?? true,
    },
    prompt: {
      description,
      ...(options.accessibility
        ? { accessibility: options.accessibility }
        : {}),
      ...(options.motion ? { motion: options.motion } : {}),
    },
    ...(options.visibleWhen ? { visibleWhen: options.visibleWhen } : {}),
  } as const;
}

function booleanField<C extends object, K extends PrimitiveKey<C>>(
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & boolean,
  options?: FieldOptions<C>,
): BooleanControlField<C> {
  return {
    ...common(key, label, description, group, defaultValue, options),
    kind: "boolean",
    validation: { type: "boolean" },
    normalization: "boolean-fallback",
  };
}

function numericField<C extends object, K extends PrimitiveKey<C>>(
  kind: "number" | "range",
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & number,
  min: number,
  max: number,
  step: number,
  options?: FieldOptions<C>,
): NumericControlField<C> {
  return {
    ...common(key, label, description, group, defaultValue, options),
    kind,
    min,
    max,
    step,
    validation: { type: "finite-number", min, max },
    normalization: "finite-clamp",
  };
}

function choiceField<C extends object, K extends PrimitiveKey<C>>(
  kind: "select" | "segmented",
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & (string | number),
  optionsList: readonly ControlOption[],
  options?: FieldOptions<C>,
): ChoiceControlField<C> {
  return {
    ...common(key, label, description, group, defaultValue, options),
    kind,
    options: optionsList,
    validation: { type: "option" },
    normalization: "option-fallback",
  };
}

function stickerField<C extends object, K extends PrimitiveKey<C>>(
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & string,
  options?: FieldOptions<C>,
): StickerControlField<C> {
  return {
    ...common(key, label, description, group, defaultValue, options),
    kind: "sticker",
    options: playgroundStickerOptions,
    validation: { type: "approved-sticker-id" },
    normalization: "option-fallback",
  };
}

function textField<C extends object, K extends PrimitiveKey<C>>(
  key: K,
  label: string,
  description: string,
  group: ControlGroup,
  defaultValue: C[K] & string,
  maxLength: number,
  options?: FieldOptions<C>,
): TextControlField<C> {
  return {
    ...common(key, label, description, group, defaultValue, options),
    kind: "text",
    maxLength,
    validation: { type: "short-text", maxLength },
    normalization: "short-text",
  };
}

const toneOptions = [
  "paper",
  "ink",
  "ultraviolet",
  "acid",
  "cyan",
  "pink",
  "cobalt",
  "orange",
].map((value) => ({ label: value, value }));
const motionOptions = [
  { label: "System", value: "system" },
  { label: "Always reduce", value: "always" },
] as const;

function preset<C extends object>(
  id: string,
  name: string,
  description: string,
  config: C,
): ConfigPreset<C> {
  return Object.freeze({
    id,
    name,
    description,
    config: Object.freeze({ ...config }),
  });
}

function definition<C extends object>(value: ComponentDocDefinitionBase<C>) {
  const complete: ComponentDocDefinition<C> = {
    ...value,
    generateCode: (config, context) =>
      generateCodeForDefinition(value, config, context).source,
  };
  for (const field of complete.schema.fields) Object.freeze(field);
  Object.freeze(complete.schema.fields);
  Object.freeze(complete.schema);
  Object.freeze(complete.presets);
  Object.freeze(complete.defaults);
  return Object.freeze(complete);
}

const stickerDefaults = {
  sourceId: "sunny-smile",
  alt: "Smiling sun sticker",
  size: "lg",
  tone: "paper",
  material: "flat",
  outline: "none",
  shadow: "lifted",
  rotation: -6,
  intensity: "playful",
  interactive: false,
} as const satisfies ComponentConfigMap["sticker"];
const stickerFields: readonly ConfigField<ComponentConfigMap["sticker"]>[] = [
  stickerField(
    "sourceId",
    "Artwork",
    "Choose one approved open-source sticker definition.",
    "Content",
    stickerDefaults.sourceId,
    { prop: "source" },
  ),
  textField(
    "alt",
    "Alternative text",
    "Describe meaningful artwork or leave empty when decorative.",
    "Accessibility",
    stickerDefaults.alt,
    80,
    {
      omitWhenDefault: false,
      accessibility:
        "Meaningful source artwork requires useful alternative text.",
    },
  ),
  choiceField(
    "segmented",
    "size",
    "Size",
    "Change the named optical size without assuming SVG artwork.",
    "Appearance",
    stickerDefaults.size,
    ["xs", "sm", "md", "lg", "xl"].map((value) => ({
      label: value.toUpperCase(),
      value,
    })),
    { omitWhenDefault: false },
  ),
  choiceField(
    "select",
    "tone",
    "Tone",
    "Choose the semantic accent role.",
    "Appearance",
    stickerDefaults.tone,
    toneOptions,
  ),
  choiceField(
    "select",
    "material",
    "Material",
    "Select the wrapper material contract.",
    "Appearance",
    stickerDefaults.material,
    ["flat", "paper", "photo", "metallic"].map((value) => ({
      label: value,
      value,
    })),
  ),
  choiceField(
    "select",
    "outline",
    "Wrapper outline",
    "Official artwork already owns its intrinsic cut line.",
    "Appearance",
    stickerDefaults.outline,
    ["none", "ink", "paper", "cutline"].map((value) => ({
      label: value,
      value,
    })),
  ),
  choiceField(
    "segmented",
    "shadow",
    "Depth",
    "Choose no, stuck, or lifted hard depth.",
    "Appearance",
    stickerDefaults.shadow,
    ["none", "stuck", "lifted"].map((value) => ({ label: value, value })),
    { omitWhenDefault: false },
  ),
  numericField(
    "range",
    "rotation",
    "Rotation",
    "Apply bounded authored imperfection.",
    "Appearance",
    stickerDefaults.rotation,
    -12,
    12,
    1,
    { omitWhenDefault: false },
  ),
  choiceField(
    "segmented",
    "intensity",
    "Intensity",
    "Control bounded expressive amplitude.",
    "Motion",
    stickerDefaults.intensity,
    ["calm", "playful", "loud"].map((value) => ({ label: value, value })),
    { motion: "Reduced motion keeps state feedback without travel." },
  ),
  booleanField(
    "interactive",
    "Interactive object",
    "Render a native button for object-like actions.",
    "Behavior",
    stickerDefaults.interactive,
    { accessibility: "Interactive stickers use native button semantics." },
  ),
];

const badgeDefaults = {
  mode: "static",
  label: "Fresh signal",
  tone: "cyan",
  shape: "label",
  size: "default",
  rotation: -1,
  selected: false,
} as const satisfies ComponentConfigMap["sticker-badge"];
const badgeFields: readonly ConfigField<ComponentConfigMap["sticker-badge"]>[] =
  [
    choiceField(
      "segmented",
      "mode",
      "Mode",
      "Choose static label, selection, or whole-badge removal semantics.",
      "Behavior",
      badgeDefaults.mode,
      ["static", "select", "remove"].map((value) => ({ label: value, value })),
      {
        accessibility: "Each mode maps to its frozen native element contract.",
      },
    ),
    textField(
      "label",
      "Label",
      "Set the compact visible label.",
      "Content",
      badgeDefaults.label,
      48,
      { prop: "children" },
    ),
    choiceField(
      "select",
      "tone",
      "Tone",
      "Choose an expressive semantic tone.",
      "Appearance",
      badgeDefaults.tone,
      toneOptions,
      { omitWhenDefault: false },
    ),
    choiceField(
      "segmented",
      "shape",
      "Shape",
      "Use label, stamp, or a true pill.",
      "Appearance",
      badgeDefaults.shape,
      ["label", "stamp", "pill"].map((value) => ({ label: value, value })),
    ),
    choiceField(
      "segmented",
      "size",
      "Size",
      "Choose compact, default, or large target geometry.",
      "Appearance",
      badgeDefaults.size,
      ["compact", "default", "large"].map((value) => ({ label: value, value })),
    ),
    numericField(
      "range",
      "rotation",
      "Rotation",
      "Keep compact label rotation within a restrained range.",
      "Appearance",
      badgeDefaults.rotation,
      -3,
      3,
      1,
      { omitWhenDefault: false },
    ),
    booleanField(
      "selected",
      "Selected",
      "Set the pressed selection state.",
      "Behavior",
      badgeDefaults.selected,
      {
        visibleWhen: { field: "mode", equals: "select" },
        accessibility: "Selection uses aria-pressed and a visible check.",
      },
    ),
  ];

const buttonDefaults = {
  element: "button",
  label: "Make it stick",
  tone: "acid",
  size: "default",
  shape: "paper",
  leading: true,
  trailing: true,
  fullWidth: false,
  loading: false,
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-button"];
const buttonFields: readonly ConfigField<
  ComponentConfigMap["sticker-button"]
>[] = [
  choiceField(
    "segmented",
    "element",
    "Element",
    "Choose native button or anchor semantics.",
    "Behavior",
    buttonDefaults.element,
    [
      { label: "Button", value: "button" },
      { label: "Link", value: "anchor" },
    ],
    {
      prop: "href",
      accessibility: "Links remain anchors; actions remain buttons.",
    },
  ),
  textField(
    "label",
    "Label",
    "Set the visible action label.",
    "Content",
    buttonDefaults.label,
    64,
    { prop: "children" },
  ),
  choiceField(
    "select",
    "tone",
    "Tone",
    "Choose the action surface tone.",
    "Appearance",
    buttonDefaults.tone,
    toneOptions,
    { omitWhenDefault: false },
  ),
  choiceField(
    "segmented",
    "size",
    "Size",
    "Choose compact, default, or large target geometry.",
    "Appearance",
    buttonDefaults.size,
    ["compact", "default", "large"].map((value) => ({ label: value, value })),
  ),
  choiceField(
    "segmented",
    "shape",
    "Shape",
    "Use label, paper, or pill when semantically appropriate.",
    "Appearance",
    buttonDefaults.shape,
    ["label", "paper", "pill"].map((value) => ({ label: value, value })),
  ),
  booleanField(
    "leading",
    "Leading mark",
    "Show authored leading content.",
    "Content",
    buttonDefaults.leading,
    { omitWhenDefault: false, prop: "leading" },
  ),
  booleanField(
    "trailing",
    "Trailing arrow",
    "Show authored trailing content.",
    "Content",
    buttonDefaults.trailing,
    { omitWhenDefault: false, prop: "trailing" },
  ),
  booleanField(
    "fullWidth",
    "Full width",
    "Fill the available preview row.",
    "Appearance",
    buttonDefaults.fullWidth,
  ),
  booleanField(
    "loading",
    "Loading",
    "Preserve dimensions and suppress duplicate activation.",
    "Behavior",
    buttonDefaults.loading,
    {
      visibleWhen: { field: "element", equals: "button" },
      accessibility: "Loading uses disabled and aria-busy semantics.",
    },
  ),
  choiceField(
    "select",
    "reducedMotion",
    "Motion policy",
    "Use system motion preference or always choose static feedback.",
    "Accessibility",
    buttonDefaults.reducedMotion,
    motionOptions,
    {
      motion:
        "Always preserves color, outline, and depth feedback without translation.",
    },
  ),
];

const trailDefaults = {
  preset: "scout",
  stickerId: "sparkle-pop",
  enabled: true,
  size: 78,
  spacing: 42,
  lifetime: 1100,
  maxActive: 24,
  exit: "fade",
  sequence: "ordered",
  touch: "none",
  clip: true,
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-trail"];
const trailFields: readonly ConfigField<ComponentConfigMap["sticker-trail"]>[] =
  [
    choiceField(
      "segmented",
      "preset",
      "Runtime preset",
      "Start from a bounded Trail preset.",
      "Appearance",
      trailDefaults.preset,
      ["calm", "scout", "dense", "floaty", "chaos"].map((value) => ({
        label: value,
        value,
      })),
    ),
    stickerField(
      "stickerId",
      "Primary sticker",
      "Choose the first approved source in the authored sequence.",
      "Content",
      trailDefaults.stickerId,
      { prop: "stickers" },
    ),
    booleanField(
      "enabled",
      "Enabled",
      "Run the bounded enhancement when capability policy permits.",
      "Behavior",
      trailDefaults.enabled,
    ),
    numericField(
      "range",
      "size",
      "Optical size",
      "Set the center of a safe size range.",
      "Appearance",
      trailDefaults.size,
      24,
      180,
      2,
      { prop: "size" },
    ),
    numericField(
      "range",
      "spacing",
      "Spacing",
      "Set the center of a velocity-aware spacing range.",
      "Motion",
      trailDefaults.spacing,
      20,
      120,
      2,
      { omitWhenDefault: false },
    ),
    numericField(
      "number",
      "lifetime",
      "Lifetime (ms)",
      "Keep each pooled visual finite.",
      "Motion",
      trailDefaults.lifetime,
      150,
      5000,
      50,
    ),
    numericField(
      "range",
      "maxActive",
      "Maximum active",
      "Bound the fixed DOM pool below the engine hard ceiling.",
      "Behavior",
      trailDefaults.maxActive,
      4,
      48,
      1,
    ),
    choiceField(
      "segmented",
      "exit",
      "Exit",
      "Choose a finite exit treatment.",
      "Motion",
      trailDefaults.exit,
      ["fade", "shrink", "float"].map((value) => ({ label: value, value })),
    ),
    choiceField(
      "segmented",
      "sequence",
      "Sequence",
      "Use ordered or seeded random selection.",
      "Behavior",
      trailDefaults.sequence,
      ["ordered", "random"].map((value) => ({ label: value, value })),
    ),
    choiceField(
      "segmented",
      "touch",
      "Touch",
      "Keep Trail off on touch or allow deliberate tap placement.",
      "Accessibility",
      trailDefaults.touch,
      ["none", "tap"].map((value) => ({ label: value, value })),
      { accessibility: "Tap mode never steals scrolling." },
    ),
    booleanField(
      "clip",
      "Clip to board",
      "Prevent effect overflow beyond the bounded preview.",
      "Behavior",
      trailDefaults.clip,
    ),
    choiceField(
      "select",
      "reducedMotion",
      "Motion policy",
      "Honor the system or always suppress the trail.",
      "Accessibility",
      trailDefaults.reducedMotion,
      motionOptions,
      { motion: "Reduced motion registers no movement loop." },
    ),
  ];

const cursorDefaults = {
  visualId: "scribble-pointer",
  enabled: true,
  size: 48,
  tilt: 10,
  smoothing: 0.35,
  clickFeedback: "echo",
  hideNative: "when-ready",
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-cursor"];
const cursorFields: readonly ConfigField<
  ComponentConfigMap["sticker-cursor"]
>[] = [
  stickerField(
    "visualId",
    "Cursor artwork",
    "Choose an approved visual for the bounded pointer.",
    "Content",
    cursorDefaults.visualId,
    { prop: "visuals" },
  ),
  booleanField(
    "enabled",
    "Enabled",
    "Enable only inside the preview region.",
    "Behavior",
    cursorDefaults.enabled,
  ),
  numericField(
    "range",
    "size",
    "Size",
    "Keep artwork small enough to preserve target visibility.",
    "Appearance",
    cursorDefaults.size,
    24,
    96,
    2,
    { omitWhenDefault: false },
  ),
  numericField(
    "range",
    "tilt",
    "Velocity tilt",
    "Bound horizontal velocity rotation.",
    "Motion",
    cursorDefaults.tilt,
    0,
    14,
    1,
  ),
  numericField(
    "range",
    "smoothing",
    "Smoothing",
    "Tune cursor interpolation without changing semantic state.",
    "Motion",
    cursorDefaults.smoothing,
    0,
    0.95,
    0.05,
  ),
  choiceField(
    "segmented",
    "clickFeedback",
    "Click feedback",
    "Choose none, press, or a bounded echo pool.",
    "Motion",
    cursorDefaults.clickFeedback,
    ["none", "press", "echo"].map((value) => ({ label: value, value })),
  ),
  choiceField(
    "segmented",
    "hideNative",
    "Native cursor",
    "Hide only when ready or keep the native cursor visible.",
    "Accessibility",
    cursorDefaults.hideNative,
    [
      { label: "When ready", value: "when-ready" },
      { label: "Never hide", value: "never" },
    ],
    { accessibility: "Native behavior returns on every safety bypass." },
  ),
  choiceField(
    "select",
    "reducedMotion",
    "Motion policy",
    "Honor system motion or always keep the native cursor.",
    "Accessibility",
    cursorDefaults.reducedMotion,
    motionOptions,
  ),
];

const peelDefaults = {
  open: false,
  origin: "top-right",
  peelSize: 72,
  drag: true,
  dragThreshold: 0.5,
  disabled: false,
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-peel"];
const peelFields: readonly ConfigField<ComponentConfigMap["sticker-peel"]>[] = [
  booleanField(
    "open",
    "Open",
    "Choose the current semantic layer.",
    "Behavior",
    peelDefaults.open,
  ),
  choiceField(
    "select",
    "origin",
    "Origin",
    "Anchor the peel to one of four corners.",
    "Appearance",
    peelDefaults.origin,
    ["top-left", "top-right", "bottom-left", "bottom-right"].map((value) => ({
      label: value,
      value,
    })),
  ),
  numericField(
    "range",
    "peelSize",
    "Peel size",
    "Set the authored curl signal size.",
    "Appearance",
    peelDefaults.peelSize,
    36,
    220,
    2,
  ),
  booleanField(
    "drag",
    "Drag enhancement",
    "Add directional pointer drag without removing click or keyboard.",
    "Behavior",
    peelDefaults.drag,
    {
      accessibility: "Drag is never the only path.",
      omitWhenDefault: false,
    },
  ),
  numericField(
    "range",
    "dragThreshold",
    "Drag threshold",
    "Choose the normalized commit threshold.",
    "Behavior",
    peelDefaults.dragThreshold,
    0.1,
    0.9,
    0.05,
    { visibleWhen: { field: "drag", equals: true } },
  ),
  booleanField(
    "disabled",
    "Disabled",
    "Preserve visible state while suppressing interaction.",
    "Accessibility",
    peelDefaults.disabled,
  ),
  choiceField(
    "select",
    "reducedMotion",
    "Motion policy",
    "Replace spatial curl travel with immediate state feedback.",
    "Accessibility",
    peelDefaults.reducedMotion,
    motionOptions,
    { motion: "Reduced motion retains the semantic toggle." },
  ),
];

const stackDefaults = {
  index: 0,
  visibleCount: 3,
  loop: false,
  axis: "x",
  drag: false,
  keyboard: false,
  disabled: false,
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-stack"];
const stackFields: readonly ConfigField<ComponentConfigMap["sticker-stack"]>[] =
  [
    numericField(
      "range",
      "index",
      "Active card",
      "Choose one of the four fixed authored demo cards.",
      "Content",
      stackDefaults.index,
      0,
      3,
      1,
      { prop: "index" },
    ),
    choiceField(
      "segmented",
      "visibleCount",
      "Visible cards",
      "Bound rendered layers from two to five.",
      "Appearance",
      stackDefaults.visibleCount,
      [2, 3, 4, 5].map((value) => ({ label: String(value), value })),
    ),
    booleanField(
      "loop",
      "Loop",
      "Allow navigation across collection boundaries.",
      "Behavior",
      stackDefaults.loop,
    ),
    choiceField(
      "segmented",
      "axis",
      "Axis",
      "Choose horizontal or vertical gesture geometry.",
      "Behavior",
      stackDefaults.axis,
      [
        { label: "Horizontal", value: "x" },
        { label: "Vertical", value: "y" },
      ],
    ),
    booleanField(
      "drag",
      "Drag enhancement",
      "Add axis-locked swipe while preserving buttons.",
      "Behavior",
      stackDefaults.drag,
      { accessibility: "Buttons remain a complete alternative." },
    ),
    booleanField(
      "keyboard",
      "Arrow keys",
      "Enable documented arrow navigation on the focused stack.",
      "Accessibility",
      stackDefaults.keyboard,
    ),
    booleanField(
      "disabled",
      "Disabled",
      "Keep state understandable while navigation is unavailable.",
      "Accessibility",
      stackDefaults.disabled,
    ),
    choiceField(
      "select",
      "reducedMotion",
      "Motion policy",
      "Commit direct reorder without travel.",
      "Accessibility",
      stackDefaults.reducedMotion,
      motionOptions,
    ),
  ];

const navbarDefaults = {
  variant: "ribbon",
  activeId: "components",
  sticky: false,
  showScrollProgress: false,
  collageAssetId: "wonky-star",
  reducedMotion: "system",
} as const satisfies ComponentConfigMap["sticker-navbar"];
const navbarFields: readonly ConfigField<
  ComponentConfigMap["sticker-navbar"]
>[] = [
  choiceField(
    "segmented",
    "variant",
    "Variant",
    "Choose ribbon or collage structure.",
    "Appearance",
    navbarDefaults.variant,
    ["ribbon", "collage"].map((value) => ({ label: value, value })),
  ),
  choiceField(
    "select",
    "activeId",
    "Current page",
    "Expose one current navigation destination.",
    "Behavior",
    navbarDefaults.activeId,
    navOptions(),
    { omitWhenDefault: false },
  ),
  booleanField(
    "sticky",
    "Sticky",
    "Exercise the documented sticky contract inside the bounded model.",
    "Behavior",
    navbarDefaults.sticky,
  ),
  booleanField(
    "showScrollProgress",
    "Scroll progress",
    "Show compositor-friendly decorative progress.",
    "Motion",
    navbarDefaults.showScrollProgress,
  ),
  stickerField(
    "collageAssetId",
    "Collage hero",
    "Choose the leading approved collage asset.",
    "Content",
    navbarDefaults.collageAssetId,
    { visibleWhen: { field: "variant", equals: "collage" }, prop: "collage" },
  ),
  choiceField(
    "select",
    "reducedMotion",
    "Motion policy",
    "Show ribbon and collage in their composed resting state.",
    "Accessibility",
    navbarDefaults.reducedMotion,
    motionOptions,
  ),
];

function navOptions(): readonly ControlOption[] {
  return [
    { label: "Components", value: "components" },
    { label: "Guides", value: "guides" },
    { label: "Examples", value: "examples" },
  ];
}

export const componentDefinitions = Object.freeze({
  sticker: definition<ComponentConfigMap["sticker"]>({
    slug: "sticker",
    name: "Sticker",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Place accessible artwork with tactile Scout UI treatment.",
    capabilities: ["ssr", "keyboard"],
    accent: "acid",
    schemaVersion: 1,
    defaults: stickerDefaults,
    schema: { fields: stickerFields },
    presets: [
      preset("default", "Default", "Lifted official artwork.", stickerDefaults),
      preset("calm", "Calm", "Quiet paper placement.", {
        ...stickerDefaults,
        size: "md",
        shadow: "stuck",
        rotation: 0,
        intensity: "calm",
      }),
      preset("loud", "Loud", "A bounded high-energy object.", {
        ...stickerDefaults,
        alt: "Attention bolt sticker",
        sourceId: "attention-bolt",
        tone: "orange",
        size: "xl",
        rotation: 9,
        intensity: "loud",
      }),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker" config={config} />
    ),
    searchTerms: ["asset", "image", "sticker", "cut line"],
  }),
  "sticker-badge": definition<ComponentConfigMap["sticker-badge"]>({
    slug: "sticker-badge",
    name: "StickerBadge",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Label, select, and remove with native semantics.",
    capabilities: ["ssr", "keyboard", "touch"],
    accent: "pink",
    schemaVersion: 1,
    defaults: badgeDefaults,
    schema: { fields: badgeFields },
    presets: [
      preset("default", "Default", "Static label.", badgeDefaults),
      preset("selected", "Selected", "Pressed selection state.", {
        ...badgeDefaults,
        mode: "select",
        selected: true,
        tone: "acid",
        shape: "stamp",
      }),
      preset("remove", "Remove", "Whole-badge remove action.", {
        ...badgeDefaults,
        mode: "remove",
        tone: "pink",
        label: "Remove me",
      }),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-badge" config={config} />
    ),
    searchTerms: ["badge", "tag", "select", "remove"],
  }),
  "sticker-button": definition<ComponentConfigMap["sticker-button"]>({
    slug: "sticker-button",
    name: "StickerButton",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "foundation",
    purpose: "Give actions and links physical press feedback.",
    capabilities: ["ssr", "keyboard", "touch"],
    accent: "cyan",
    schemaVersion: 1,
    defaults: buttonDefaults,
    schema: { fields: buttonFields },
    presets: [
      preset("default", "Default", "Tactile button action.", buttonDefaults),
      preset("link", "Editorial link", "Native anchor branch.", {
        ...buttonDefaults,
        element: "anchor",
        tone: "cyan",
        shape: "label",
        leading: false,
        loading: false,
      }),
      preset("loading", "Loading", "Stable busy state.", {
        ...buttonDefaults,
        loading: true,
        trailing: false,
      }),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-button" config={config} />
    ),
    searchTerms: ["button", "anchor", "action", "loading"],
  }),
  "sticker-trail": definition<ComponentConfigMap["sticker-trail"]>({
    slug: "sticker-trail",
    name: "StickerTrail",
    packageName: "@scout-ui/sticker-trail",
    status: "alpha",
    kind: "signature",
    purpose: "Leave a bounded, performant trail inside one intentional region.",
    capabilities: ["pointer", "touch", "ssr"],
    accent: "ultraviolet",
    schemaVersion: 1,
    defaults: trailDefaults,
    schema: { fields: trailFields },
    presets: [
      preset("default", "Default", "Balanced Scout trail.", trailDefaults),
      preset("calm", "Calm", "Wider and quieter.", {
        ...trailDefaults,
        preset: "calm",
        size: 60,
        spacing: 72,
        maxActive: 14,
      }),
      preset(
        "chaos",
        "Controlled chaos",
        "High variance with a bounded pool.",
        {
          ...trailDefaults,
          preset: "chaos",
          size: 92,
          spacing: 30,
          maxActive: 32,
          sequence: "random",
          exit: "float",
        },
      ),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-trail" config={config} />
    ),
    searchTerms: ["trail", "pointer", "pool", "cursor effect"],
  }),
  "sticker-cursor": definition<ComponentConfigMap["sticker-cursor"]>({
    slug: "sticker-cursor",
    name: "StickerCursor",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Add a safety-first custom pointer enhancement.",
    capabilities: ["pointer", "ssr"],
    accent: "orange",
    schemaVersion: 1,
    defaults: cursorDefaults,
    schema: { fields: cursorFields },
    presets: [
      preset(
        "default",
        "Default",
        "Bounded expressive cursor.",
        cursorDefaults,
      ),
      preset("native", "Native first", "Never hide the native cursor.", {
        ...cursorDefaults,
        hideNative: "never",
        clickFeedback: "press",
        tilt: 4,
      }),
      preset("quiet", "Quiet", "Small and restrained.", {
        ...cursorDefaults,
        visualId: "chunky-check",
        size: 34,
        tilt: 0,
        smoothing: 0.65,
        clickFeedback: "none",
      }),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-cursor" config={config} />
    ),
    searchTerms: ["cursor", "hotspot", "pointer", "native bypass"],
  }),
  "sticker-peel": definition<ComponentConfigMap["sticker-peel"]>({
    slug: "sticker-peel",
    name: "StickerPeel",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Reveal layered content with directional intent.",
    capabilities: ["keyboard", "pointer", "touch", "ssr"],
    accent: "pink",
    schemaVersion: 1,
    defaults: peelDefaults,
    schema: { fields: peelFields },
    presets: [
      preset(
        "default",
        "Default",
        "Top-right peel with drag enhancement.",
        peelDefaults,
      ),
      preset("open", "Revealed", "Stable open semantic state.", {
        ...peelDefaults,
        open: true,
      }),
      preset(
        "static",
        "Reduced travel",
        "Click/keyboard only with static motion policy.",
        {
          ...peelDefaults,
          drag: false,
          reducedMotion: "always",
          origin: "bottom-left",
        },
      ),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-peel" config={config} />
    ),
    searchTerms: ["peel", "reveal", "disclosure", "drag"],
  }),
  "sticker-stack": definition<ComponentConfigMap["sticker-stack"]>({
    slug: "sticker-stack",
    name: "StickerStack",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Navigate a bounded stack without rendering the whole collection.",
    capabilities: ["keyboard", "pointer", "touch", "ssr"],
    accent: "cyan",
    schemaVersion: 1,
    defaults: stackDefaults,
    schema: { fields: stackFields },
    presets: [
      preset(
        "default",
        "Default",
        "Finite button-operated stack.",
        stackDefaults,
      ),
      preset("interactive", "Interactive", "Keyboard and drag enhancements.", {
        ...stackDefaults,
        drag: true,
        keyboard: true,
        loop: true,
      }),
      preset(
        "vertical",
        "Vertical",
        "A direct vertical stack with reduced motion.",
        {
          ...stackDefaults,
          axis: "y",
          visibleCount: 4,
          index: 2,
          reducedMotion: "always",
        },
      ),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-stack" config={config} />
    ),
    searchTerms: ["stack", "cards", "swipe", "carousel"],
  }),
  "sticker-navbar": definition<ComponentConfigMap["sticker-navbar"]>({
    slug: "sticker-navbar",
    name: "StickerNavbar",
    packageName: "@scout-ui/react",
    status: "alpha",
    kind: "signature",
    purpose: "Frame a site with accessible ribbon or collage navigation.",
    capabilities: ["keyboard", "touch", "ssr"],
    accent: "acid",
    schemaVersion: 1,
    defaults: navbarDefaults,
    schema: { fields: navbarFields },
    presets: [
      preset("default", "Ribbon", "Calm ribbon navigation.", navbarDefaults),
      preset("collage", "Collage", "Art-directed sticker collage.", {
        ...navbarDefaults,
        variant: "collage",
        collageAssetId: "attention-bolt",
        activeId: "examples",
      }),
      preset(
        "progress",
        "Progress",
        "Ribbon with sticky and scroll-progress contracts.",
        {
          ...navbarDefaults,
          sticky: true,
          showScrollProgress: true,
          activeId: "guides",
        },
      ),
    ],
    renderPreview: (config) => (
      <PreviewAdapter definitionSlug="sticker-navbar" config={config} />
    ),
    searchTerms: ["navbar", "navigation", "ribbon", "collage"],
  }),
} as const satisfies {
  [S in ComponentSlug]: ComponentDocDefinition<ComponentConfigMap[S]>;
});

export const componentSlugs = Object.freeze(
  Object.keys(componentDefinitions) as ComponentSlug[],
);
