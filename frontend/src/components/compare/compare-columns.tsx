"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Trophy } from "lucide-react";

import ResumePreview from "@/components/resume/resume-preview";
import { ResumeSelect } from "@/components/tools/resume-select";
import { ScoreGauge } from "@/components/tools/score-gauge";
import { EASE } from "@/components/tools/variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AtsResult } from "@/lib/mock-ai";
import { resumeHealth, type ResumeHealth } from "@/lib/resume-health";
import { TEMPLATE_META, useResumeStore, type ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

export type CompareSide = "a" | "b";

/* ============================== Pure helpers ============================== */

/** Total number of experience bullets across every role. */
export function countBullets(resume: ResumeData): number {
  return resume.experience.reduce((n, exp) => n + exp.bullets.length, 0);
}

/** Sum of role spans in years (1 decimal). "YYYY-MM" start; end = endDate or now when current. */
export function yearsOfExperience(resume: ResumeData): number {
  const now = new Date();
  let months = 0;
  for (const exp of resume.experience) {
    const startParts = exp.startDate.split("-");
    const sy = Number(startParts[0]);
    const sm = Number(startParts[1]);
    if (!Number.isFinite(sy) || !Number.isFinite(sm) || sy <= 0 || sm < 1 || sm > 12) continue;

    let end: Date | null = null;
    if (exp.current) {
      end = now;
    } else if (exp.endDate) {
      const endParts = exp.endDate.split("-");
      const ey = Number(endParts[0]);
      const em = Number(endParts[1]);
      if (Number.isFinite(ey) && Number.isFinite(em) && ey > 0 && em >= 1 && em <= 12) {
        end = new Date(ey, em - 1, 1);
      }
    }
    if (!end) continue;

    const span = (end.getFullYear() - sy) * 12 + (end.getMonth() + 1 - sm);
    if (span > 0) months += span;
  }
  return Math.round((months / 12) * 10) / 10;
}

/* ============================== FreshnessPill ============================== */

/**
 * Scan-recency pill for a compare column — visual twin of the resumes page
 * HealthPill (resume-card.tsx): colored dot + "scanned X ago" / "never scanned",
 * tinted per bucket (fresh emerald / aging amber / stale rose / never zinc).
 */
function FreshnessPill({ health }: { health: ResumeHealth }) {
  const { bucket, scanned, latest } = health;
  const when = latest ? formatDistanceToNow(new Date(latest.at), { addSuffix: true }) : null;
  const label = when ? `scanned ${when}` : "never scanned";
  return (
    <span
      data-resume-health={bucket}
      data-scanned={scanned ? "true" : "false"}
      title={
        when
          ? `Last ATS scan ${when} — score ${latest?.score ?? "—"}`
          : "This resume has never been scanned by the ATS checker"
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0 text-[10.5px] font-medium leading-[15px] tabular-nums transition-colors duration-300",
        bucket === "fresh" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400",
        bucket === "aging" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-400",
        bucket === "stale" &&
          scanned &&
          "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:text-rose-400",
        bucket === "stale" &&
          !scanned &&
          "border-zinc-500/25 bg-zinc-500/10 text-zinc-600 dark:border-zinc-500/40 dark:text-zinc-400"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full transition-colors duration-300",
          bucket === "fresh" && "bg-emerald-500",
          bucket === "aging" && "bg-amber-500",
          bucket === "stale" && scanned && "bg-rose-500",
          bucket === "stale" && !scanned && "bg-zinc-400 dark:bg-zinc-500"
        )}
      />
      {label}
    </span>
  );
}

/* ============================== ResumeColumn ============================== */

