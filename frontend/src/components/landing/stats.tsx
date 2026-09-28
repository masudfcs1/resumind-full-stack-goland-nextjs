"use client";

import * as React from "react";
import { FileText, Star, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTAINER, Counter, Reveal } from "./shared";

const STATS = [
  {
    icon: FileText,
    value: 2.1,
    decimals: 1,
    suffix: "M+",
    label: "Resumes created",
    hint: "and counting every day",
  },
  {
    icon: Target,
    value: 94,
    decimals: 0,
    suffix: "",
    label: "Average ATS score",
    hint: "across optimized resumes",
  },
  {
    icon: TrendingUp,
    value: 3.2,
    decimals: 1,
    suffix: "x",
    label: "More interviews",
    hint: "vs. DIY resumes",
  },
  {
    icon: Star,
    value: 12.4,
    decimals: 1,
    suffix: "K",
    label: "Five-star reviews",
    hint: "4.9 average rating",
  },
] as const;

export default function Stats() {
  return (
    <section aria-label="Product statistics" className="py-16 sm:py-20">
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-border/60">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="text-center lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <s.icon className="size-5" aria-hidden />
              </div>
              <p className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                <Counter
                  to={s.value}
                  decimals={s.decimals}
                  suffix={s.suffix}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300"
                />
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
              <p className={cn("mt-0.5 text-xs text-muted-foreground")}>{s.hint}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
