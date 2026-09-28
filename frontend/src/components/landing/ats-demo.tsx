"use client";

import * as React from "react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, LayoutTemplate, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { CONTAINER, Reveal, SectionHeading } from "./shared";

const OPTIMIZE_STEPS = [
  "Scanning 794 content lines…",
  "Adding missing keywords…",
  "Quantifying impact…",
  "Fixing formatting…",
] as const;

const BEFORE_LINE = "Responsible for managing social media accounts";
const AFTER_LINE = "Grew social audience 0 → 85K followers, driving 32% of signups in 6 months";

const CHECKS = [
  {
    icon: ShieldCheck,
    title: "Keyword match analysis",
    desc: "Compares your resume against the job description and flags missing terms.",
  },
  {
    icon: Zap,
    title: "Impact quantification",
    desc: "Finds duties disguised as achievements and adds the numbers recruiters want.",
  },
  {
    icon: LayoutTemplate,
    title: "Formatting & parse check",
    desc: "Ensures columns, fonts, and dates survive every ATS parser intact.",
  },
] as const;

export default function AtsDemo() {
  const [status, setStatus] = React.useState<"idle" | "running" | "done">("idle");
  const [stepIdx, setStepIdx] = React.useState(0);
  const runIdRef = React.useRef(0);
  const timersRef = React.useRef<number[]>([]);

  /* Animated score 62 → 94 */
  const score = useMotionValue(62);
  const scoreText = useTransform(score, (v) => `${Math.round(v)}`);
  const dashOffset = useTransform(score, (v) => 2 * Math.PI * 62 * (1 - v / 100));
  const ringColor = useTransform(
    score,
    [62, 80, 94],
    ["#f59e0b", "#10b981", "#10b981"]
  );

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  React.useEffect(() => {
    return () => {
      clearTimers();
      score.stop();
    };
  }, [clearTimers, score]);

  const startRun = React.useCallback(() => {
    clearTimers();
    const runId = ++runIdRef.current;
    setStatus("running");
    setStepIdx(0);
    animate(score, 94, { duration: 2.4, delay: 0.35, ease: [0.3, 0.6, 0.3, 1] });

    OPTIMIZE_STEPS.forEach((_, i) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (runIdRef.current === runId) setStepIdx(i);
        }, i * 620)
      );
    });
    timersRef.current.push(
      window.setTimeout(() => {
        if (runIdRef.current === runId) setStatus("done");
      }, OPTIMIZE_STEPS.length * 620 + 300)
    );
  }, [clearTimers, score]);

  const run = React.useCallback(() => {
    if (status === "running") return;
    if (status === "done") {
      // reset instantly, then run again
      score.stop();
      score.set(62);
      setStatus("idle");
      setStepIdx(0);
      timersRef.current.push(window.setTimeout(startRun, 350));
      return;
    }
    startRun();
  }, [status, score, startRun]);

  return (
    <section id="ats" aria-label="Interactive ATS demo" className="scroll-mt-20 border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className={CONTAINER}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left copy */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="ATS scanner"
              title="Score your resume before recruiters do"
              description="75% of resumes are rejected by software before a human ever looks. ResumeForge shows you the exact fixes that push you into the interview pile."
            />
            <div className="mt-8 space-y-5">
              {CHECKS.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.1} y={16}>
                  <div className="flex items-start gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <c.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{c.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right: interactive widget */}
          <Reveal delay={0.15}>
            <div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl shadow-black/5 sm:p-9">
              <div
                aria-hidden
                className="absolute -right-20 -top-20 size-52 rounded-full bg-emerald-500/10 blur-3xl"
              />

              <div className="relative flex flex-col items-center">
                {/* Score ring */}
                <div className="relative size-44">
                  <svg viewBox="0 0 140 140" className="size-full -rotate-90">
                    <circle cx="70" cy="70" r="62" fill="none" strokeWidth="11" className="stroke-muted" />
                    <motion.circle
                      cx="70"
                      cy="70"
                      r="62"
                      fill="none"
                      strokeWidth="11"
                      strokeLinecap="round"
                      style={{ strokeDasharray: 2 * Math.PI * 62, strokeDashoffset: dashOffset, stroke: ringColor }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={status}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="font-display text-5xl font-extrabold tracking-tight text-foreground"
                      >
                        {scoreText}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      ATS Score
                    </span>
                  </div>
                </div>

                {/* Status line */}
                <div className="mt-5 h-6 text-center">
                  <AnimatePresence mode="wait">
                    {status === "idle" && (
                      <motion.p
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-muted-foreground"
                      >
                        Your resume scored <span className="font-bold text-amber-600 dark:text-amber-400">62</span> — let&apos;s fix that.
                      </motion.p>
                    )}
                    {status === "running" && (
                      <motion.p
                        key={`step-${stepIdx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        <Sparkles className="size-4 animate-pulse" aria-hidden />
                        {OPTIMIZE_STEPS[stepIdx]}
                      </motion.p>
                    )}
                    {status === "done" && (
                      <motion.p
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        <Check className="size-4" aria-hidden />
                        Optimized — beats 91% of applicants
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <button
                  onClick={run}
                  disabled={status === "running"}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10"
                >
                  <Sparkles className="size-4" aria-hidden />
                  {status === "idle" && "Optimize with AI"}
                  {status === "running" && "Optimizing…"}
                  {status === "done" && "Run it again"}
                </button>

                {/* Before / after bullets */}
                <div className="mt-7 w-full space-y-2.5 border-t border-border/60 pt-6 text-left text-[13px] leading-relaxed">
                  <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-3.5 py-2.5">
                    <X className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden />
                    <span
                      className={
                        status === "done"
                          ? "text-muted-foreground line-through decoration-rose-400/70"
                          : "text-muted-foreground"
                      }
                    >
                      {BEFORE_LINE}
                    </span>
                  </div>
                  <AnimatePresence>
                    {status === "done" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex items-start gap-2.5 overflow-hidden rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 font-medium text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                        <span>{AFTER_LINE}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
