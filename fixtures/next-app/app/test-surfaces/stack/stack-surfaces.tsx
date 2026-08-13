"use client";

import { StickerStack } from "@scout-ui/react";
import { StickerStack as SubpathStickerStack } from "@scout-ui/react/sticker-stack";
import { useState } from "react";

interface Story {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  tone: "acid" | "cyan" | "pink" | "violet";
}

const stories = [
  {
    id: "signal",
    eyebrow: "FIELD NOTE 01",
    title: "MAKE THE ACTIVE THING OBVIOUS.",
    body: "One card owns the meaning. The others show depth without stealing focus.",
    tone: "acid",
  },
  {
    id: "rhythm",
    eyebrow: "FIELD NOTE 02",
    title: "SHUFFLE WITH A REASON.",
    body: "Buttons remain the dependable path; a swipe is an optional tactile shortcut.",
    tone: "cyan",
  },
  {
    id: "bounds",
    eyebrow: "FIELD NOTE 03",
    title: "CHAOS NEEDS A CEILING.",
    body: "The render window stays small even when the source collection is very large.",
    tone: "pink",
  },
  {
    id: "access",
    eyebrow: "FIELD NOTE 04",
    title: "THE BACKGROUND STAYS QUIET.",
    body: "Inactive controls are inert and absent from the accessibility reading path.",
    tone: "violet",
  },
  {
    id: "motion",
    eyebrow: "FIELD NOTE 05",
    title: "MOTION EXPLAINS THE REORDER.",
    body: "Reduced motion commits the same state immediately, without the flight path.",
    tone: "acid",
  },
  {
    id: "identity",
    eyebrow: "FIELD NOTE 06",
    title: "KEYS KEEP THE STORY STRAIGHT.",
    body: "Stable identity survives insertions, removals, hydration, and rerenders.",
    tone: "cyan",
  },
] as const satisfies readonly Story[];

const manyStories = Array.from({ length: 100 }, (_, index) => ({
  ...(stories[index % stories.length] ?? stories[0]),
  id: `large-${String(index)}`,
  title: `BOUNDED CARD ${String(index + 1)}.`,
}));

function StoryCard({ active, story }: { active: boolean; story: Story }) {
  return (
    <article
      className={`stack-story stack-story-${story.tone}`}
      data-story-id={story.id}
    >
      <span className="stack-story-index">{story.eyebrow}</span>
      <h3>{story.title}</h3>
      <p>{story.body}</p>
      <div className="stack-story-actions">
        <button
          data-active-card-control={active ? "true" : "false"}
          type="button"
        >
          Pin note
        </button>
        <a href={`#story-${story.id}`}>Read story</a>
        <input aria-label={`${story.title} note`} placeholder="Add a note" />
      </div>
    </article>
  );
}

function renderStory(
  story: Story,
  context: { active: boolean; index: number },
) {
  return <StoryCard active={context.active} story={story} />;
}

const getStoryKey = (story: Story) => story.id;

