import {
  Sticker,
  StickerBadge,
  StickerButton,
  StickerCursor,
  StickerNavbar,
  StickerPeel,
  StickerStack,
  StickerTrail,
  useStickerTrail,
} from "@scout-ui/react";
import type {
  CursorVisual,
  NumberRange,
  ScoutIntensity,
  ScoutMotionPolicy,
  ScoutStyleProperties,
  ScoutUiToken,
  ScoutUiTokenGroup,
  ScoutUiTokenName,
  StickerBadgeProps,
  StickerButtonProps,
  StickerCursorProps,
  StickerMaterial,
  StickerNavbarProps,
  StickerNavItem,
  StickerOutline,
  StickerPeelProps,
  StickerProps,
  StickerShadow,
  StickerSize,
  StickerSource,
  StickerStackProps,
  StickerTone,
  StickerTrailController,
  StickerTrailExit,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailProps,
  StickerTrailSequence,
  StickerTrailTouch,
  UseStickerTrailOptions,
} from "@scout-ui/react";
import { Sticker as SubpathSticker } from "@scout-ui/react/sticker";
import { StickerBadge as SubpathStickerBadge } from "@scout-ui/react/sticker-badge";
import { StickerButton as SubpathStickerButton } from "@scout-ui/react/sticker-button";
import { StickerCursor as SubpathStickerCursor } from "@scout-ui/react/sticker-cursor";
import { StickerNavbar as SubpathStickerNavbar } from "@scout-ui/react/sticker-navbar";
import { StickerPeel as SubpathStickerPeel } from "@scout-ui/react/sticker-peel";
import { StickerStack as SubpathStickerStack } from "@scout-ui/react/sticker-stack";
import { StickerTrail as SubpathStickerTrail } from "@scout-ui/react/sticker-trail";
import {
  StickerTrail as StandaloneStickerTrail,
  useStickerTrail as useStandaloneStickerTrail,
} from "@scout-ui/sticker-trail";
import type {
  NumberRange as StandaloneNumberRange,
  ScoutMotionPolicy as StandaloneMotionPolicy,
  StickerSource as StandaloneStickerSource,
  StickerTrailController as StandaloneTrailController,
  StickerTrailOptions as StandaloneTrailOptions,
  StickerTrailPreset as StandaloneTrailPreset,
  StickerTrailProps as StandaloneTrailProps,
  UseStickerTrailOptions as StandaloneUseTrailOptions,
} from "@scout-ui/sticker-trail";
import {
  officialStickerPack,
  stickerDefinitions,
  stickersById,
} from "@scout-ui/stickers";
import type {
  StickerAttributionStatus,
  StickerCategory,
  StickerDefinition,
  StickerFormat,
  StickerPackManifest,
  StickerTransparentBounds,
} from "@scout-ui/stickers";
import { stickerDefinitions as manifestDefinitions } from "@scout-ui/stickers/manifest";
import manifestUrl from "@scout-ui/stickers/manifest.json";
import starUrl from "@scout-ui/stickers/assets/wonky-star.svg";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

const source = wonkyStar satisfies StickerSource;
const items: readonly StickerNavItem[] = [
  { href: "#api", id: "api", label: "API" },
];

/** Strict packed-consumer witness for all eight frozen component contracts. */
export function PublicApiTypeSmoke() {
  return (
    <div>
      <Sticker source={source} alt="Wonky star" />
      <StickerButton type="button">Button</StickerButton>
      <StickerBadge mode="select" selected onSelectedChange={() => undefined}>
        Selected
      </StickerBadge>
      <StickerTrail stickers={[source]}>Trail</StickerTrail>
      <StickerCursor visuals={{ default: { source } }}>Cursor</StickerCursor>
      <StickerPeel back="Back" front="Front" />
      <StickerStack
        getKey={(item) => item}
        items={["one", "two"]}
        renderItem={(item) => item}
      />
      <StickerNavbar brand={<a href="#api">Brand</a>} items={items} />
    </div>
  );
}

export const publicSubpathValues = {
  StandaloneStickerTrail,
  SubpathSticker,
  SubpathStickerBadge,
  SubpathStickerButton,
  SubpathStickerCursor,
  SubpathStickerNavbar,
  SubpathStickerPeel,
  SubpathStickerStack,
  SubpathStickerTrail,
  manifestDefinitions,
  manifestUrl,
  officialStickerPack,
  starUrl,
  stickerDefinitions,
  stickersById,
  useStandaloneStickerTrail,
  useStickerTrail,
};

export type PublicApiTypeWitness = {
  cursor: CursorVisual | StickerCursorProps;
  foundation:
    | NumberRange
    | ScoutIntensity
    | ScoutMotionPolicy
    | ScoutStyleProperties
    | StickerSource
    | StickerTone;
  navbar: StickerNavbarProps | StickerNavItem;
  peel: StickerPeelProps;
  primitives: {
    badge: StickerBadgeProps;
    button: StickerButtonProps;
    material: StickerMaterial;
    outline: StickerOutline;
    shadow: StickerShadow;
    size: StickerSize;
    sticker: StickerProps;
  };
  stack: StickerStackProps<string>;
  stickers:
    | StickerAttributionStatus
    | StickerCategory
    | StickerDefinition
    | StickerFormat
    | StickerPackManifest
    | StickerTransparentBounds;
  tokens: ScoutUiToken | ScoutUiTokenGroup | ScoutUiTokenName;
  trail:
    | StickerTrailController
    | StickerTrailExit
    | StickerTrailOptions
    | StickerTrailPreset
    | StickerTrailProps
    | StickerTrailSequence
    | StickerTrailTouch
    | UseStickerTrailOptions;
  trailStandalone:
    | StandaloneMotionPolicy
    | StandaloneNumberRange
    | StandaloneStickerSource
    | StandaloneTrailController
    | StandaloneTrailOptions
    | StandaloneTrailPreset
    | StandaloneTrailProps
    | StandaloneUseTrailOptions;
};
