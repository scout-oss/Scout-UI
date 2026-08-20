import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import tsx from "@shikijs/langs/tsx";
import githubLight from "@shikijs/themes/github-light";

import type {
  HighlightRequest,
  HighlightResponse,
} from "./code-highlight-protocol";

const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [tsx],
  themes: [githubLight],
});

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<HighlightRequest>) => void) | null;
  postMessage: (response: HighlightResponse) => void;
};

workerScope.onmessage = (event) => {
  const request = event.data;
  void highlighter
    .then((instance) =>
      instance.codeToTokens(request.source, {
        lang: request.language,
        theme: request.theme,
      }),
    )
    .then((result) => {
      const lines = result.tokens.map((tokens) =>
        tokens.map((token) => ({
          content: token.content,
          ...(token.color === undefined ? {} : { color: token.color }),
          ...(token.fontStyle === undefined
            ? {}
            : { fontStyle: token.fontStyle }),
        })),
      );
      const expectedLineCount = request.source.split("\n").length;
      while (lines.length < expectedLineCount) lines.push([]);
      workerScope.postMessage({
        id: request.id,
        lines,
        ok: true,
      });
    })
    .catch(() => {
      workerScope.postMessage({ id: request.id, ok: false });
    });
};
