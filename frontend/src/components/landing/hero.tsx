"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Play, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import ResumePreview from "@/components/resume/resume-preview";
import HeroScoreDemo from "./hero-score-demo";
import { useResumeStore, type ResumeData } from "@/lib/resume-store";
import { useAuthStore } from "@/lib/auth-store";
import { useMounted } from "@/lib/use-mounted";
import { CONTAINER, GradientButton } from "./shared";

/* ---------------- Avatar cluster ---------------- */
const AVATARS = [
  { initials: "AC", gradient: "from-emerald-500 to-teal-600" },
  { initials: "MR", gradient: "from-teal-500 to-emerald-600" },
  { initials: "DK", gradient: "from-amber-500 to-orange-600" },
  { initials: "SP", gradient: "from-rose-500 to-pink-600" },
  { initials: "EV", gradient: "from-violet-500 to-purple-600" },
] as const;

// Label-based variants: whileInView fires reliably for first-render motion
// components (inline-object whileInView inside the hero's variant tree does
// not activate, so the cluster is also kept out of that tree).
const avatarItem = {
  hidden: { opacity: 0, y: 8 },
  pop: { opacity: 1, y: 0 },
};

function clsFor(a: (typeof AVATARS)[number]) {
  return `flex size-8 items-center justify-center rounded-full bg-gradient-to-br ${a.gradient} text-[10px] font-bold text-white ring-2 ring-background`;
}

