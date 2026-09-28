"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTAINER, Eyebrow, Reveal } from "./shared";

/* ---------------------------------------------------------------- */
/* Data                                                              */
/* ---------------------------------------------------------------- */

interface Testimonial {
  name: string;
  initials: string;
  role: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    initials: "MC",
    role: "Senior Full-Stack Engineer @ a fintech scale-up",
    quote:
      "The scanner flagged keyword gaps I couldn't see after ten rounds of self-editing. Rewrote three bullets, score jumped 61 to 89, and I had two onsite invites the same week.",
  },
  {
    name: "David Okafor",
    initials: "DO",
    role: "Career switcher, now Junior Dev @ a healthtech startup",
    quote:
      "Eight years of teaching gave me real skills nobody could see on my old resume. ResumeForge translated classroom wins into engineering bullets — that's the version that finally got replies.",
  },
  {
    name: "Priya Raman",
    initials: "PR",
    role: "Product Manager @ a B2B SaaS company",
    quote:
      "I tailor for every posting now. The diff view shows exactly which metrics and keywords each JD wants, and my callback rate went from one in twenty to one in three.",
  },
  {
    name: "Tomás Alvarez",
    initials: "TA",
    role: "Frontend Engineer @ an e-commerce platform",
    quote:
      "Recruiters quote the formatting back at me. Two screening calls in a row opened with a compliment about the resume before I had said a word — the templates just read cleanly.",
  },
  {
    name: "Sara Lindqvist",
    initials: "SL",
    role: "Backend Engineer @ a payments provider",
    quote:
      "I treated the score like a game. 58 to 86 across a weekend, mostly by cutting fluff and quantifying impact. The weakest-bullet hints are unreasonably good.",
  },
  {
    name: "James Carter",
    initials: "JC",
    role: "Graduate Software Engineer @ a telecom",
    quote:
      "As a new grad I had one page and no idea what mattered. Three tailored versions in a single evening — that evening is what landed my first interview.",
  },
  {
    name: "Lena Fischer",
    initials: "LF",
    role: "Engineering Manager @ a logistics unicorn",
    quote:
      "I read resumes for a living. Candidates whose resumes parse this cleanly in our own ATS actually get read; the rest get skimmed. It really is that mechanical.",
  },
];

/** Auto-advance cadence (ms). */
const AUTO_ADVANCE_MS = 6_000;
/** After manual navigation, auto-advance stays off for this long (ms). */
const IDLE_RESUME_MS = 18_000;

/* Direction-aware slide variants. AnimatePresence feeds the CURRENT
   custom value to exiting children, so the old slide always leaves
   opposite the direction of travel. */
type SlideCustom = { dir: number; reduced: boolean };

