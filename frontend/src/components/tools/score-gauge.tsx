"use client";

import * as React from "react";
import { animate, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "./variants";

/* ============================== Grade helpers ============================== */

export type Grade = "Excellent" | "Good" | "Fair" | "Needs Work";

export function gradeFor(score: number): Grade {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

/** Tailwind classes for a grade badge, colored by score threshold. */
export function gradeBadgeClass(score: number): string {
  if (score >= 85)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (score >= 70)
    return "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300";
  if (score >= 50)
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

/* ============================== Count up ============================== */

function useCountUp(target: number, duration = 1.4, delay = 0): number {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    const controls = animate(0, target, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, duration, delay]);
  return value;
}

/* ============================== ScoreGauge ============================== */

interface ScoreGaugeProps {
  score: number; // 0-100
  grade?: string;
  size?: number;
  delay?: number;
  className?: string;
}

/** Large animated SVG ring gauge with emerald→teal gradient stroke and count-up number. */
export function ScoreGauge({
  score,
  grade,
  size = 190,
  delay = 0.15,
  className,
}: ScoreGaugeProps) {
  const stroke = 13;
  const radius = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);
  const gradientId = `score-gauge-${React.useId().replace(/:/g, "")}`;
  const display = useCountUp(clamped, 1.4, delay);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Score ${Math.round(clamped)} out of 100`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, delay, ease: EASE }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-5xl font-bold tabular-nums"
            aria-hidden="true"
          >
            {display}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      {grade ? (
        <span
          className={cn(
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
            gradeBadgeClass(clamped)
          )}
        >
          {grade}
        </span>
      ) : null}
    </div>
  );
}

/* ============================== ScoreRing ============================== */

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  delay?: number;
  className?: string;
}

/** Simpler ring (no badge) used by the grammar checker's score badge. */
export function ScoreRing({
  score,
  size = 112,
  strokeWidth = 9,
  delay = 0.1,
  className,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);
  const gradientId = `score-ring-${React.useId().replace(/:/g, "")}`;
  const display = useCountUp(clamped, 1.2, delay);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Grammar score ${Math.round(clamped)} out of 100`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay, ease: EASE }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-3xl font-bold tabular-nums"
          aria-hidden="true"
        >
          {display}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          score
        </span>
      </div>
    </div>
  );
}

/* ============================== AnimatedProgress ============================== */

interface AnimatedProgressProps {
  value: number;
  max: number;
  delay?: number;
  className?: string;
  barClassName?: string;
}

/** Progress bar that animates its width on mount; gradient bar by default. */
export function AnimatedProgress({
  value,
  max,
  delay = 0,
  className,
  barClassName,
}: AnimatedProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <motion.div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500",
          barClassName
        )}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      />
    </div>
  );
}