const SIDE_META: Record<CompareSide, { label: string; letterTone: string }> = {
  a: {
    label: "Resume A",
    letterTone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  b: {
    label: "Resume B",
    letterTone: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
};

interface ResumeColumnProps {
  side: CompareSide;
  resume: ResumeData;
  result: AtsResult;
  /** The winning side gets an emerald ring + "Leading" badge. */
  isWinner: boolean;
  /** Horizontal offset (px) the content slides in from — opposite per side, reads as a swap. */
  slideFrom: number;
  onSelect: (id: string) => void;
}

export function ResumeColumn({
  side,
  resume,
  result,
  isWinner,
  slideFrom,
  onSelect,
}: ResumeColumnProps) {
  const meta = SIDE_META[side];
  const bullets = React.useMemo(() => countBullets(resume), [resume]);
  const years = React.useMemo(() => yearsOfExperience(resume), [resume]);

  // Scan recency for this column's resume (same health signal as the resumes page).
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  const health = React.useMemo(
    () => resumeHealth(scoreHistory, resume.id),
    [scoreHistory, resume.id]
  );

  const stats = [
    { label: "Words", sr: "word count", value: result.wordCount.toLocaleString("en-US"), title: "Word count from the ATS scan" },
    { label: "Bullets", sr: "experience bullet points", value: String(bullets), title: "Total experience bullet points" },
    { label: "Years", sr: "of experience", value: years.toFixed(1), title: "Years of experience (sum of role spans)" },
    { label: "Skills", sr: "skills listed", value: String(resume.skills.length), title: "Skills listed" },
  ];

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        isWinner && "border-transparent shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/60"
      )}
    >
      {/* Accent bar from the resume's own theme color */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: resume.accent }}
      />
      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Column header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                meta.letterTone
              )}
            >
              {side === "a" ? "A" : "B"}
            </span>
            <h2 className="font-display text-base font-semibold tracking-tight">
              {meta.label}
            </h2>
            {isWinner ? (
              <Badge className="border-transparent bg-emerald-500 text-white">
                <Trophy className="size-3" aria-hidden="true" />
                Leading
              </Badge>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 px-2 text-[11px] text-muted-foreground"
          >
            {TEMPLATE_META[resume.template].name}
          </Badge>
        </div>

        {/* Picker */}
        <ResumeSelect
          value={resume.id}
          onValueChange={onSelect}
          ariaLabel={`${meta.label} — currently “${resume.title}”`}
          className="w-full sm:w-full"
        />

        {/* Content keyed by resume id so swaps/changes slide in */}
        <motion.div
          key={resume.id}
          initial={{ opacity: 0, x: slideFrom }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: EASE }}
        >
          {/* Live A4 preview — full page scaled via CSS zoom (matches builder convention) */}
          <div
            className="relative h-[450px] overflow-hidden rounded-lg border bg-muted/30 sm:h-[584px]"
            role="img"
            aria-label={`Miniature preview of ${resume.title}`}
          >
            <div className="flex h-full justify-center overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none h-fit shrink-0 select-none transition-[zoom] duration-300 [zoom:0.4] sm:[zoom:0.52]"
                style={{ width: 794 }}
              >
                <ResumePreview resume={resume} />
              </div>
            </div>
          </div>

          {/* Score + key stats */}
          <div className="mt-4 flex flex-col items-center gap-4 border-t pt-4 sm:flex-row">
            <ScoreGauge
              score={result.score}
              grade={result.grade}
              size={120}
              delay={0.2}
              className="shrink-0"
            />
            <dl className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  title={s.title}
                  className="rounded-lg border bg-muted/30 p-2.5"
                >
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    {s.label}
                    <span className="sr-only"> {s.sr}</span>
                  </dt>
                  <dd className="mt-0.5 font-display text-lg font-bold tabular-nums tracking-tight">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Freshness — last-scan recency (mirrors the score/ATS rows above) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
            data-freshness="true"
            data-side={side}
            data-resume-id={resume.id}
            data-resume-health={health.bucket}
            className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-2.5"
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              Freshness
              <span className="sr-only"> — time since the last ATS scan</span>
            </span>
            <FreshnessPill health={health} />
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
