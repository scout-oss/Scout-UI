import { chunkyCheck } from "@scout-ui/stickers/definitions/chunky-check";
import { sparklePop } from "@scout-ui/stickers/definitions/sparkle-pop";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";

/**
 * Official pack definitions used directly as trail sources. This is the
 * structural-compatibility proof: neither package depends on the other.
 */
export const officialSources = [wonkyStar, sparklePop, chunkyCheck];

function square(fill: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="${fill}"/></svg>`,
  )}`;
}

/**
 * Inline sources for measurement surfaces: no network, no decode latency, so a
 * coordinate or ceiling assertion never races an image load.
 */
export const probeSources = [
  { id: "probe-a", src: square("#7c2cff"), width: 24, height: 24 },
  { id: "probe-b", src: square("#d4ff5f"), width: 24, height: 24 },
  { id: "probe-c", src: square("#61dbe8"), width: 24, height: 24 },
];
