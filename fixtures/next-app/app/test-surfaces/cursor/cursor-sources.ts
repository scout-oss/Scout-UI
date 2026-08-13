function svg(body: string, size = 48) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(size)} ${String(size)}">${body}</svg>`,
  )}`;
}

/**
 * Inline sources: no network, no decode latency variance, so a readiness or
 * hotspot assertion never races an image load.
 */
export const cursorSources = {
  active: {
    id: "cursor-active",
    src: svg('<circle cx="24" cy="24" r="20" fill="#ff3d9a"/>'),
    width: 48,
    height: 48,
  },
  default: {
    id: "cursor-default",
    src: svg('<circle cx="24" cy="24" r="20" fill="#7c2cff"/>'),
    width: 48,
    height: 48,
  },
  hover: {
    id: "cursor-hover",
    src: svg('<circle cx="24" cy="24" r="20" fill="#d4ff5f"/>'),
    width: 48,
    height: 48,
  },
  sparkle: {
    id: "cursor-sparkle",
    src: svg('<circle cx="24" cy="24" r="20" fill="#61dbe8"/>'),
    width: 48,
    height: 48,
  },
  /** A deliberately tall visual, for hotspot stability across aspect ratios. */
  tall: {
    id: "cursor-tall",
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 96"><rect width="24" height="96" fill="#1664ff"/></svg>',
    )}`,
    width: 24,
    height: 96,
  },
} as const;

/** A URL that cannot decode, for the asset-failure policy. */
export const brokenSource = {
  id: "cursor-broken",
  src: "/this-cursor-asset-does-not-exist.png",
  width: 48,
  height: 48,
};
