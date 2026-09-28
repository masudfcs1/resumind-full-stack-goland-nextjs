"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Gauge, PenLine, TriangleAlert, type LucideIcon } from "lucide-react";

import { GradientButton } from "./shared";

/* ------------------------------------------------------------------ */
/* Interactive "resume score" mini-demo for the hero.                  */
/*                                                                     */
/* Hydration safety: SSR renders a fully deterministic state — fixed   */
/* slider defaults (62/48/70 → composite 59, "Strong draft") and a     */
/* MotionValue seeded with that same composite. No Math.random, no     */
/* Date.now, no mounted-gating needed (native range inputs are SSR     */
/* safe). Interaction is live as soon as the page hydrates.            */
/*                                                                     */
/* Visually distinct from the AtsDemo section further down the page:   */
/* that one is a large rounded-3xl card with a size-44 ring whose arc  */
/* animates amber→emerald plus a CTA button; this one is a compact     */
/* glassy card with three sliders and a constant emerald arc on a zinc */
/* track, driven directly by user input.                               */
/* ------------------------------------------------------------------ */

const WEIGHTS = { keywords: 0.4, verbs: 0.35, formatting: 0.25 } as const;

const DEFAULTS = { keywords: 62, verbs: 48, formatting: 70 } as const;

type ScoreKey = keyof typeof WEIGHTS;

const SLIDERS: { key: ScoreKey; label: string }[] = [
  { key: "keywords", label: "Keywords matched" },
  { key: "verbs", label: "Impact & action verbs" },
  { key: "formatting", label: "Formatting cleanliness" },
];

const TIPS: Record<ScoreKey, string> = {
  keywords: "add more role keywords to pass ATS filters",
  verbs: "swap in stronger action verbs and quantify impact",
  formatting: "simplify formatting so parsers read every section",
};

/** Deterministic weighted composite (40/35/25), rounded to an integer. */
function compositeScore(v: Record<ScoreKey, number>) {
  return Math.round(v.keywords * WEIGHTS.keywords + v.verbs * WEIGHTS.verbs + v.formatting * WEIGHTS.formatting);
}

interface Verdict {
  label: string;
  icon: LucideIcon;
  cls: string;
}

function verdictFor(score: number): Verdict {
  if (score < 55)
    return {
      label: "Needs work",
      icon: TriangleAlert,
      cls: "text-amber-600 dark:text-amber-400",
    };
  if (score >= 75)
    return {
      label: "Interview-ready",
      icon: BadgeCheck,
      cls: "text-emerald-600 dark:text-emerald-400",
    };
  return {
    label: "Strong draft",
    icon: PenLine,
    cls: "text-zinc-600 dark:text-zinc-300",
  };
}

/* Ring geometry (viewBox 0 0 120 120) */
const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

export default function HeroScoreDemo() {
  const [values, setValues] = React.useState<Record<ScoreKey, number>>({ ...DEFAULTS });
  const reduced = useReducedMotion();

  const composite = compositeScore(values);
  const verdict = verdictFor(composite);
  const VerdictIcon = verdict.icon;

  // Funnel into the real scanner: carries the current slider values via URL
  // params (keywords/impact/clarity = the three sliders in order). The ATS
  // page detects flow=demo and continues from this quick estimate.
  const demoScanHref = `/dashboard/ats?flow=demo&keywords=${values.keywords}&impact=${values.verbs}&clarity=${values.formatting}`;

  // Lowest input drives the tip; reduce() keeps the earliest slider on ties
  // so the mapping stays deterministic for any combination of values.
  const lowestKey = (Object.keys(values) as ScoreKey[]).reduce((a, b) => (values[b] < values[a] ? b : a));

  // Animated readout: seeded with the deterministic default so SSR markup and
  // first client render match exactly (59 → "Strong draft").
  const scoreMv = useMotionValue(compositeScore({ ...DEFAULTS }));
  const scoreText = useTransform(scoreMv, (v) => `${Math.round(v)}`);
  const dashOffset = useTransform(scoreMv, (v) => CIRC * (1 - v / 100));

  React.useEffect(() => {
    // Reduced motion: jump straight to the value — no tween at all.
    if (reduced) {
      scoreMv.jump(composite);
      return;
    }
    const controls = animate(scoreMv, composite, { duration: 0.45, ease: "easeOut" });
    return () => controls.stop();
  }, [composite, reduced, scoreMv]);

  const onSlide = (key: ScoreKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.currentTarget.value);
    setValues((prev) => (prev[key] === next ? prev : { ...prev, [key]: next }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { delay: 0.85, duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div
        data-score-demo
        data-score-value={composite}
        data-score-verdict={verdict.label}
        role="group"
        aria-label="Interactive resume score demo — drag the sliders to see the composite score react"
        className="rounded-2xl border border-border bg-background/80 p-5 shadow-[0_10px_40px_-14px_rgba(16,185,129,0.35)] backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Gauge className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-foreground">Live resume score</p>
              <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                Drag a slider — the gauge reacts
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 sm:inline-flex">
            Try it
          </span>
        </div>

        {/* Sliders + gauge */}
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
          {/* Sliders */}
          <div className="w-full min-w-0 space-y-3.5 sm:flex-1">
            {SLIDERS.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`score-demo-${key}`} className="text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <span aria-hidden className="text-xs font-bold tabular-nums text-foreground">
                    {values[key]}
                  </span>
                </div>
                <input
                  id={`score-demo-${key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={values[key]}
                  onChange={onSlide(key)}
                  aria-label={label}
                  className="mt-1.5 h-6 w-full cursor-pointer accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </div>
            ))}
          </div>

          {/* Gauge */}
          <div
            role="img"
            aria-label={`Composite resume score ${composite} of 100 — ${verdict.label}`}
            className="flex w-full shrink-0 flex-col items-center justify-center sm:w-[152px]"
          >
            <div className="relative size-28">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="10"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="stroke-emerald-500 dark:stroke-emerald-400"
                  style={{ strokeDasharray: CIRC, strokeDashoffset: dashOffset }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span className="text-3xl font-semibold tabular-nums text-foreground">
                  {scoreText}
                </motion.span>
              </div>
            </div>
            {/* Verdict — fixed-height row so label flips never shift layout */}
            <p className="mt-2.5 flex h-5 items-center justify-center gap-1.5">
              <VerdictIcon className={`size-3.5 shrink-0 ${verdict.cls}`} aria-hidden />
              <span className={`text-xs font-bold ${verdict.cls}`}>{verdict.label}</span>
            </p>
          </div>
        </div>

        {/* Dynamic tip — reflects the LOWEST input */}
        <p className="mt-3.5 min-h-4 border-t border-border/60 pt-3 text-xs leading-snug text-muted-foreground">
          <span className="font-semibold text-foreground/70">Tip:</span>{" "}
          <span className="align-middle">{TIPS[lowestKey]}</span>
        </p>

        {/* CTA into the real scanner — always carries the live slider values */}
        <GradientButton
          href={demoScanHref}
          className="mt-4 h-9 w-full gap-1.5 rounded-lg px-4 text-xs sm:h-10 sm:w-auto sm:text-sm"
        >
          Run the real scan
          <ArrowRight className="size-4" aria-hidden />
        </GradientButton>
      </div>
    </motion.div>
  );
}