function AvatarCluster() {
  // Under prefers-reduced-motion the pop resolves instantly (duration 0; y is
  // additionally disabled by the page-level MotionConfig reducedMotion="user"),
  // so the cluster renders static without any hydration-sensitive branching.
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex -space-x-2" aria-hidden>
        {AVATARS.map((a, i) => (
          <motion.span
            key={a.initials}
            className={clsFor(a)}
            variants={avatarItem}
            initial="hidden"
            whileInView="pop"
            viewport={{ once: true, margin: "-20px" }}
            transition={
              reduced
                ? { duration: 0 }
                : { delay: 0.45 + i * 0.06, duration: 0.35, ease: "easeOut" }
            }
          >
            {a.initials}
          </motion.span>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums text-foreground">4.9/5</span>
        </div>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          Trusted by <span className="font-bold text-foreground">40,000+</span> job seekers
        </p>
      </div>
    </div>
  );
}

/* ---------------- Floating resume stack ---------------- */
function PreviewCard({ resume, className }: { resume: ResumeData; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl shadow-emerald-900/20 ring-1 ring-black/5 ${className ?? ""}`}
    >
      {/* ResumePreview is a fixed 794x1123 page, scaled down to fit */}
      <div className="origin-top-left scale-[0.36] sm:scale-[0.42]">
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      data-loop-anim
      className={`animate-pulse overflow-hidden rounded-xl border bg-card shadow-xl ${className ?? ""}`}
      aria-hidden
    >
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="h-8 w-1/2 rounded-md bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="mt-2 h-24 rounded-md bg-muted/70" />
        <div className="h-16 rounded-md bg-muted/50" />
      </div>
    </div>
  );
}

function FloatingChips() {
  const reduced = useReducedMotion();
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -left-3 top-14 sm:-left-10"
      >
        <motion.div
          animate={reduced ? { y: 0 } : { y: [0, -8, 0] }}
          transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-white/85 px-3.5 py-2.5 shadow-xl shadow-black/5 backdrop-blur-md dark:bg-zinc-900/85"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Target className="size-4" />
          </span>
          <span>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              ATS Score
            </span>
            <span className="block font-display text-base font-bold leading-none text-foreground">
              94<span className="text-emerald-500">/100</span>
            </span>
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.15, duration: 0.5 }}
        className="absolute -right-2 bottom-20 sm:-right-8"
      >
        <motion.div
          animate={reduced ? { y: 0 } : { y: [0, 9, 0] }}
          transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.6 }}
          className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-white/85 px-3.5 py-2.5 shadow-xl shadow-black/5 backdrop-blur-md dark:bg-zinc-900/85"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <TrendingUp className="size-4" />
          </span>
          <span>
            <span className="block font-display text-base font-bold leading-none text-foreground">
              +38%
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              interviews
            </span>
          </span>
        </motion.div>
      </motion.div>
    </>
  );
}

function ResumeStack() {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const resumes = useResumeStore((s) => s.resumes);

  const front =
    resumes.find((r) => r.id === "seed-alex") ?? resumes[0] ?? null;
  const back =
    resumes.find((r) => r.id === "seed-maya") ?? resumes[1] ?? null;

  if (!mounted || !front) {
    return (
      <div className="relative mx-auto h-[410px] w-[292px] sm:h-[478px] sm:w-[340px]">
        <SkeletonCard className="absolute left-7 top-9 h-[404px] w-[286px] rotate-6 opacity-60 sm:h-[472px] sm:w-[334px]" />
        <SkeletonCard className="absolute left-0 top-0 h-[404px] w-[286px] -rotate-3 sm:h-[472px] sm:w-[334px]" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[410px] w-[292px] sm:h-[478px] sm:w-[340px]">
      {back ? (
        <PreviewCard
          resume={back}
          className="absolute left-7 top-9 h-[404px] w-[286px] rotate-6 opacity-70 sm:h-[472px] sm:w-[334px]"
        />
      ) : null}
      <motion.div
        animate={reduced ? { y: 0 } : { y: [0, -10, 0] }}
        transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute left-0 top-0 h-[404px] w-[286px] -rotate-3 sm:h-[472px] sm:w-[334px]"
      >
        <PreviewCard resume={front} className="h-full w-full" />
      </motion.div>
      <FloatingChips />
    </div>
  );
}

/* ---------------- Hero ---------------- */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

export default function Hero() {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const member = useAuthStore((s) => s.mode === "member" && s.user !== null);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  /* Guests get the zero-friction demo as the headline action; signed-in
     members get their workspace. Server render = guest variant (hydration
     safe: the swap happens after mount, post-rehydrate). */
  const isMember = mounted && member;

  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-36" aria-label="Hero">
      {/* Backdrop: hairline grid + corner-anchored aurora glows. Glows stay
          small and pushed off-canvas so the hero keeps generous white space —
          full-width washes read flat at desktop widths. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,black_30%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute -left-44 -top-20 size-[400px] rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10"
      />
      <div
        aria-hidden
        className="absolute -right-48 top-56 size-[380px] rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-500/10"
      />

      <div className={CONTAINER}>
        <div className="relative grid items-center gap-14 lg:grid-cols-2 lg:gap-8">
          {/* Left — entrance container; the avatar cluster is a SIBLING below
              it because whileInView does not activate for motion descendants
              of an inherited animate="show" variant context. */}
          <div className="max-w-xl">
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm dark:text-emerald-300">
                <Sparkles className="size-3.5" aria-hidden />
                #1 AI Resume Builder
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.05rem]"
            >
              Forge a resume that{" "}
              <motion.span
                className="whitespace-nowrap bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-clip-text text-transparent"
                style={{ backgroundSize: "220% 100%" }}
                animate={
                  reduced
                    ? { backgroundPosition: "0% 50%" }
                    : { backgroundPosition: ["0% 50%", "100% 50%"] }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 4, repeat: Infinity, repeatType: "mirror", ease: "linear" }
                }
              >
                beats the ATS
              </motion.span>{" "}
              <br className="hidden sm:block" />
              and wins interviews
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              ResumeForge AI writes, rewrites, and scores every bullet point
              against real applicant-tracking systems — then packages it all in
              recruiter-loved templates. Build yours in minutes, not weekends.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3.5">
              {isMember ? (
                <GradientButton href="/dashboard" className="h-12 px-7 text-base">
                  Open my workspace
                  <ArrowRight className="size-4" />
                </GradientButton>
              ) : (
                <GradientButton href="/dashboard" onClick={enterDemo} className="h-12 px-7 text-base">
                  <Play className="size-4 fill-current" aria-hidden />
                  Try Live Demo
                </GradientButton>
              )}
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 text-base font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-accent active:scale-[0.97]"
              >
                Create free account
              </Link>
            </motion.div>

            {/* Micro-trust row — the three assurances every professional
                landing shows at the decision point. */}
            <motion.ul
              variants={itemVariants}
              aria-label="Getting started assurances"
              className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5"
            >
              {["No sign-up needed", "Free plan forever", "5-minute setup"].map(
                (t) => (
                  <li
                    key={t}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground"
                  >
                    <Check
                      className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    {t}
                  </li>
                )
              )}
            </motion.ul>
            </motion.div>

            <div className="mt-9">
              <AvatarCluster />
            </div>

            {/* Interactive score demo — sits below the trust cluster (the
                right grid cell is taken by the resume stack + floating chips,
                and this position keeps the demo right under the CTAs on
                mobile). Own sibling (not inside the variant tree) so the
                cluster's whileInView wiring stays untouched. */}
            <div className="mt-8">
              <HeroScoreDemo />
            </div>
          </div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            <ResumeStack />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
