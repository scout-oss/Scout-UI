"use client";

import {
  Sticker,
  StickerBadge,
  StickerButton,
  StickerCursor,
  StickerNavbar,
  StickerPeel,
  StickerStack,
  StickerTrail,
} from "@scout-ui/react";
import { useEffect } from "react";
import type {
  ComponentConfigMap,
  ComponentSlug,
} from "../../lib/component-registry/types";
import { playgroundStickerSources } from "../../lib/component-registry/sticker-options";

const {
  "attention-bolt": attentionBolt,
  "chunky-check": chunkyCheck,
  "sparkle-pop": sparklePop,
  "sunny-smile": sunnySmile,
  "wonky-star": wonkyStar,
} = playgroundStickerSources;

function selectedSticker(id: string) {
  return (
    Object.entries(playgroundStickerSources).find(([key]) => key === id)?.[1] ??
    sunnySmile
  );
}

const stackItems = [
  { id: "spark", label: "Start with one loud idea.", tone: "cyan" },
  { id: "shape", label: "Give it a semantic shape.", tone: "acid" },
  { id: "ship", label: "Ship the bounded version.", tone: "pink" },
  { id: "learn", label: "Watch real products use it.", tone: "orange" },
] as const;

const navItems = [
  { id: "components", label: "Components", href: "#preview" },
  { id: "guides", label: "Guides", href: "#preview" },
  { id: "examples", label: "Examples", href: "#preview" },
] as const;

function StickerPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker"];
}) {
  const source = selectedSticker(config.sourceId);
  return (
    <div
      className="sui-docs-demo-center"
      data-preview-value={`${config.sourceId}:${config.size}`}
    >
      <Sticker
        alt={config.alt}
        intensity={config.intensity}
        interactive={config.interactive}
        material={config.material}
        onClick={config.interactive ? () => undefined : undefined}
        outline={config.outline}
        rotation={config.rotation}
        shadow={config.shadow}
        size={config.size}
        source={source}
        tone={config.tone}
      />
    </div>
  );
}

function BadgePreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-badge"];
}) {
  const shared = {
    children: config.label,
    rotation: config.rotation,
    shape: config.shape,
    size: config.size,
    tone: config.tone,
  } as const;
  return (
    <div
      className="sui-docs-demo-center"
      data-preview-value={`${config.mode}:${String(config.selected)}`}
    >
      {config.mode === "select" ? (
        <StickerBadge
          {...shared}
          mode="select"
          onSelectedChange={() => undefined}
          selected={config.selected}
        />
      ) : config.mode === "remove" ? (
        <StickerBadge
          {...shared}
          mode="remove"
          onRemove={() => undefined}
          removeLabel={`Remove ${config.label}`}
        />
      ) : (
        <StickerBadge {...shared} />
      )}
    </div>
  );
}

function ButtonPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-button"];
}) {
  const content = (
    <>
      {config.leading ? <span aria-hidden="true">✦</span> : null}
      {config.label}
      {config.trailing ? <span aria-hidden="true">→</span> : null}
    </>
  );
  const shared = {
    fullWidth: config.fullWidth,
    reducedMotion: config.reducedMotion,
    shape: config.shape,
    size: config.size,
    tone: config.tone,
  } as const;
  return (
    <div
      className="sui-docs-demo-center"
      data-preview-value={`${config.element}:${config.tone}`}
    >
      {config.element === "anchor" ? (
        <StickerButton {...shared} href="#preview">
          {content}
        </StickerButton>
      ) : (
        <StickerButton
          {...shared}
          loading={config.loading}
          loadingLabel="Sticking…"
        >
          {content}
        </StickerButton>
      )}
    </div>
  );
}

function TrailPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-trail"];
}) {
  const source = selectedSticker(config.stickerId);
  return (
    <StickerTrail
      className="sui-docs-demo-trail"
      clip={config.clip}
      enabled={config.enabled}
      exit={config.exit}
      lifetime={config.lifetime}
      maxActive={config.maxActive}
      preset={config.preset}
      reducedMotion={config.reducedMotion}
      sequence={config.sequence}
      size={{ min: Math.max(16, config.size - 14), max: config.size + 14 }}
      spacing={{
        min: Math.max(12, config.spacing - 10),
        max: config.spacing + 10,
      }}
      stickers={[source, sparklePop, wonkyStar]}
      touch={config.touch}
    >
      <div data-preview-value={`${config.preset}:${String(config.maxActive)}`}>
        <strong>Move inside this bounded board.</strong>
        <span>The fixed pool never follows you into the docs.</span>
      </div>
    </StickerTrail>
  );
}

function CursorPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-cursor"];
}) {
  const source = selectedSticker(config.visualId);
  return (
    <StickerCursor
      className="sui-docs-demo-cursor"
      clickFeedback={config.clickFeedback}
      enabled={config.enabled}
      hideNative={config.hideNative}
      reducedMotion={config.reducedMotion}
      size={config.size}
      smoothing={config.smoothing}
      tilt={config.tilt}
      visuals={{ default: { source }, hover: { source: chunkyCheck } }}
    >
      <div data-preview-value={`${config.visualId}:${String(config.size)}`}>
        <strong>Native cursor wins whenever safety is uncertain.</strong>
        <button data-sticker-cursor="hover" type="button">
          Hover target
        </button>
        <input
          aria-label="Native cursor text field"
          defaultValue="Editable stays native"
        />
      </div>
    </StickerCursor>
  );
}

function PeelPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-peel"];
}) {
  return (
    <StickerPeel
      back={
        <div className="sui-docs-demo-peel-layer" data-side="back">
          <strong>Second layer.</strong>
          <span>Still semantic. Still mounted.</span>
        </div>
      }
      data-preview-value={`${String(config.open)}:${config.origin}`}
      disabled={config.disabled}
      drag={config.drag}
      dragThreshold={config.dragThreshold}
      front={
        <div className="sui-docs-demo-peel-layer" data-side="front">
          <Sticker
            alt="Smiling sun sticker"
            shadow="none"
            size="lg"
            source={sunnySmile}
          />
          <strong>Peel the idea.</strong>
        </div>
      }
      onOpenChange={() => undefined}
      open={config.open}
      origin={config.origin}
      peelSize={config.peelSize}
      reducedMotion={config.reducedMotion}
    />
  );
}

function StackPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-stack"];
}) {
  return (
    <StickerStack
      axis={config.axis}
      className="sui-docs-demo-stack"
      disabled={config.disabled}
      drag={config.drag}
      getKey={(item) => item.id}
      index={config.index}
      items={stackItems}
      keyboard={config.keyboard}
      loop={config.loop}
      onIndexChange={() => undefined}
      reducedMotion={config.reducedMotion}
      renderItem={(item, context) => (
        <article
          data-preview-value={context.active ? item.id : undefined}
          data-tone={item.tone}
        >
          <span>0{String(context.index + 1)}</span>
          <strong>{item.label}</strong>
        </article>
      )}
      visibleCount={config.visibleCount as 2 | 3 | 4 | 5}
    />
  );
}

function NavbarPreview({
  config,
}: {
  readonly config: ComponentConfigMap["sticker-navbar"];
}) {
  const collageSource = selectedSticker(config.collageAssetId);
  return (
    <div
      className="sui-docs-demo-navbar"
      data-preview-value={`${config.variant}:${config.activeId}`}
    >
      <StickerNavbar
        action={
          <StickerButton href="#preview" size="compact" tone="acid">
            Start
          </StickerButton>
        }
        activeId={config.activeId}
        brand={<a href="#preview">STICK/WORK</a>}
        collage={[collageSource, sparklePop, attentionBolt]}
        items={navItems}
        reducedMotion={config.reducedMotion}
        showScrollProgress={config.showScrollProgress}
        sticky={config.sticky}
        variant={config.variant}
      />
      <div className="sui-docs-demo-navbar-body">
        <strong>Navigation stays bounded inside this model.</strong>
      </div>
    </div>
  );
}

export function PreviewAdapter<S extends ComponentSlug>({
  config,
  definitionSlug,
}: {
  readonly config: ComponentConfigMap[S];
  readonly definitionSlug: S;
}) {
  useEffect(() => {
    const scope = window as typeof window & {
      __scoutUiPlaygroundPreviewCommits?: number;
    };
    if (scope.__scoutUiPlaygroundPreviewCommits !== undefined)
      scope.__scoutUiPlaygroundPreviewCommits += 1;
  });

  switch (definitionSlug) {
    case "sticker":
      return (
        <StickerPreview config={config as ComponentConfigMap["sticker"]} />
      );
    case "sticker-badge":
      return (
        <BadgePreview config={config as ComponentConfigMap["sticker-badge"]} />
      );
    case "sticker-button":
      return (
        <ButtonPreview
          config={config as ComponentConfigMap["sticker-button"]}
        />
      );
    case "sticker-trail":
      return (
        <TrailPreview config={config as ComponentConfigMap["sticker-trail"]} />
      );
    case "sticker-cursor":
      return (
        <CursorPreview
          config={config as ComponentConfigMap["sticker-cursor"]}
        />
      );
    case "sticker-peel":
      return (
        <PeelPreview config={config as ComponentConfigMap["sticker-peel"]} />
      );
    case "sticker-stack":
      return (
        <StackPreview config={config as ComponentConfigMap["sticker-stack"]} />
      );
    case "sticker-navbar":
      return (
        <NavbarPreview
          config={config as ComponentConfigMap["sticker-navbar"]}
        />
      );
  }
}
