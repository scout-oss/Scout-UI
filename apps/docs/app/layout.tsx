import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@scout-ui/react/styles.css";
import "./globals.css";

import { DocsNavbar } from "../components/docs-navbar";
import { Footer } from "../components/footer";
import { RouteFocusManager } from "../components/route-focus-manager";
import { siteOrigin } from "../lib/site";

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: "Scout UI — The open-source sticker UI library",
    template: "%s — Scout UI",
  },
  description:
    "Sticker-native React primitives engineered for accessibility, performance, and controlled chaos.",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="sui-docs-skip-link" href="#main-content">
          Skip to content
        </a>
        <DocsNavbar />
        <RouteFocusManager />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
