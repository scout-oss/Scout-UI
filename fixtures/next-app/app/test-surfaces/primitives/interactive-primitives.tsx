"use client";

import { Sticker, StickerBadge, StickerButton } from "@scout-ui/react";
import { useState } from "react";

export function InteractivePrimitives() {
  const [activations, setActivations] = useState(0);
  const [selected, setSelected] = useState(false);
  const [removed, setRemoved] = useState(false);

  return (
    <div className="primitive-interactive-grid">
      <Sticker
        interactive
        aria-label="Activate lightning sticker"
        data-testid="interactive-sticker"
        onClick={() => {
          setActivations((value) => value + 1);
        }}
        outline="cutline"
        rotation={-4}
        size="sm"
        tone="acid"
      >
        ⚡
      </Sticker>
      <StickerButton
        data-testid="interactive-button"
        leading={<span aria-hidden="true">✦</span>}
        onClick={() => {
          setActivations((value) => value + 1);
        }}
        tone="ultraviolet"
        trailing={<span aria-hidden="true">→</span>}
      >
        Activations: {activations}
      </StickerButton>
      <StickerBadge
        mode="select"
        onSelectedChange={(nextSelected) => {
          setSelected(nextSelected);
        }}
        selected={selected}
        tone="cyan"
      >
        {selected ? "Selected" : "Choose me"}
      </StickerBadge>
      {removed ? (
        <p data-testid="removed-state">Badge removed</p>
      ) : (
        <StickerBadge
          mode="remove"
          onRemove={() => {
            setRemoved(true);
          }}
          removeLabel="Remove purple filter"
          tone="pink"
        >
          Purple filter
        </StickerBadge>
      )}
    </div>
  );
}

export function BadgeReviewStates() {
  return (
    <>
      <StickerBadge
        mode="select"
        onSelectedChange={() => undefined}
        selected={false}
        tone="cyan"
      >
        Unselected
      </StickerBadge>
      <StickerBadge
        mode="select"
        onSelectedChange={() => undefined}
        selected
        tone="ultraviolet"
      >
        Selected
      </StickerBadge>
      <StickerBadge
        mode="remove"
        onRemove={() => undefined}
        removeLabel="Remove teen investing tag"
        tone="pink"
      >
        Teen investing
      </StickerBadge>
    </>
  );
}
