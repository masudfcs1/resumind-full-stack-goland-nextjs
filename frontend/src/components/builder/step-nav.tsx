"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  Check,
  FolderGit2,
  GraduationCap,
  Palette,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/lib/resume-store";
import { Progress } from "@/components/ui/progress";

/* ============================== Step definitions ============================== */

export const STEPS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "extras", label: "Extras", icon: Award },
  { id: "design", label: "Design", icon: Palette },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function isStepComplete(step: StepId, resume: ResumeData): boolean {
  switch (step) {
    case "personal":
      return Object.values(resume.personal).some((v) => v.trim().length > 0);
    case "summary":
      return resume.summary.trim().length > 0;
    case "experience":
      return resume.experience.length > 0;
    case "education":
      return resume.education.length > 0;
    case "skills":
      return resume.skills.length > 0;
    case "projects":
      return resume.projects.length > 0;
    case "extras":
      return resume.certifications.length > 0 || resume.languages.length > 0;
    case "design":
      return resume.title.trim().length > 0;
    default:
      return false;
  }
}

export function countCompleted(resume: ResumeData): number {
  return STEPS.reduce((acc, s) => acc + (isStepComplete(s.id, resume) ? 1 : 0), 0);
}

/* ============================== Step nav ============================== */

interface StepNavProps {
  resume: ResumeData;
  step: StepId;
  onSelect: (step: StepId) => void;
}

export function StepNav({ resume, step, onSelect }: StepNavProps) {
  return (
    <>
      {/* Vertical rail (lg+) */}
      <nav
        aria-label="Builder steps"
        className="hidden flex-1 flex-col gap-1 overflow-y-auto p-3 lg:flex"
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = isStepComplete(s.id, resume);
          const active = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium transition-colors",
                active
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="builder-step-pill"
                  className="absolute inset-0 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                  active || done
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="relative z-10 flex-1 truncate">{s.label}</span>
              <span className="relative z-10 text-[10px] tabular-nums text-muted-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              {done && <Check className="relative z-10 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />}
            </button>
          );
        })}
      </nav>

      {/* Horizontal chips (<lg) */}
      <nav aria-label="Builder steps" className="flex gap-1.5 overflow-x-auto px-3 py-2.5 lg:hidden">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = isStepComplete(s.id, resume);
          const active = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-300"
                  : "border-border bg-background text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active && "text-emerald-500")} aria-hidden />
              {s.label}
              {done && <Check className="h-3 w-3 text-emerald-500" aria-hidden />}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ============================== Progress ============================== */

export function StepProgress({ resume, className }: { resume: ResumeData; className?: string }) {
  const done = countCompleted(resume);
  const pct = Math.round((done / STEPS.length) * 100);
  return (
    <div className={cn("px-3 pb-3", className)}>
      <div className="mb-1.5 hidden items-center justify-between lg:flex">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
          Progress
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {done}/{STEPS.length} done
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`Resume completion ${pct}%`}
        className="h-1.5 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-500 [&_[data-slot=progress-indicator]]:to-teal-500"
      />
    </div>
  );
}
