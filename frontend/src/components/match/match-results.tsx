"use client";

import * as React from "react";
import Link from "next/link";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  ListChecks,
  Plus,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedProgress, gradeBadgeClass, ScoreGauge } from "@/components/tools/score-gauge";
import { EASE, staggerContainer, staggerItem } from "@/components/tools/variants";
import type { AtsResult } from "@/lib/mock-ai";
import type { ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

import { buildSuggestions, keywordLabel } from "./suggest";

/* ============================== Count-up ============================== */

function AnimatedNumber({
  value,
  className,
  delay = 0,
}: {
  value: number;
  className?: string;
  delay?: number;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.2,
      delay,
      ease: EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, mv, delay]);

  return <span className={cn("tabular-nums", className)}>{display}</span>;
}

/* ============================== Verdict copy ============================== */

function verdictCopy(score: number, missing: number): string {
  const unit = missing === 1 ? "keyword" : "keywords";
  if (score >= 85) {
    return missing === 0
      ? "Outstanding — your resume already speaks this job's language."
      : `Strong match — ${missing} ${unit} to weave in and you are in great shape.`;
  }
  if (score >= 70) return `Strong match — ${missing} ${unit} to weave in.`;
  if (score >= 50)
    return `Moderate match — tailoring ${missing} ${unit} would make this a real contender.`;
  return `Long shot — ${missing} ${unit} missing; heavy tailoring needed to compete.`;
}

/* ============================== Chip ============================== */

function KeywordChip({ label, matched }: { label: string; matched: boolean }) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        matched
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      )}
    >
      {matched ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Plus className="size-3" aria-hidden="true" />
      )}
      {label}
    </li>
  );
}

/* ============================== MatchResults ============================== */

interface MatchResultsProps {
  result: AtsResult;
  resume: ResumeData;
  resumeTitle: string;
  analyzing: boolean;
  onAddSkill: (keyword: string) => void;
  onOpenStudio: () => void;
}

