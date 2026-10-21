import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "@scout-ui/react/styles.css";
import "./globals.css";
import "./kinetic.css";
import "./gallery.css";

import { DocsNavbar } from "../components/docs-navbar";
import { Footer } from "../components/footer";
import { RevealObserver } from "../components/kinetic/reveal-observer";
import { RouteFocusManager } from "../components/route-focus-manager";
import { siteOrigin } from "../lib/site";

// Self-hosted OFL variable fonts (SCOUT_UI_DESIGN_SYSTEM.md §6.1). Bricolage
// carries the opsz, wdth, and wght axes that the kinetic display type drives.
// `optional` + preload: the faces are used when they arrive within the first
// paint window and never swap in later, so text can never shift layout (the
// docs geometry and CLS checks depend on that).
const displayFont = localFont({
  adjustFontFallback: "Arial",
  display: "optional",
  src: "../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2",
  variable: "--sui-docs-font-display",
  weight: "200 800",
});

// The giant hero word only: `block`, so it is never painted in the wider
// fallback face (which overflowed the measure before hydration). Same file,
// same download; the rest of the site keeps `optional` to avoid text shifts.
const heroFont = localFont({
  display: "block",
  src: "../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2",
  variable: "--sui-docs-font-hero",
  weight: "200 800",
});

const bodyFont = localFont({
  adjustFontFallback: "Arial",
  display: "optional",
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--sui-docs-font-body",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: "Scout UI — The open-source sticker UI library",
    template: "%s — Scout UI",
  },
  description:
    "Sticker-native React primitives engineered for accessibility, performance, and controlled chaos.",
  applicationName: "Scout UI",
  authors: [{ name: "Scout OSS", url: "https://github.com/scout-oss" }],
  creator: "Scout OSS",
  keywords: [
    "React",
    "component library",
    "stickers",
    "accessible UI",
    "Scout UI",
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html
      className={`${displayFont.variable} ${heroFont.variable} ${bodyFont.variable}`}
      lang="en"
    >
      <body>
        <a className="sui-docs-skip-link" href="#main-content">
          Skip to content
        </a>
        <DocsNavbar />
        <RouteFocusManager />
        <RevealObserver />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
