"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* BackToTop — floating button that appears once the reader is past the hero.
 * Bottom-right (mirrors the fixed QA badge on the bottom-left), smooth-scrolls
 * to the top, and jumps instantly under prefers-reduced-motion. Hidden from
 * assistive tech until visible so keyboard users never tab to a no-op. */

export default function BackToTop() {
  const [visible, setVisible] = React.useState(false);
  const reduced = React.useRef(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;

    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      data-back-to-top
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label="Back to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: reduced.current ? "auto" : "smooth",
        })
      }
      className={cn(
        "fixed bottom-5 right-5 z-40 flex size-11 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-zinc-900/90 dark:hover:text-emerald-400 sm:bottom-6 sm:right-6",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
