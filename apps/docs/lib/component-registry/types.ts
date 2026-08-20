import type { ReactNode } from "react";

export type DocsPackageName = "@scout-ui/react" | "@scout-ui/sticker-trail";
export type ComponentStatus = "alpha" | "beta" | "stable";
export type ComponentKind = "foundation" | "signature";
export type ComponentAccent =
  "acid" | "cyan" | "orange" | "pink" | "ultraviolet";
export type ComponentCapability = "keyboard" | "pointer" | "ssr" | "touch";
export type ControlGroup =
  "Content" | "Appearance" | "Motion" | "Behavior" | "Accessibility";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };
export type StickerToneValue =
  | "paper"
  | "ink"
  | "ultraviolet"
  | "acid"
  | "cyan"
  | "pink"
  | "cobalt"
  | "orange";
export type MotionPolicyValue = "system" | "always";

export interface StickerDocsConfig {
  sourceId: string;
  alt: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  tone: StickerToneValue;
  material: "flat" | "paper" | "photo" | "metallic";
  outline: "none" | "ink" | "paper" | "cutline";
  shadow: "none" | "stuck" | "lifted";
  rotation: number;
  intensity: "calm" | "playful" | "loud";
  interactive: boolean;
}

export interface StickerBadgeDocsConfig {
  mode: "static" | "select" | "remove";
  label: string;
  tone: StickerToneValue;
  shape: "label" | "stamp" | "pill";
  size: "compact" | "default" | "large";
  rotation: number;
  selected: boolean;
}

export interface StickerButtonDocsConfig {
  element: "button" | "anchor";
  label: string;
  tone: StickerToneValue;
  size: "compact" | "default" | "large";
  shape: "label" | "paper" | "pill";
  leading: boolean;
  trailing: boolean;
  fullWidth: boolean;
  loading: boolean;
  reducedMotion: MotionPolicyValue;
}

export interface StickerTrailDocsConfig {
  preset: "calm" | "scout" | "dense" | "floaty" | "chaos";
  stickerId: string;
  enabled: boolean;
  size: number;
  spacing: number;
  lifetime: number;
  maxActive: number;
  exit: "fade" | "shrink" | "float";
  sequence: "ordered" | "random";
  touch: "none" | "tap";
  clip: boolean;
  reducedMotion: MotionPolicyValue;
}

export interface StickerCursorDocsConfig {
  visualId: string;
  enabled: boolean;
  size: number;
  tilt: number;
  smoothing: number;
  clickFeedback: "none" | "press" | "echo";
  hideNative: "when-ready" | "never";
  reducedMotion: MotionPolicyValue;
}

export interface StickerPeelDocsConfig {
  open: boolean;
  origin: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  peelSize: number;
  drag: boolean;
  dragThreshold: number;
  disabled: boolean;
  reducedMotion: MotionPolicyValue;
}

export interface StickerStackDocsConfig {
  index: number;
  visibleCount: number;
  loop: boolean;
  axis: "x" | "y";
  drag: boolean;
  keyboard: boolean;
  disabled: boolean;
  reducedMotion: MotionPolicyValue;
}

export interface StickerNavbarDocsConfig {
  variant: "ribbon" | "collage";
  activeId: string;
  sticky: boolean;
  showScrollProgress: boolean;
  collageAssetId: string;
  reducedMotion: MotionPolicyValue;
}

export interface ComponentConfigMap {
  sticker: StickerDocsConfig;
  "sticker-badge": StickerBadgeDocsConfig;
  "sticker-button": StickerButtonDocsConfig;
  "sticker-trail": StickerTrailDocsConfig;
  "sticker-cursor": StickerCursorDocsConfig;
  "sticker-peel": StickerPeelDocsConfig;
  "sticker-stack": StickerStackDocsConfig;
  "sticker-navbar": StickerNavbarDocsConfig;
}

export type ComponentSlug = keyof ComponentConfigMap;
export type ComponentDocsConfig = ComponentConfigMap[ComponentSlug];

export interface ControlOption {
  readonly label: string;
  readonly value: string | number;
}

export interface ControlVisibility<C extends object> {
  readonly field: keyof C & string;
  readonly equals: JsonPrimitive | readonly JsonPrimitive[];
}

interface ControlFieldBase<C extends object> {
  readonly key: keyof C & string;
  readonly label: string;
  readonly description: string;
  readonly group: ControlGroup;
  readonly default: JsonPrimitive;
  readonly shareable: boolean;
  readonly serialization: "non-default" | "never";
  readonly visibleWhen?: ControlVisibility<C>;
  readonly codegen: {
    readonly prop: string | null;
    readonly omitWhenDefault: boolean;
  };
  readonly prompt: {
    readonly description: string;
    readonly accessibility?: string;
    readonly motion?: string;
  };
}

export interface BooleanControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "boolean";
  readonly validation: { readonly type: "boolean" };
  readonly normalization: "boolean-fallback";
}

export interface NumericControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "number" | "range";
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly validation: {
    readonly type: "finite-number";
    readonly min: number;
    readonly max: number;
  };
  readonly normalization: "finite-clamp";
}

export interface ChoiceControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "select" | "segmented";
  readonly options: readonly ControlOption[];
  readonly validation: { readonly type: "option" };
  readonly normalization: "option-fallback";
}

export interface ColorControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "color";
  readonly validation: { readonly type: "hex-color" };
  readonly normalization: "hex-color-fallback";
}

export interface StickerControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "sticker";
  readonly options: readonly ControlOption[];
  readonly validation: { readonly type: "approved-sticker-id" };
  readonly normalization: "option-fallback";
}

export interface TextControlField<
  C extends object,
> extends ControlFieldBase<C> {
  readonly kind: "text";
  readonly maxLength: number;
  readonly validation: {
    readonly type: "short-text";
    readonly maxLength: number;
  };
  readonly normalization: "short-text";
}

export type ConfigField<C extends object> =
  | BooleanControlField<C>
  | NumericControlField<C>
  | ChoiceControlField<C>
  | ColorControlField<C>
  | StickerControlField<C>
  | TextControlField<C>;

export interface ConfigSchema<C extends object> {
  readonly fields: readonly ConfigField<C>[];
}

export interface ConfigPreset<C extends object> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly config: Readonly<C>;
}

export interface ComponentDocDefinition<C extends object> {
  readonly slug: ComponentSlug;
  readonly name: string;
  readonly purpose: string;
  readonly packageName: DocsPackageName;
  readonly status: ComponentStatus;
  readonly kind: ComponentKind;
  readonly accent: ComponentAccent;
  readonly capabilities: readonly ComponentCapability[];
  readonly schemaVersion: 1;
  readonly defaults: Readonly<C>;
  readonly schema: ConfigSchema<C>;
  readonly presets: readonly ConfigPreset<C>[];
  readonly renderPreview: (config: Readonly<C>) => ReactNode;
  readonly searchTerms: readonly string[];
}

export type AnyComponentDocDefinition = {
  [S in ComponentSlug]: ComponentDocDefinition<ComponentConfigMap[S]>;
}[ComponentSlug];

export const controlGroupOrder: readonly ControlGroup[] = [
  "Content",
  "Appearance",
  "Motion",
  "Behavior",
  "Accessibility",
];
