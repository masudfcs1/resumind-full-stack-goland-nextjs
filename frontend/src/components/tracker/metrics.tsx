"use client";

import * as React from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Activity, Clock, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import type { ApplicationStage, JobApplication } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "./motion-presets";

/* ---------------------------- animated value ---------------------------- */

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, mv]);

  return <span className="tabular-nums">{display.toFixed(decimals)}</span>;
}

/* ------------------------------- card ----------------------------------- */

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
} as const;

function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  caption: string;
  tone: keyof typeof TONES;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2.5 font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground/80">{caption}</p>
    </motion.div>
  );
}

/* ------------------------------- strip ---------------------------------- */

const DAY_MS = 1000 * 60 * 60 * 24;

export function MetricsStrip({ applications }: { applications: JobApplication[] }) {
  const counts = React.useMemo(() => {
    const c: Record<ApplicationStage, number> = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const a of applications) c[a.stage] += 1;
    return c;
  }, [applications]);

  // (interview + offer) / (applied + interview + offer) — guarded against div-by-zero
  const denominator = counts.applied + counts.interview + counts.offer;
  const responseRate = denominator === 0 ? 0 : Math.round(((counts.interview + counts.offer) / denominator) * 100);

  const active = counts.saved + counts.applied + counts.interview;

  const avgDays = React.useMemo(() => {
    const inPipeline = applications.filter(
      (a) => a.stage === "saved" || a.stage === "applied" || a.stage === "interview"
    );
    if (inPipeline.length === 0) return 0;
    const now = Date.now();
    const sum = inPipeline.reduce((acc, a) => acc + (now - a.updatedAt), 0);
    return sum / inPipeline.length / DAY_MS;
  }, [applications]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      aria-label="Pipeline metrics"
    >
      <MetricCard
        icon={TrendingUp}
        label="Response rate"
        value={<AnimatedNumber value={responseRate} />}
        caption="interviews + offers of applied"
        tone="emerald"
      />
      <MetricCard
        icon={Trophy}
        label="Offers"
        value={<AnimatedNumber value={counts.offer} />}
        caption="offers received"
        tone="amber"
      />
      <MetricCard
        icon={Activity}
        label="Active pipeline"
        value={<AnimatedNumber value={active} />}
        caption="saved + applied + interviewing"
        tone="teal"
      />
      <MetricCard
        icon={Clock}
        label="Avg days in pipeline"
        value={
          <>
            <AnimatedNumber value={avgDays} decimals={1} />
            <span className="text-base font-semibold text-muted-foreground">d</span>
          </>
        }
        caption="since last pipeline update"
        tone="violet"
      />
    </motion.div>
  );
}
