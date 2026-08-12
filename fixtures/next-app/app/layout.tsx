import type { Metadata } from "next";
import type { ReactNode } from "react";

// This fixture is the broad-package consumer: one stylesheet, which must
// already contain the Trail rules. Importing the standalone Trail stylesheet
// here would defeat that verification.
import "@scout-ui/react/styles.css";
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
