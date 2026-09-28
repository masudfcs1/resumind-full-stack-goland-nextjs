"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lightbulb, Quote, Rocket, Target, Wand2, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tip {
  icon: LucideIcon;
  text: string;
}

const TIPS: Tip[] = [
  {
    icon: Target,
    text: "Mirror the exact job title from the posting in your resume headline — ATS systems weight title matches heavily.",
  },
  {
    icon: Zap,
    text: "Start every bullet with a strong verb and end with a number. “Cut load time 43%” beats “responsible for performance”.",
  },
  {
    icon: Wand2,
    text: "Use the AI rewrite on thin bullets, then trim anything under 10 words — specificity is what recruiters scan for.",
  },
  {
    icon: Rocket,
    text: "Tailor one resume per application. Duplicate your master resume and swap the summary and top 5 skills for each role.",
  },
  {
    icon: Quote,
    text: "Keep your resume to one page under 10 years of experience — two pages only when every line earns its place.",
  },
];

export function ProTipCard() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const tip = TIPS[index];
  const Icon = tip.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
      aria-label="Pro tip"
      className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/10 p-4 dark:border-amber-500/20"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
          Pro tip
        </p>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % TIPS.length)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Next tip"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2.5 min-h-[64px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-start gap-2"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-foreground/90">{tip.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
        {TIPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-5 bg-amber-500" : "w-1.5 bg-amber-500/30"
            )}
          />
        ))}
      </div>
    </motion.section>
  );
}
