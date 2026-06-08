"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reliable scroll-into-view flag for animations. Framer Motion's whileInView with
 * once: true can miss the first intersection when layout shifts (fonts, images),
 * leaving content stuck at initial opacity: 0 until a full refresh.
 */
export function useScrollReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    const markInView = () => setInView(true);

    const onIntersect: IntersectionObserverCallback = (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        markInView();
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      threshold: [0, 0.01, 0.05, 0.12],
      rootMargin: "120px 0px 120px 0px",
    });

    observer.observe(el);

    const flush = () => {
      try {
        const records = observer.takeRecords?.();
        if (records && records.length > 0) {
          onIntersect(records, observer);
        }
      } catch {
        // ignore
      }
    };

    let raf = 0;
    if (typeof requestAnimationFrame !== "undefined") {
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(flush);
      });
    }

    const t1 = window.setTimeout(flush, 0);
    const t2 = window.setTimeout(flush, 150);
    const t3 = window.setTimeout(flush, 600);
    window.addEventListener("load", flush, { passive: true });

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("load", flush);
    };
  }, [inView]);

  return { ref, inView };
}
