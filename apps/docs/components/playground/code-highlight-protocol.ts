export const CODE_HIGHLIGHT_DEBOUNCE_MS = 160;
export const COPY_SUCCESS_MS = 2000;
export const CHANGED_CODE_EMPHASIS_MS = 900;

export interface HighlightToken {
  readonly color?: string;
  readonly content: string;
  readonly fontStyle?: number;
}

export interface HighlightRequest {
  readonly id: number;
  readonly language: "tsx";
  readonly source: string;
  readonly theme: "github-light";
}

export type HighlightResponse =
  | {
      readonly id: number;
      readonly lines: readonly (readonly HighlightToken[])[];
      readonly ok: true;
    }
  | { readonly id: number; readonly ok: false };

export function isCurrentHighlightResponse(
  responseId: number,
  latestRequestId: number,
): boolean {
  return responseId === latestRequestId;
}
