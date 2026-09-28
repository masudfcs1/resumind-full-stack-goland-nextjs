"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./mini-charts";

export type StatTone = "emerald" | "teal" | "amber" | "violet";

const TONES: Record<StatTone, { chip: string; spark: string }> = {
  emerald: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    spark: "text-emerald-500",
  },
  teal: {
    chip: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
    spark: "text-teal-500",
  },
  amber: {
    chip: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    spark: "text-amber-500",
  },
  violet: {
    chip: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    spark: "text-violet-500",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaTone = "up",
  spark,
  tone = "emerald",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "flat";
  spark?: number[];
  tone?: StatTone;
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      role="group"
      aria-label={`${label}: ${value}`}
      className="group rounded-xl border bg-card p-4 shadow-sm transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-105",
            t.chip
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} className={cn("h-8 w-20", t.spark)} />}
      </div>
      <p className="mt-3 font-display text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[13px] text-muted-foreground">{label}</p>
        {delta && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
              deltaTone === "up"
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </motion.div>
  );
}
