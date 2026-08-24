import assert from "node:assert/strict";

const forbidden = [
  /\b(?:TODO|TBD|PLACEHOLDER)\b/iu,
  /\/Users\//u,
  /[A-Za-z]:\\Users\\/u,
  /scout-pk-version/u,
];

export function validateReleaseText(text, label) {
  assert.ok(text.trim().length >= 24, `${label} is empty or too short`);
  for (const pattern of forbidden) {
    assert.doesNotMatch(text, pattern, `${label} contains ${pattern}`);
  }
  assert.doesNotMatch(
    text,
    /(?:already|now) (?:published|available on npm)/iu,
    `${label} claims an unpublished release exists`,
  );
}