export function StackSurfaces() {
  const [callbackCount, setCallbackCount] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [controlledIndex, setControlledIndex] = useState(1);
  const [controlledCount, setControlledCount] = useState(0);
  const [refusedCount, setRefusedCount] = useState(0);
  const [dynamicStories, setDynamicStories] =
    useState<readonly Story[]>(stories);
  const [disabled, setDisabled] = useState(false);

  return (
    <main className="sui-theme stack-gallery">
      <header className="stack-hero">
        <p>SCOUT UI ENGINEERING SURFACE / M9</p>
        <h1>KEEP THE STORY ON TOP.</h1>
        <p>
          A bounded, tactile deck with semantic controls and one active layer.
        </p>
      </header>

      <section
        aria-labelledby="stack-core-heading"
        className="stack-board stack-board-night"
      >
        <div className="stack-board-heading">
          <p>THE PRIMARY PROOF</p>
          <h2 id="stack-core-heading">Controlled chaos, one card at a time.</h2>
        </div>
        <StickerStack
          data-testid="stack-main"
          defaultIndex={0}
          drag
          getKey={getStoryKey}
          items={manyStories}
          keyboard
          onIndexChange={(nextIndex) => {
            setCallbackCount((value) => value + 1);
            setLastIndex(nextIndex);
          }}
          renderItem={renderStory}
        />
        <output data-testid="stack-main-callback-count">{callbackCount}</output>
        <output data-testid="stack-main-last-index">{lastIndex}</output>
      </section>

      <section aria-labelledby="stack-count-heading" className="stack-board">
        <div className="stack-board-heading">
          <p>BOUNDED WINDOWS</p>
          <h2 id="stack-count-heading">
            Two layers. Five layers. Never the whole list.
          </h2>
        </div>
        <div className="stack-grid">
          <SubpathStickerStack
            data-testid="stack-visible-2"
            getKey={getStoryKey}
            items={stories}
            renderItem={renderStory}
            visibleCount={2}
          />
          <StickerStack
            data-testid="stack-visible-5"
            defaultIndex={2}
            getKey={getStoryKey}
            items={stories}
            renderItem={renderStory}
            visibleCount={5}
          />
        </div>
      </section>

      <section
        aria-labelledby="stack-axis-heading"
        className="stack-board stack-board-cyan"
      >
        <div className="stack-board-heading">
          <p>TWO DIRECTIONS</p>
          <h2 id="stack-axis-heading">
            Horizontal stories, vertical field notes.
          </h2>
        </div>
        <div className="stack-grid">
          <StickerStack
            data-testid="stack-vertical"
            axis="y"
            defaultIndex={1}
            drag
            getKey={getStoryKey}
            items={stories}
            keyboard
            renderItem={renderStory}
          />
          <StickerStack
            data-testid="stack-loop"
            defaultIndex={stories.length - 1}
            getKey={getStoryKey}
            items={stories}
            loop
            renderItem={renderStory}
          />
        </div>
      </section>

      <section aria-labelledby="stack-state-heading" className="stack-board">
        <div className="stack-board-heading">
          <p>STATE INTEGRITY</p>
          <h2 id="stack-state-heading">Parents stay authoritative.</h2>
        </div>
        <div className="stack-fixture-actions">
          <button
            data-testid="stack-controlled-external"
            onClick={() => {
              setControlledIndex((value) => (value + 1) % stories.length);
            }}
            type="button"
          >
            Change controlled index
          </button>
          <button
            data-testid="stack-toggle-disabled"
            onClick={() => {
              setDisabled((value) => !value);
            }}
            type="button"
          >
            Toggle disabled
          </button>
        </div>
        <div className="stack-grid">
          <div>
            <output data-testid="stack-controlled-count">
              {controlledCount}
            </output>
            <StickerStack
              data-testid="stack-controlled"
              disabled={disabled}
              drag
              getKey={getStoryKey}
              index={controlledIndex}
              items={stories}
              onIndexChange={(nextIndex) => {
                setControlledCount((value) => value + 1);
                setControlledIndex(nextIndex);
              }}
              renderItem={renderStory}
            />
          </div>
          <div>
            <output data-testid="stack-refused-count">{refusedCount}</output>
            <StickerStack
              data-testid="stack-refused"
              getKey={getStoryKey}
              index={1}
              items={stories}
              onIndexChange={() => {
                setRefusedCount((value) => value + 1);
              }}
              renderItem={renderStory}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="stack-dynamic-heading" className="stack-board">
        <div className="stack-board-heading">
          <p>DYNAMIC DATA</p>
          <h2 id="stack-dynamic-heading">
            The collection can change underneath it.
          </h2>
        </div>
        <div className="stack-fixture-actions">
          <button
            data-testid="stack-remove-active"
            onClick={() => {
              setDynamicStories((current) => current.slice(1));
            }}
            type="button"
          >
            Remove first
          </button>
          <button
            data-testid="stack-empty-items"
            onClick={() => {
              setDynamicStories([]);
            }}
            type="button"
          >
            Empty items
          </button>
          <button
            data-testid="stack-restore-items"
            onClick={() => {
              setDynamicStories(stories);
            }}
            type="button"
          >
            Restore items
          </button>
        </div>
        <StickerStack
          data-testid="stack-dynamic"
          defaultIndex={2}
          drag
          empty={<p className="stack-empty-note">NO NOTES ARE STUCK YET.</p>}
          getKey={getStoryKey}
          items={dynamicStories}
          renderItem={renderStory}
        />
      </section>

      <section
        aria-labelledby="stack-edge-heading"
        className="stack-board stack-edge-grid"
      >
        <h2 id="stack-edge-heading">Edges and alternatives</h2>
        <StickerStack
          data-testid="stack-one"
          getKey={getStoryKey}
          items={stories.slice(0, 1)}
          loop
          renderItem={renderStory}
          visibleCount={5}
        />
        <StickerStack
          data-testid="stack-empty"
          empty={<p className="stack-empty-note">NOTHING STUCK HERE.</p>}
          getKey={getStoryKey}
          items={[]}
          renderItem={renderStory}
        />
        <StickerStack
          className="stack-long"
          data-testid="stack-long"
          getKey={getStoryKey}
          items={[
            {
              ...stories[0],
              body: "This deliberately long card proves that ordinary flowing consumer content remains readable at narrow widths, at large browser text sizes, and at two hundred percent zoom without turning the deck into a clipped poster or causing two-dimensional page scrolling.",
              id: "long-story",
              title:
                "LONG CONTENT STILL BELONGS TO THE DOCUMENT, NOT THE EFFECT.",
            },
            stories[1],
          ]}
          renderItem={renderStory}
        />
        <StickerStack
          data-testid="stack-reduced-always"
          getKey={getStoryKey}
          items={stories}
          reducedMotion="always"
          renderItem={renderStory}
        />
      </section>
      <div id="stack-fixture-end" />
    </main>
  );
}
