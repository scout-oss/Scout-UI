import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@scout-ui/react/styles.css";
import "@scout-ui/sticker-trail/styles.css";
import "./fixture.css";

export const metadata: Metadata = {
  title: "Scout UI Next.js consumer fixture",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
