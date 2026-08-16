"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteFocusManager() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (window.location.hash) return;

    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>("[data-route-heading]")
        ?.focus({ preventScroll: false });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