export function MatchResults({
  result,
  resume,
  resumeTitle,
  analyzing,
  onAddSkill,
  onOpenStudio,
}: MatchResultsProps) {
  const suggestions = React.useMemo(
    () => buildSuggestions(resume, result.missingKeywords, 6),
    [resume, result.missingKeywords]
  );

  const matched = result.matchedKeywords.length;
  const missing = result.missingKeywords.length;
  const total = matched + missing;
  const coveragePct = total > 0 ? Math.round((matched / total) * 100) : 0;

  const copySuggestion = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Suggestion copied", {
        description: `Ready to paste into your ${label} bullet.`,
      });
    } catch {
      toast.error("Could not access the clipboard in this browser.");
    }
  };

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      aria-label="Match results"
      aria-live="polite"
      className="space-y-6"
    >
      {/* a. Verdict banner */}
      <motion.section
        variants={staggerItem}
        className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 sm:p-6"
      >
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 size-44 rounded-full bg-emerald-500/10 blur-2xl"
        />
        <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
          <div className="flex flex-col items-center">
            <ScoreGauge score={result.score} size={120} delay={0.2} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Match
            </span>
          </div>

          <div className="min-w-0 flex-1 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-start">
              <AnimatedNumber
                value={result.score}
                delay={0.15}
                className="font-display text-6xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400"
              />
              <span className="font-display text-xl font-semibold text-muted-foreground">
                / 100
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  gradeBadgeClass(result.score)
                )}
              >
                {result.grade}
              </span>
            </div>
            <p className="mt-3 text-base font-medium leading-snug sm:text-lg">
              {verdictCopy(result.score, missing)}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {resumeTitle} scanned against the job description ·{" "}
              {result.wordCount} words
            </p>
          </div>

          <dl className="grid w-full max-w-xs grid-cols-2 gap-3 lg:w-auto">
            <div className="rounded-lg border bg-background/60 p-3 text-center backdrop-blur">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Matched
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {matched}
              </dd>
            </div>
            <div className="rounded-lg border bg-background/60 p-3 text-center backdrop-blur">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Missing
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {missing}
              </dd>
            </div>
          </dl>
        </div>
      </motion.section>

      {/* b/c/d. Coverage · Suggestions · Breakdown */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* b. Keyword coverage */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <ListChecks
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                Keyword coverage
              </CardTitle>
              <CardDescription>
                The terms this posting hammers on, checked against your resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">Coverage</span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {coveragePct}%
                  </span>
                </div>
                <AnimatedProgress
                  value={matched}
                  max={Math.max(total, 1)}
                  delay={0.25}
                  className="mt-2"
                  barClassName={
                    coveragePct >= 75
                      ? undefined
                      : coveragePct >= 50
                        ? "bg-teal-500/80"
                        : "bg-amber-500/80"
                  }
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {matched} of {total} surfaced keywords appear in your resume.
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <Check className="size-3.5" aria-hidden="true" />
                  Matched ({matched})
                </p>
                <ul
                  className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 scrollbar-thin"
                  aria-label="Matched keywords"
                >
                  {result.matchedKeywords.map((kw) => (
                    <KeywordChip key={kw} label={kw} matched />
                  ))}
                  {matched === 0 ? (
                    <li className="text-xs text-muted-foreground">
                      None matched yet.
                    </li>
                  ) : null}
                </ul>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Plus className="size-3.5" aria-hidden="true" />
                  Missing ({missing})
                </p>
                <ul
                  className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 scrollbar-thin"
                  aria-label="Missing keywords"
                >
                  {result.missingKeywords.map((kw) => (
                    <KeywordChip key={kw} label={kw} matched={false} />
                  ))}
                  {missing === 0 ? (
                    <li className="text-xs text-muted-foreground">
                      Nothing missing — great coverage.
                    </li>
                  ) : null}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* c. Tailoring suggestions */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Wand2
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                Tailoring suggestions
              </CardTitle>
              <CardDescription>
                Concrete ways to close the biggest gaps — copy one, paste it,
                make it yours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium">Full keyword coverage</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Nothing to add — your resume mirrors the posting. Just
                      keep the proof points honest.
                    </p>
                  </div>
                </div>
              ) : (
                <ul
                  className="max-h-[420px] space-y-3 overflow-y-auto pr-1 scrollbar-thin"
                  aria-label="Tailoring suggestions"
                >
                  {suggestions.map((s, i) => (
                    <motion.li
                      key={s.keyword}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.3 + i * 0.07, ease: EASE }}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          <Plus className="size-3" aria-hidden="true" />
                          {keywordLabel(s.keyword)}
                        </span>
                        <span className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => copySuggestion(s.text, keywordLabel(s.keyword))}
                          disabled={analyzing}
                          aria-label={`Copy suggestion for ${keywordLabel(s.keyword)}`}
                        >
                          <Copy className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                          onClick={() => onAddSkill(s.keyword)}
                          disabled={analyzing}
                          aria-label={`Add ${keywordLabel(s.keyword)} to skills`}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Add to skills
                        </Button>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {s.text}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* d. Category breakdown */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Layers
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                Score breakdown
              </CardTitle>
              <CardDescription>
                Where the points come from — and where they leak.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {result.breakdown.map((b, i) => {
                const ratio = b.max > 0 ? b.score / b.max : 0;
                const barClass =
                  ratio >= 0.75
                    ? undefined
                    : ratio >= 0.5
                      ? "bg-teal-500/80"
                      : "bg-amber-500/80";
                return (
                  <div key={b.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{b.label}</span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {b.score}/{b.max}
                      </span>
                    </div>
                    <AnimatedProgress
                      value={b.score}
                      max={b.max}
                      delay={0.25 + i * 0.1}
                      className="mt-2"
                      barClassName={barClass}
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {b.hint}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* e. Action row */}
      <motion.section
        variants={staggerItem}
        className="flex flex-col gap-4 rounded-xl border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <p className="text-sm text-muted-foreground">
          Weave in the gaps, then re-scan — watching the score climb is the
          whole game.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onOpenStudio}
            className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Open in Resume Studio
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/ats">Run full ATS scan</Link>
          </Button>
        </div>
      </motion.section>
    </motion.section>
  );
}
