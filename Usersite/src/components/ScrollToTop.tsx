"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isDashboardPath } from "@/lib/utils";

const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Dashboard scrolls inside `<main>`; `window.scrollTo` on mobile can fight
    // overflow locks and feel like a full-page refresh.
    if (isDashboardPath(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
