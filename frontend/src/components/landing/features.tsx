"use client";

import * as React from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  Command,
  Crosshair,
  FileDown,
  GitCompareArrows,
  Globe,
  Kanban,
  LayoutTemplate,
  Linkedin,
  Mail,
  MessagesSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  SpellCheck,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTAINER, Reveal, SectionHeading } from "./shared";

/* ---------------------------------------------------------------- */
/* Small building blocks                                             */
/* ---------------------------------------------------------------- */

function CardShell({
  children,
  className,
  delay = 0,
  href,
  cta,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** When set, the whole card becomes a deep link into the dashboard */
  href?: string;
  /** Visible pill text on hover / keyboard focus, e.g. "Open Tracker" */
  cta?: string;
  /** Accessible link name (defaults to cta) */
  label?: string;
}) {
  const linked = Boolean(href && cta);
  return (
    <Reveal delay={delay} className={className}>
      <div
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5 before:pointer-events-none before:absolute before:inset-0 before:z-10 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-emerald-400/15 before:to-transparent before:transition-transform before:duration-700 before:ease-out before:content-[''] group-hover:before:translate-x-full group-focus-within:before:translate-x-full dark:before:via-emerald-300/10",
          linked &&
            "cursor-pointer focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/30"
        )}
      >
        {children}
        {href && cta ? (
          <>
            {/* CTA pill — space is reserved in-flow (no layout shift), revealed on hover / keyboard focus */}
            <span
              aria-hidden
              className="pointer-events-none mt-auto flex items-center pt-4"
            >
              <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 opacity-0 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 dark:text-emerald-400">
                {cta}
                <ArrowRight
                  className="size-3 transition-transform duration-300 group-focus-within:translate-x-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </span>
            {/* Full-card hit area — decorative visuals stay aria-hidden below */}
            <Link
              href={href}
              className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none"
            >
              <span className="sr-only">{label ?? cta}</span>
            </Link>
          </>
        ) : null}
      </div>
    </Reveal>
  );
}

function IconBadge({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <span
      className={cn(
        "mb-4 flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 group-focus-within:scale-110 group-focus-within:-rotate-3",
        tint
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-base font-bold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/* Faint emerald dot-grid + radial glow for the two wide anchor cards */
function CardDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-80 dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.16) 1px, transparent 0)",
          backgroundSize: "17px 17px",
          WebkitMaskImage:
            "radial-gradient(130% 110% at 100% 0%, black 25%, transparent 72%)",
          maskImage:
            "radial-gradient(130% 110% at 100% 0%, black 25%, transparent 72%)",
        }}
      />
      <div
        className="absolute -right-20 -top-24 size-64 rounded-full opacity-70 dark:opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.16), transparent 65%)",
        }}
      />
    </div>
  );
}

/* Shared accent tint map (chips + avatar dots) */
const TINTS = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
} as const;

type Tint = keyof typeof TINTS;

/* Animated mini score gauge for the ATS card */
function ScoreGauge() {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative size-[84px] shrink-0">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90">
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" className="stroke-muted" />
        <motion.circle
          cx="38"
          cy="38"
          r={R}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          stroke="url(#bento-gauge-grad)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          whileInView={{ strokeDashoffset: C * (1 - 0.94) }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
        />
        <defs>
          <linearGradient id="bento-gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-extrabold leading-none text-foreground">94</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          /100
        </span>
      </div>
    </div>
  );
}

function MiniBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={{ width: "0%" }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Job application tracker — abstract mini Kanban                    */
/* ---------------------------------------------------------------- */

function MicroCard({
  initials,
  tint,
  className,
}: {
  initials: string;
  tint: Tint;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card px-2 py-1.5 shadow-sm dark:border-border/35",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-[5px] text-[7px] font-extrabold",
            TINTS[tint]
          )}
        >
          {initials}
        </span>
        <span className="h-1.5 w-10 rounded-full bg-foreground/20 dark:bg-foreground/25" />
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <span className="h-1 w-8 rounded-full bg-muted-foreground/30 dark:bg-muted-foreground/25" />
        <span className="ml-auto h-1 w-5 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}

function KanbanColumnHeader({
  label,
  count,
  dotClass,
  labelClass,
}: {
  label: string;
  count: string;
  dotClass: string;
  labelClass: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 px-0.5">
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      <span className={cn("text-[9px] font-bold uppercase tracking-wider", labelClass)}>
        {label}
      </span>
      <span className={cn("ml-auto text-[9px] font-bold opacity-50", labelClass)}>{count}</span>
    </div>
  );
}

function KanbanMini() {
  const reduced = useReducedMotion();
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-2.5" aria-hidden>
      {/* Applied (violet) */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-2 dark:border-violet-400/15 dark:bg-violet-400/[0.05]">
        <KanbanColumnHeader
          label="Applied"
          count="2"
          dotClass="bg-violet-500 dark:bg-violet-400"
          labelClass="text-violet-700 dark:text-violet-300"
        />
        <div className="space-y-1.5">
          <MicroCard initials="VE" tint="violet" />
          {/* Card gently nudging toward the Interview column (static when reduced motion) */}
          <motion.div
            className="relative"
            animate={reduced ? { x: 0 } : { x: [0, 4, 0] }}
            transition={reduced ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <MicroCard initials="LI" tint="violet" />
            <motion.span
              className={cn(
                "absolute -right-2 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full border border-amber-500/40 bg-background shadow-sm",
                reduced && "opacity-70"
              )}
              animate={reduced ? { opacity: 0.7 } : { opacity: [0, 1, 0] }}
              transition={reduced ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="size-2.5 text-amber-600 dark:text-amber-400" />
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Interview (amber) */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-2 dark:border-amber-400/15 dark:bg-amber-400/[0.05]">
        <KanbanColumnHeader
          label="Interview"
          count="1"
          dotClass="bg-amber-500 dark:bg-amber-400"
          labelClass="text-amber-700 dark:text-amber-300"
        />
        <div className="space-y-1.5">
          <MicroCard initials="ST" tint="amber" />
          {/* Empty drop slot — destination of the nudging card */}
          <div className="h-8 rounded-lg border border-dashed border-amber-500/30 dark:border-amber-400/20" />
        </div>
      </div>

      {/* Offer (emerald, winning card elevated + trophy) */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-2 dark:border-emerald-400/15 dark:bg-emerald-400/[0.06]">
        <KanbanColumnHeader
          label="Offer"
          count="1"
          dotClass="bg-emerald-500 dark:bg-emerald-400"
          labelClass="text-emerald-700 dark:text-emerald-300"
        />
        <div className="relative">
          <MicroCard
            initials="AN"
            tint="emerald"
            className="-translate-y-0.5 border-emerald-500/50 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500/40"
          />
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
            <Trophy className="size-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Interview prep — fanned flashcards                                */
/* ---------------------------------------------------------------- */

function FlashcardFan() {
  return (
    <div className="relative h-28 w-44 shrink-0 self-center" aria-hidden>
      <div className="absolute inset-0 rotate-6 rounded-xl border border-border/60 bg-muted/40 dark:bg-muted/20" />
      <div className="absolute inset-0 -rotate-6 rounded-xl border border-border/60 bg-muted/40 dark:bg-muted/20" />
      <motion.div
        initial={{ opacity: 0, rotate: -4, y: 12 }}
        whileInView={{ opacity: 1, rotate: 0, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/25"
      >
        <Sparkles className="size-4 text-white/90" />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1.5 w-3/4 rounded-full bg-white/50" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/30" />
          <div className="h-1.5 w-2/3 rounded-full bg-white/20" />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Resume comparison — A/B papers + delta pill                       */
/* ---------------------------------------------------------------- */

function PaperMini({ label, score, strong }: { label: string; score: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        "w-24 rounded-lg border bg-card p-2 sm:w-28",
        strong
          ? "border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
          : "border-border/60 shadow-sm dark:border-border/35"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-[5px] text-[8px] font-extrabold",
            strong
              ? TINTS.emerald
              : "bg-muted text-muted-foreground"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex h-4 min-w-[26px] items-center justify-center rounded-full px-1 text-[8px] font-bold tabular-nums",
            strong ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {score}
        </span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1.5 w-4/5 rounded-full bg-foreground/20 dark:bg-foreground/25" />
        <div
          className={cn(
            "h-1 w-full rounded-full",
            strong ? "bg-emerald-500/40" : "bg-muted-foreground/20"
          )}
        />
        <div className="h-1 w-3/5 rounded-full bg-muted-foreground/25" />
        <div className="h-1 w-2/3 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}

/* "+12 pts" pill that counts up when scrolled into view */
function DeltaPill() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v: number) => `+${Math.round(v)} pts`);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, 12, { duration: 1.4, ease: "easeOut", delay: 0.5 });
    return () => controls.stop();
  }, [inView, mv]);

  return (
    <span
      ref={ref}
      className="absolute -bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-emerald-500/30 bg-background/90 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600 shadow-sm backdrop-blur-sm dark:border-emerald-400/25 dark:text-emerald-400"
    >
      <TrendingUp className="size-3" aria-hidden />
      <motion.span className="tabular-nums">{text}</motion.span>
    </span>
  );
}

function CompareVisual() {
  return (
    <div className="relative mx-auto mt-6 w-fit pb-3" aria-hidden>
      <div className="flex items-center gap-3 sm:gap-4">
        <PaperMini label="A" score="94" strong />
        <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-extrabold text-white shadow-md shadow-emerald-500/30">
          VS
        </div>
        <PaperMini label="B" score="82" />
      </div>
      <DeltaPill />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Job match scanner — mini gauge + keyword chips                    */
/* ---------------------------------------------------------------- */

function MatchRing() {
  const R = 22;
  const C = 2 * Math.PI * R;
  const reduced = useReducedMotion();
  return (
    <div className="relative size-14 shrink-0">
      {/* Rotating dashed halo — reads as a continuous scan sweep (frozen when reduced motion) */}
      <motion.span
        className="absolute -inset-[5px] rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-400/25"
        animate={reduced ? { rotate: 0 } : { rotate: 360 }}
        transition={reduced ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <svg viewBox="0 0 56 56" className="size-full -rotate-90">
        <circle cx="28" cy="28" r={R} fill="none" strokeWidth="6" className="stroke-muted" />
        <motion.circle
          cx="28"
          cy="28"
          r={R}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="url(#bento-match-grad)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          whileInView={{ strokeDashoffset: C * (1 - 0.88) }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
        <defs>
          <linearGradient id="bento-match-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-sm font-extrabold leading-none text-foreground">88</span>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
          match
        </span>
      </div>
    </div>
  );
}

function MatchChip({
  label,
  matched,
  delay,
}: {
  label: string;
  matched: boolean;
  delay: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        matched
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      )}
    >
      {matched ? <Check className="size-2.5" /> : <Plus className="size-2.5" />}
      {label}
    </motion.span>
  );
}

function JobMatchVisual() {
  return (
    <div
      className="relative mt-5 rounded-xl border border-border/70 bg-muted/40 p-3.5"
      aria-hidden
    >
      <div className="flex items-center gap-3.5">
        <MatchRing />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Strong match
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            2 keywords to weave in
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <MatchChip label="React" matched delay={0.4} />
        <MatchChip label="TypeScript" matched delay={0.5} />
        <MatchChip label="GraphQL" matched={false} delay={0.6} />
        <MatchChip label="CI/CD" matched={false} delay={0.7} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Section                                                           */
/* ---------------------------------------------------------------- */

export default function Features() {
  return (
    <section id="features" aria-label="Features" className="scroll-mt-20 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow={<><Target className="size-3" aria-hidden /> Features</>}
          title="Everything you need to get hired"
          description="One workspace that writes, scores, and ships resumes that pass automated screens — then tracks every application and drills you for the interview, all the way to the offer."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Row 1 · Anchor: ATS score scanner */}
          <CardShell
            className="md:col-span-2"
            delay={0}
            href="/dashboard/ats"
            cta="Open ATS Scanner"
            label="Open the ATS score scanner"
          >
            <CardDecor />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <IconBadge icon={Target} tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle>ATS score scanner</CardTitle>
                  <CardDesc>
                    Scan any resume against real job descriptions. See exactly what
                    recruiters&apos; software sees — and what to fix before you apply.
                  </CardDesc>
                </div>
                <ScoreGauge />
              </div>
              <div className="mt-5 grid gap-3.5 border-t border-border/60 pt-5 sm:grid-cols-3">
                <MiniBar label="Keyword match" value={96} delay={0.35} />
                <MiniBar label="Formatting" value={92} delay={0.5} />
                <MiniBar label="Impact language" value={89} delay={0.65} />
              </div>
            </div>
          </CardShell>

          {/* Row 1 · Anchor: AI writing assistant */}
          <CardShell
            className="md:col-span-2"
            delay={0.08}
            href="/dashboard/builder"
            cta="Open Studio"
            label="Open the AI writing assistant in Resume Studio"
          >
            <CardDecor />
            <div className="relative">
              <IconBadge icon={Bot} tint="bg-teal-500/15 text-teal-600 dark:text-teal-400" />
              <CardTitle>AI writing assistant</CardTitle>
              <CardDesc>
                Turn weak duties into quantified achievements. The AI rewrites every
                bullet with strong verbs, metrics, and role-specific keywords.
              </CardDesc>
              <div className="mt-5 space-y-2.5 rounded-xl border border-border/70 bg-muted/40 p-3.5 text-xs leading-relaxed">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-0.5 h-4 w-1 rounded-full bg-rose-400/70" aria-hidden />
                  <span className="line-through decoration-rose-400/60">
                    Responsible for managing the company social media accounts
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="flex items-start gap-2 font-medium text-foreground"
                >
                  <span className="mt-0.5 h-4 w-1 rounded-full bg-emerald-500" aria-hidden />
                  <span>
                    Grew social audience 0 → 85K followers, driving 32% of new
                    signups within 6 months
                    <span
                      className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink rounded-full bg-emerald-500 align-baseline motion-reduce:animate-none"
                      aria-hidden
                    />
                  </span>
                </motion.div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <Bot className="size-3" aria-hidden /> AI improved
                </span>
              </div>
            </div>
          </CardShell>

          {/* Row 2 · Standard: templates */}
          <CardShell
            delay={0}
            href="/dashboard/templates"
            cta="Open Templates"
            label="Browse the resume template gallery"
          >
            <IconBadge icon={LayoutTemplate} tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>60+ ATS templates</CardTitle>
            <CardDesc>
              Recruiter-approved designs for every field and career stage — all
              parse-perfect.
            </CardDesc>
          </CardShell>

          {/* Row 2 · Standard: grammar */}
          <CardShell
            delay={0.06}
            href="/dashboard/grammar"
            cta="Open Grammar Check"
            label="Open the grammar checker"
          >
            <IconBadge icon={SpellCheck} tint="bg-amber-500/15 text-amber-600 dark:text-amber-400" />
            <CardTitle>Grammar checker</CardTitle>
            <CardDesc>
              Catch typos, tense slips, and awkward phrasing before a recruiter
              ever does.
            </CardDesc>
          </CardShell>

          {/* Row 2 · Wide: job application tracker */}
          <CardShell
            className="md:col-span-2"
            delay={0.12}
            href="/dashboard/tracker"
            cta="Open Tracker"
            label="Open the job application tracker"
          >
            <IconBadge icon={Kanban} tint="bg-violet-500/15 text-violet-600 dark:text-violet-400" />
            <CardTitle>Job application tracker</CardTitle>
            <CardDesc>
              Drag every application through Applied → Interview → Offer and
              always know exactly where you stand.
            </CardDesc>
            <KanbanMini />
          </CardShell>

          {/* Row 3 · Wide: interview prep */}
          <CardShell
            className="md:col-span-2"
            delay={0}
            href="/dashboard/interview"
            cta="Open Interview Prep"
            label="Open the interview prep trainer"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1">
                <IconBadge icon={MessagesSquare} tint="bg-amber-500/15 text-amber-600 dark:text-amber-400" />
                <CardTitle>Interview prep trainer</CardTitle>
                <CardDesc>
                  Drill a 45-question bank with STAR model answers tailored to
                  your resume — so nothing surprises you in the room.
                </CardDesc>
                <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-hidden>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TINTS.emerald)}>
                    Behavioral
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TINTS.violet)}>
                    Technical
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TINTS.amber)}>
                    Situational
                  </span>
                </div>
                <div className="mt-4 max-w-[240px]">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-muted-foreground">Practice progress</span>
                    <span className="font-bold text-foreground">5/8 practiced</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "62.5%" }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 1.1, delay: 0.45, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
              <FlashcardFan />
            </div>
          </CardShell>

          {/* Row 3 · Standard: cover letters */}
          <CardShell
            delay={0.06}
            href="/dashboard/cover-letter"
            cta="Open Cover Letters"
            label="Open the cover letter generator"
          >
            <IconBadge icon={Mail} tint="bg-rose-500/15 text-rose-600 dark:text-rose-400" />
            <CardTitle>AI cover letters</CardTitle>
            <CardDesc>
              Tailored cover letters generated from your resume and the job post
              in seconds.
            </CardDesc>
          </CardShell>

          {/* Row 3 · Standard: portfolio */}
          <CardShell
            delay={0.12}
            href="/dashboard/portfolio"
            cta="Open Portfolio"
            label="Open the portfolio site generator"
          >
            <IconBadge icon={Globe} tint="bg-teal-500/15 text-teal-600 dark:text-teal-400" />
            <CardTitle>Portfolio sites</CardTitle>
            <CardDesc>
              Turn your resume into a shareable one-page portfolio website
              instantly.
            </CardDesc>
          </CardShell>

          {/* Row 4 · Wide: LinkedIn import */}
          <CardShell
            className="md:col-span-2"
            delay={0}
            href="/dashboard/linkedin"
            cta="Open LinkedIn Import"
            label="Open the LinkedIn import tool"
          >
            <IconBadge icon={Linkedin} tint="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" />
            <CardTitle>LinkedIn import</CardTitle>
            <CardDesc>
              Paste your LinkedIn profile URL and watch a full draft resume appear
              — experience, skills, and all.
            </CardDesc>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2 pl-3.5 text-xs">
              <span className="flex-1 truncate font-medium text-muted-foreground">
                linkedin.com/in/your-profile
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1.5 text-[11px] font-bold text-white">
                <Linkedin className="size-3" aria-hidden /> Import
              </span>
            </div>
          </CardShell>

          {/* Row 4 · Wide: resume comparison */}
          <CardShell
            className="md:col-span-2"
            delay={0.08}
            href="/dashboard/compare"
            cta="Open Compare"
            label="Open the resume comparison tool"
          >
            <IconBadge icon={GitCompareArrows} tint="bg-teal-500/15 text-teal-600 dark:text-teal-400" />
            <CardTitle>Resume comparison</CardTitle>
            <CardDesc>
              Put two versions head-to-head: a side-by-side ATS diff, keyword
              edge, and per-section score deltas show which draft is stronger.
            </CardDesc>
            <CompareVisual />
          </CardShell>

          {/* Row 5 · Standard: PDF export */}
          <CardShell
            delay={0}
            href="/dashboard/builder"
            cta="Open Studio"
            label="Open Resume Studio to export your resume as a PDF"
          >
            <IconBadge icon={FileDown} tint="bg-violet-500/15 text-violet-600 dark:text-violet-400" />
            <CardTitle>1-click PDF export</CardTitle>
            <CardDesc>
              Pixel-perfect A4 PDFs that keep your formatting intact on any
              recruiter&apos;s screen — attachments, printouts, portals.
            </CardDesc>
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/40 p-3.5">
              <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-medium">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <FileDown className="size-3.5 shrink-0 text-violet-500 dark:text-violet-400" aria-hidden />
                  <span className="truncate">alex_resume.pdf</span>
                </span>
                <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">1.2 MB ✓</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardShell>

          {/* Row 5 · Standard: job match scanner */}
          <CardShell
            delay={0.06}
            href="/dashboard/match"
            cta="Open Job Match"
            label="Open the job match scanner"
          >
            <IconBadge icon={Crosshair} tint="bg-teal-500/15 text-teal-600 dark:text-teal-400" />
            <CardTitle>Job match scanner</CardTitle>
            <CardDesc>
              Paste a job description and get an instant match score with the
              exact keywords to add.
            </CardDesc>
            <JobMatchVisual />
          </CardShell>

          {/* Row 5 · Standard: private by design */}
          <CardShell delay={0.12}>
            <IconBadge icon={ShieldCheck} tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>Private by design</CardTitle>
            <CardDesc>
              Everything runs and stores right in your browser — your resume
              never leaves your machine.
            </CardDesc>
          </CardShell>

          {/* Row 5 · Standard: keyboard-first */}
          <CardShell delay={0.18}>
            <IconBadge icon={Command} tint="bg-amber-500/15 text-amber-600 dark:text-amber-400" />
            <CardTitle>Keyboard-first</CardTitle>
            <CardDesc>
              Jump anywhere with the ⌘K command palette — every tool is one
              keystroke away.
            </CardDesc>
            <div
              className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"
              aria-hidden
            >
              <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                ⌘K
              </kbd>
              <span className="h-3 w-px bg-border" />
              <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                N
              </kbd>
              <span>new resume</span>
            </div>
          </CardShell>
        </div>
      </div>
    </section>
  );
}
