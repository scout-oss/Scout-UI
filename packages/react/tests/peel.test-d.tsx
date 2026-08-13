import { StickerPeel } from "../src/index.js";
import type { StickerPeelProps } from "../src/index.js";

const validCases = (
  <>
    <StickerPeel front="Question" back="Answer" />
    <StickerPeel
      back={<button type="button">Back action</button>}
      defaultOpen
      drag
      dragThreshold={0.6}
      front={<a href="#front">Front link</a>}
      origin="bottom-left"
      peelSize="clamp(3rem, 10vw, 5rem)"
      reducedMotion="system"
    />
    <StickerPeel
      back="Controlled back"
      front="Controlled front"
      onOpenChange={() => undefined}
      open
      peelSize={48}
    />
  </>
);

// @ts-expect-error front is required.
const missingFront = { back: "Back" } satisfies StickerPeelProps;
// @ts-expect-error back is required.
const missingBack = { front: "Front" } satisfies StickerPeelProps;
const invalidOrigin = {
  back: "Back",
  front: "Front",
  // @ts-expect-error origins are a closed v0.1 vocabulary.
  origin: "edge",
} satisfies StickerPeelProps;
const invalidMotion = {
  back: "Back",
  front: "Front",
  // @ts-expect-error reduced motion cannot override an OS request.
  reducedMotion: "never",
} satisfies StickerPeelProps;
const inventedLoading = {
  back: "Back",
  front: "Front",
  // @ts-expect-error loading is not a StickerPeel API.
  loading: true,
} satisfies StickerPeelProps;

void [
  validCases,
  missingFront,
  missingBack,
  invalidOrigin,
  invalidMotion,
  inventedLoading,
];
