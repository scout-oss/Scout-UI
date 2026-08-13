"use client";

import { StickerButton, StickerCursor } from "@scout-ui/react";
import { useState, useSyncExternalStore } from "react";

import { cursorSources } from "./cursor-sources";

const baseVisuals = {
  active: { source: cursorSources.active },
  default: { source: cursorSources.default },
  hover: { source: cursorSources.hover },
  sparkle: { source: cursorSources.sparkle },
};

const NATIVE_MEDIA_CONTROLS_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToNativeMediaControls(onChange: () => void) {
  const query = window.matchMedia(NATIVE_MEDIA_CONTROLS_QUERY);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

function readNativeMediaControlsCapability() {
  return window.matchMedia(NATIVE_MEDIA_CONTROLS_QUERY).matches;
}

function readServerNativeMediaControlsCapability() {
  return false;
}

/**
 * Every element a cursor must leave alone, in one region, so bypass behaviour
 * can be checked against real markup rather than synthetic stubs.
 */
function BypassSurface() {
  const showNativeMediaControls = useSyncExternalStore(
    subscribeToNativeMediaControls,
    readNativeMediaControlsCapability,
    readServerNativeMediaControlsCapability,
  );

  return (
    <section aria-labelledby="bypass-heading">
      <h2 id="bypass-heading">Bypass surface</h2>
      <StickerCursor
        className="cursor-box"
        data-testid="bypass-cursor"
        disabledSelector=".cursor-disabled-region"
        visuals={baseVisuals}
      >
        <p data-testid="bypass-text">
          Ordinary prose keeps the custom cursor and stays selectable.
        </p>

        <a data-testid="bypass-link" href="#bypass-heading">
          A link keeps the custom cursor
        </a>
        <button data-testid="bypass-button" type="button">
          A button keeps the custom cursor
        </button>
        <StickerButton data-testid="bypass-sticker-button" type="button">
          StickerButton
        </StickerButton>

        <label htmlFor="bypass-input">Text input</label>
        <input data-testid="bypass-input" id="bypass-input" type="text" />
        <label htmlFor="bypass-search">Search input</label>
        <input data-testid="bypass-search" id="bypass-search" type="search" />
        <label htmlFor="bypass-checkbox">
          Checkbox keeps the custom cursor
        </label>
        <input
          data-testid="bypass-checkbox"
          id="bypass-checkbox"
          type="checkbox"
        />
        <label htmlFor="bypass-textarea">Textarea</label>
        <textarea data-testid="bypass-textarea" id="bypass-textarea" rows={2} />

        <div
          aria-label="Editable region"
          contentEditable
          data-testid="bypass-contenteditable"
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        >
          Contenteditable region
        </div>

        {showNativeMediaControls ? (
          // Desktop validates real user-agent media controls. Mobile WebKit's
          // empty video control draws private placard icons and emits browser
          // console errors, so coarse/non-hover fixtures use the equivalent
          // explicit native boundary without initializing those controls.
          // eslint-disable-next-line jsx-a11y/media-has-caption -- fixture media has no audio track.
          <video controls data-testid="bypass-media" height={80} width={140} />
        ) : (
          <div data-sticker-cursor="native" data-testid="bypass-media">
            Native media controls
          </div>
        )}

        <div data-sticker-cursor="native" data-testid="bypass-native">
          <p>Explicit native region</p>
          <span data-testid="bypass-native-nested">
            A nested descendant is native too
          </span>
          {/* A custom annotation nested inside a native region must not win. */}
          <span data-sticker-cursor="sparkle" data-testid="bypass-native-inner">
            Nested custom annotation
          </span>
        </div>

        <div className="cursor-disabled-region" data-testid="bypass-disabled">
          Disabled-selector region
        </div>

        <div data-sticker-cursor="sparkle" data-testid="bypass-custom">
          <span data-testid="bypass-custom-nested">Custom state region</span>
        </div>
      </StickerCursor>
    </section>
  );
}

export function CursorSurfaces() {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <BypassSurface />

      <section aria-labelledby="never-heading">
        <h2 id="never-heading">hideNative=&quot;never&quot;</h2>
        <StickerCursor
          className="cursor-box cursor-box-compact"
          data-testid="never-cursor"
          hideNative="never"
          visuals={baseVisuals}
        >
          <p>The custom visual is an enhancement; the native cursor stays.</p>
        </StickerCursor>
      </section>

      <section aria-labelledby="echo-heading">
        <h2 id="echo-heading">Echo feedback</h2>
        <StickerCursor
          className="cursor-box cursor-box-compact"
          clickFeedback="echo"
          data-testid="echo-cursor"
          visuals={baseVisuals}
        >
          <button
            data-testid="echo-target"
            onClick={() => {
              setClicks((value) => value + 1);
            }}
            type="button"
          >
            Clicks: {clicks}
          </button>
        </StickerCursor>
      </section>

      <section aria-labelledby="disabled-heading">
        <h2 id="disabled-heading">Disabled cursor</h2>
        <StickerCursor
          className="cursor-box cursor-box-compact"
          data-testid="disabled-cursor"
          enabled={false}
          visuals={baseVisuals}
        >
          <p>A disabled cursor attaches no movement loop.</p>
        </StickerCursor>
      </section>
    </>
  );
}
