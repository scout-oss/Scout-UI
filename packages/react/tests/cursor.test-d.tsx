import { StickerCursor } from "../src/index.js";
import type {
  CursorVisual,
  StickerCursorProps,
  StickerCursorState,
  StickerSource,
} from "../src/index.js";

const source: StickerSource = { id: "arrow", src: "/arrow.svg" };

const validUsage = (
  <>
    <StickerCursor visuals={{ default: { source } }}>
      <p>Bounded showcase</p>
    </StickerCursor>
    <StickerCursor
      clickFeedback="echo"
      disabledSelector=".no-cursor"
      enabled
      hideNative="never"
      layerClassName="hero-cursor"
      size={48}
      smoothing={0.2}
      stateAttribute="data-showcase-cursor"
      tilt={12}
      visuals={{
        active: { hotspot: { x: 0.5, y: 0.5 }, source },
        default: { hotspot: { x: 0.1, y: 0.1 }, source },
        hover: { source },
        sparkle: { source },
      }}
    >
      <p>Every option</p>
    </StickerCursor>
    {/* Div attributes pass through, including the ones nearest a collision. */}
    <StickerCursor
      aria-label="Showcase"
      className="canvas"
      color="rebeccapurple"
      id="showcase"
      onClick={() => undefined}
      reducedMotion="always"
      style={{ minHeight: 320 }}
      translate="no"
      visuals={{ default: { source } }}
    >
      <p>Content stays the real interface.</p>
    </StickerCursor>
  </>
);

export { validUsage };

// `size` resolves to the cursor's number, not to a DOM attribute.
export const sizeIsANumber = 40 satisfies NonNullable<
  StickerCursorProps["size"]
>;

export const conventionalStates = [
  "default",
  "hover",
  "active",
] satisfies StickerCursorState[];
// The state union is open, so a product may name its own.
export const customState = "sparkle" satisfies StickerCursorState;

// Format neutrality: any source URL is valid, and an official definition is
// structurally a source.
export const rasterVisual = {
  source: { id: "photo", src: "/cursor.webp", width: 64, height: 64 },
} satisfies CursorVisual;
export const definitionVisual = {
  source: {
    id: "wonky-star",
    src: "/wonky-star.svg",
    width: 160,
    height: 160,
  },
} satisfies CursorVisual;

// @ts-expect-error a default visual is required.
// prettier-ignore
export const missingDefault = { visuals: { hover: { source } } } satisfies Pick<StickerCursorProps, "visuals">;
// @ts-expect-error a visual needs a source.
// prettier-ignore
export const missingSource = { visuals: { default: {} } } satisfies Pick<StickerCursorProps, "visuals">;
// @ts-expect-error the click-feedback union is closed.
// prettier-ignore
export const unknownFeedback = { clickFeedback: "sparkle" } satisfies Pick<StickerCursorProps, "clickFeedback">;
// @ts-expect-error an undocumented always-hide mode must not exist.
// prettier-ignore
export const alwaysHide = { hideNative: "always" } satisfies Pick<StickerCursorProps, "hideNative">;
// @ts-expect-error a public option to ignore an operating-system request is intentionally absent.
// prettier-ignore
export const forcedMotion = { reducedMotion: "never" } satisfies Pick<StickerCursorProps, "reducedMotion">;
// @ts-expect-error a hotspot needs both axes.
// prettier-ignore
export const partialHotspot = { hotspot: { x: 0.5 }, source } satisfies CursorVisual;
