import { StickerStack } from "../src/index.js";
import type { StickerStackProps } from "../src/index.js";

interface Story {
  id: string;
  title: string;
}

const stories: readonly Story[] = [{ id: "one", title: "One" }];

void (
  <>
    <StickerStack
      getKey={(story) => story.id}
      items={stories}
      renderItem={(story, context) => `${story.title}-${context.index}`}
    />
    <StickerStack
      axis="y"
      defaultIndex={0}
      drag
      getKey={(story) => story.id}
      items={stories}
      keyboard
      loop
      onIndexChange={(index) => index.toFixed()}
      renderItem={(story, { active }) => (active ? story.title : null)}
      visibleCount={5}
    />
  </>
);

const validProps = {
  getKey: (story: Story) => story.id,
  items: stories,
  renderItem: (story: Story) => story.title,
  visibleCount: 2,
} satisfies StickerStackProps<Story>;
void validProps;

void (
  <StickerStack
    getKey={(story: Story) => story.id}
    items={stories}
    renderItem={(story) => story.title}
    // @ts-expect-error visibleCount is intentionally bounded to 2–5.
    visibleCount={6}
  />
);

void (
  <StickerStack
    getKey={(item: number) => item}
    // @ts-expect-error items must match the type established by getKey.
    items={stories}
    renderItem={() => null}
  />
);

void (
  <StickerStack
    getKey={(story: Story) => story.id}
    items={stories}
    // @ts-expect-error renderItem must receive the generic item type.
    renderItem={(item: number) => item}
  />
);

const missingKey = {
  items: stories,
  renderItem: (story: Story) => story.title,
  // @ts-expect-error getKey is required for stable identity.
} satisfies StickerStackProps<Story>;
void missingKey;

const invalidAxis = {
  // @ts-expect-error only x and y axes are supported.
  axis: "diagonal",
  getKey: (story: Story) => story.id,
  items: stories,
  renderItem: (story: Story) => story.title,
} satisfies StickerStackProps<Story>;
void invalidAxis;
