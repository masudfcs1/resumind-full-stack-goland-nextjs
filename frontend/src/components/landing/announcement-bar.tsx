"use client";

import * as React from "react";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { scrollToId } from "./shared";

/* AnnouncementBar — a classic SaaS trust element above the navbar.
 *
 * Dismissal state lives in sessionStorage ("rf-announcement-dismissed") and is
 * read in an effect AFTER mount: the server (and first client render) always
 * renders the bar visible, so there is no hydration divergence — a dismissed
 * bar simply disappears right after hydration, once per browser session.
 *
 * The whole band is a single CTA that smooth-scrolls to the ATS section; the
 * dismiss button sits inside but stops propagation. */

const STORAGE_KEY = "rf-announcement-dismissed-v1";

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      /* storage unavailable — keep the bar visible */
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode — dismissal for this visit only */
    }
  }, []);

  if (dismissed) return null;

  return (
    <div
      data-announcement-bar
      className="relative z-[60] bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white dark:from-emerald-800 dark:via-emerald-700 dark:to-teal-800"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2.5 px-10 py-2 text-center sm:gap-3 sm:px-6 lg:px-8">
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] sm:inline-flex">
          <Megaphone className="size-3" aria-hidden />
          New
        </span>
        <a
          href="#ats"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("ats");
          }}
          className="group inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold sm:text-[13px]"
        >
          <span className="truncate">
            Keyword Gap Analyzer is live — see the exact keywords your resume
            is missing
          </span>
          <ArrowRight
            className="size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
