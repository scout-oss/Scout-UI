import { Sticker, StickerBadge, StickerButton } from "../src/index.js";
import type {
  StickerBadgeProps,
  StickerButtonProps,
  StickerProps,
} from "../src/index.js";

const source = { id: "test", src: "/test.svg" };

const validCases = (
  <>
    <Sticker source={source} alt="Test" />
    <Sticker>Raw artwork</Sticker>
    <Sticker interactive aria-label="Open test">
      Object
    </Sticker>
    <StickerButton type="submit">Submit</StickerButton>
    <StickerButton href="/docs" target="_blank">
      Docs
    </StickerButton>
    <StickerBadge>Static</StickerBadge>
    <StickerBadge mode="select" selected onSelectedChange={() => undefined}>
      Select
    </StickerBadge>
    <StickerBadge
      mode="remove"
      removeLabel="Remove tag"
      onRemove={() => undefined}
    >
      Remove
    </StickerBadge>
  </>
);

// @ts-expect-error source and children are mutually exclusive.
// prettier-ignore
const bothStickerInputs = { source, children: "Artwork" } satisfies StickerProps;
// @ts-expect-error source or children is required.
// prettier-ignore
const missingStickerInput = {} satisfies StickerProps;
// @ts-expect-error alt belongs only to source-backed stickers.
// prettier-ignore
const childAlt = { alt: "Invalid", children: "Artwork" } satisfies StickerProps;
// @ts-expect-error a static span cannot accept button-only attributes.
// prettier-ignore
const staticButtonType = { children: "Artwork", type: "button" } satisfies StickerProps;
// @ts-expect-error Sticker object actions do not become anchors.
// prettier-ignore
const interactiveHref = { children: "Artwork", href: "/invalid", interactive: true } satisfies StickerProps;
// @ts-expect-error loading is prohibited on the anchor branch.
// prettier-ignore
const anchorLoading = { children: "Docs", href: "/docs", loading: true } satisfies StickerButtonProps;
// @ts-expect-error disabled is a button-only attribute.
// prettier-ignore
const disabledAnchor = { children: "Docs", disabled: true, href: "/docs" } satisfies StickerButtonProps;
// @ts-expect-error select mode requires selected.
// prettier-ignore
const selectMissingState = { children: "Select", mode: "select", onSelectedChange: () => undefined } satisfies StickerBadgeProps;
// @ts-expect-error malformed modes are rejected.
// prettier-ignore
const malformedMode = { children: "Static", mode: "toggle" } satisfies StickerBadgeProps;
// @ts-expect-error remove mode requires its accessible label.
// prettier-ignore
const removeMissingLabel = { children: "Remove", mode: "remove", onRemove: () => undefined } satisfies StickerBadgeProps;
// @ts-expect-error the API has no nested remove-control slot.
// prettier-ignore
const nestedRemoveSlot = { children: "Remove", mode: "remove", onRemove: () => undefined, removeControl: <button type="button">×</button>, removeLabel: "Remove" } satisfies StickerBadgeProps;

void [
  validCases,
  bothStickerInputs,
  missingStickerInput,
  childAlt,
  staticButtonType,
  interactiveHref,
  anchorLoading,
  disabledAnchor,
  selectMissingState,
  malformedMode,
  removeMissingLabel,
  nestedRemoveSlot,
];