const SLIDE_VARIANTS: Variants = {
  enter: ({ dir, reduced }: SlideCustom) => ({
    x: reduced ? 0 : dir >= 0 ? 72 : -72,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: ({ dir, reduced }: SlideCustom) => ({
    x: reduced ? 0 : dir >= 0 ? -72 : 72,
    opacity: 0,
  }),
};

/* ---------------------------------------------------------------- */

export default function Testimonials() {
  const reduced = useReducedMotion();

  const sectionRef = React.useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "-120px 0px" });

  // Deterministic start: index 0 on the server AND the first client
  // render, so SSR markup and hydration agree.
  const [[index, direction], setPage] = React.useState<[number, number]>([0, 0]);

  // paused: pointer is over the section, or keyboard focus is inside it.
  // hold: a manual interaction silenced auto-advance (resumes after idle).
  const [paused, setPaused] = React.useState(false);
  const [hold, setHold] = React.useState(false);
  const holdTimer = React.useRef<number | null>(null);

  const count = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];

  /* Manual navigation. Design decision (documented): manual interaction
     CLEARS auto-advance, then it RESUMES after 18s of idleness — chosen
     over "never resume" so the section stays alive for passive readers
     while never fighting a user who is actively exploring. */
  const goTo = React.useCallback(
    (next: number, dir: number) => {
      setPage([((next % count) + count) % count, dir]);
      setHold(true);
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => setHold(false), IDLE_RESUME_MS);
    },
    [count]
  );

  React.useEffect(() => {
    return () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    };
  }, []);

  // Auto-advance every 6s while the section is on screen, not hovered /
  // focused, and outside the manual-interaction hold. With
  // prefers-reduced-motion there is no auto-advance at all — swaps are
  // instant and strictly user-driven.
  React.useEffect(() => {
    if (reduced || paused || hold || !inView) return;
    const id = window.setInterval(() => {
      setPage(([i]) => [(i + 1) % count, 1] as [number, number]);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, hold, inView, count]);

  const arrowClass =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border bg-card text-foreground shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 dark:hover:text-emerald-400";

  const dots = (keyPrefix: string) => (
    <div className="flex items-center gap-1" role="group" aria-label="Choose a testimonial">
      {TESTIMONIALS.map((t, i) => (
        <button
          key={`${keyPrefix}-${t.name}`}
          type="button"
          data-dot-index={i}
          aria-label={`Testimonial ${i + 1} of ${count}: ${t.name}, ${t.role}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => goTo(i, i === index ? direction : i > index ? 1 : -1)}
          className="inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === index
                ? "w-6 bg-emerald-500 dark:bg-emerald-400"
                : "w-2 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      aria-labelledby="testimonials-heading"
      className="py-20 sm:py-28"
    >
      <div className={CONTAINER}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Wall of love</Eyebrow>
          <h2
            id="testimonials-heading"
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            2.1 million resumes, one common reaction
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Real stories from people who stopped getting ghosted and started
            getting callbacks.
          </p>
        </Reveal>

        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Slide viewport */}
          <div
            className="relative mx-auto max-w-2xl overflow-hidden"
            aria-roledescription="carousel"
            aria-label="Customer testimonials"
          >
            <AnimatePresence initial={false} mode="popLayout" custom={{ dir: direction, reduced: Boolean(reduced) }}>
              <motion.figure
                key={index}
                data-slide-index={index}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                custom={{ dir: direction, reduced: Boolean(reduced) }}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduced ? 0 : 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex min-h-[340px] flex-col rounded-2xl border bg-card p-6 shadow-sm transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 sm:min-h-[270px] sm:p-8 dark:hover:shadow-emerald-500/5 lg:min-h-[250px]"
              >
                <div
                  className="flex items-center gap-0.5"
                  role="img"
                  aria-label="Rated 5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className="size-4 fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400"
                    />
                  ))}
                </div>

                <blockquote className="mt-5 text-base leading-relaxed text-foreground/90 sm:text-lg">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>

                <figcaption className="mt-auto flex items-center gap-3 border-t border-border/60 pt-5">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm dark:from-emerald-600 dark:to-teal-700"
                  >
                    {current.initials}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{current.name}</p>
                    <p className="text-xs text-muted-foreground">{current.role}</p>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Screen-reader announcement of the active slide */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            Testimonial {index + 1} of {count}: {current.name}, {current.role}
          </p>

          {/* Controls — mobile: dots above, arrows below (44px targets) */}
          <div className="mt-6 flex flex-col items-center gap-3 sm:hidden">
            {dots("m")}
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => goTo(index - 1, -1)}
                aria-label="Previous testimonial"
                className={arrowClass}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1, 1)}
                aria-label="Next testimonial"
                className={arrowClass}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Controls — sm and up: single row, arrows flanking the dots */}
          <div className="mt-8 hidden items-center justify-center gap-5 sm:flex">
            <button
              type="button"
              onClick={() => goTo(index - 1, -1)}
              aria-label="Previous testimonial"
              className={arrowClass}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            {dots("d")}
            <button
              type="button"
              onClick={() => goTo(index + 1, 1)}
              aria-label="Next testimonial"
              className={arrowClass}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
