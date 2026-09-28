"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  FileText,
  Loader2,
  Quote,
  SpellCheck,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActiveResume, useResumeStore, type ResumeData } from "@/lib/resume-store";
import {
  grammarCheckText,
  sleep,
  type GrammarIssue,
  type GrammarResult,
} from "@/lib/mock-ai";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

import { ScoreRing } from "@/components/tools/score-gauge";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { staggerContainer, staggerItem } from "@/components/tools/variants";

/* ============================== Meta ============================== */

const ISSUE_TYPE_META: Record<
  GrammarIssue["type"],
  { label: string; className: string }
> = {
  spelling: {
    label: "Spelling",
    className:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  grammar: {
    label: "Grammar",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  style: {
    label: "Style",
    className:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  punctuation: {
    label: "Punctuation",
    className:
      "border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  },
  "weak-phrase": {
    label: "Strength",
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

type Filter = "all" | "spelling" | "grammar" | "style";

const FILTERS: Array<{
  value: Filter;
  label: string;
  match: (t: GrammarIssue["type"]) => boolean;
}> = [
  { value: "all", label: "All", match: () => true },
  {
    value: "spelling",
    label: "Spelling",
    match: (t) => t === "spelling" || t === "punctuation",
  },
  { value: "grammar", label: "Grammar", match: (t) => t === "grammar" },
  {
    value: "style",
    label: "Style",
    match: (t) => t === "style" || t === "weak-phrase",
  },
];

function scoreMessage(score: number): string {
  if (score >= 90) return "Polished and professional";
  if (score >= 75) return "Strong writing — minor polish left";
  if (score >= 60) return "Decent, with room to improve";
  return "Needs a careful pass";
}

function textFromResume(resume: ResumeData | undefined): string {
  if (!resume) return "";
  const parts: string[] = [];
  if (resume.summary.trim()) parts.push(resume.summary.trim());
  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      if (bullet.trim()) parts.push(bullet.trim());
    }
  }
  return parts.join("\n");
}

/* ============================== Page ============================== */

export default function GrammarPage() {
  const mounted = useMounted();
  const activeResume = useActiveResume();
  const resumes = useResumeStore((s) => s.resumes);

  const [text, setText] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<GrammarResult | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");

  /* Prefill from the active resume on mount (unless the user already typed). */
  React.useEffect(() => {
    if (!mounted || touched) return;
    if (resumes.length === 0) return;
    setText(textFromResume(activeResume));
  }, [mounted, activeResume, touched]);

  const liveWords = React.useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text]
  );
  const liveChars = text.length;

  const handleCheck = async () => {
    if (!text.trim() || checking) return;
    setChecking(true);
    try {
      await sleep(900);
      setResult(grammarCheckText(text));
      setFilter("all");
    } catch {
      toast.error("Check failed — please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLoadFromResume = () => {
    const next = textFromResume(activeResume);
    setText(next);
    setTouched(false);
    setResult(null);
    if (next) toast.success("Loaded text from your resume");
    else toast.info("Your active resume has no summary or bullets yet");
  };

  const safeFixes = React.useMemo(() => {
    if (!result) return [];
    return result.issues.filter(
      (i) => i.type === "spelling" || i.type === "punctuation"
    );
  }, [result]);

  const applySafeFixes = () => {
    if (!result) return;
    let updated = text;
    let count = 0;
    for (const issue of safeFixes) {
      if (issue.type === "punctuation") {
        if (issue.original === "double spaces") {
          updated = updated.replace(/ {2,}/g, " ");
          count++;
          continue;
        }
        if (issue.original === "sentence start") {
          updated = updated.replace(
            /(^|[.!?]\s+)([a-z])/g,
            (_m, p: string, c: string) => p + c.toUpperCase()
          );
          count++;
          continue;
        }
      }
      if (updated.includes(issue.original)) {
        updated = updated.split(issue.original).join(issue.suggestion);
        count++;
      }
    }
    if (count === 0) {
      toast.info("No automatic fixes available — review suggestions manually");
      return;
    }
    setText(updated);
    setTouched(true);
    setResult(grammarCheckText(updated));
    toast.success(`${count} fix${count > 1 ? "es" : ""} applied`);
  };

  const counts = React.useMemo(() => {
    const base: Record<Filter, number> = { all: 0, spelling: 0, grammar: 0, style: 0 };
    for (const f of FILTERS) {
      base[f.value] = result
        ? result.issues.filter((i) => f.match(i.type)).length
        : 0;
    }
    return base;
  }, [result]);

  const visibleIssues = React.useMemo(() => {
    if (!result) return [];
    const f = FILTERS.find((x) => x.value === filter) ?? FILTERS[0];
    return result.issues.filter((i) => f.match(i.type));
  }, [result, filter]);

  const showEmptyCollage = !result && !checking && !text.trim();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      <ToolPageHeader
        icon={SpellCheck}
        title="Grammar Checker"
        description="Catch spelling slips, grammar gremlins, and weak phrasing before a recruiter does. Start from your resume or paste any text."
      />

      <motion.section variants={staggerItem}>
        <Card>
          <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2 lg:gap-0 lg:p-0">
            {/* Editor pane */}
            <section
              aria-label="Text editor"
              className="flex flex-col gap-4 lg:border-r lg:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="grammar-text" className="text-sm font-medium">
                  Your text
                </Label>
                <div className="flex items-center gap-1.5" aria-live="polite">
                  <Badge variant="secondary" className="tabular-nums">
                    {liveWords} words
                  </Badge>
                  <Badge variant="secondary" className="tabular-nums">
                    {liveChars} chars
                  </Badge>
                </div>
              </div>
              <Textarea
                id="grammar-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setTouched(true);
                }}
                placeholder="Paste your resume summary, bullets, or any text you want polished…"
                aria-label="Text to check"
                className="min-h-[260px] flex-1 resize-y text-sm leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadFromResume}
                  disabled={!mounted || resumes.length === 0}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Load from resume
                </Button>
                <Button
                  onClick={handleCheck}
                  disabled={checking || !text.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
                  aria-label="Check grammar"
                >
                  {checking ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <WandSparkles className="size-4" aria-hidden="true" />
                  )}
                  {checking ? "Checking…" : "Check grammar"}
                </Button>
              </div>
            </section>

            {/* Results pane */}
            <section
              aria-label="Analysis results"
              aria-live="polite"
              className="lg:p-6 lg:pl-6"
            >
              {checking ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                  <Loader2
                    className="size-8 animate-spin text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium" role="status">
                    Analyzing your text
                    <span className="animate-pulse" aria-hidden="true">…</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Scanning spelling, grammar, punctuation, and style
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-5">
                  {/* Score + apply fixes */}
                  <div className="flex items-center gap-4">
                    <ScoreRing score={result.score} />
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold leading-tight">
                        {scoreMessage(result.score)}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {result.issues.length === 0
                          ? "No issues found — nice work."
                          : `${result.issues.length} issue${result.issues.length > 1 ? "s" : ""} found across your text.`}
                      </p>
                      <Button
                        size="sm"
                        onClick={applySafeFixes}
                        disabled={safeFixes.length === 0}
                        className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <CheckCheck className="size-4" aria-hidden="true" />
                        Apply all safe fixes
                        {safeFixes.length > 0 ? ` (${safeFixes.length})` : ""}
                      </Button>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                    aria-label="Text statistics"
                  >
                    {result.stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border bg-card p-3 text-center"
                      >
                        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {s.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Filter tabs */}
                  <Tabs
                    value={filter}
                    onValueChange={(v) => setFilter(v as Filter)}
                  >
                    <TabsList aria-label="Filter issues by type">
                      {FILTERS.map((f) => (
                        <TabsTrigger key={f.value} value={f.value}>
                          {f.label}
                          <span className="ml-1 tabular-nums opacity-60">
                            {counts[f.value]}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  {/* Issue cards */}
                  <div
                    className="max-h-[340px] space-y-3 overflow-y-auto pr-1 scrollbar-thin"
                    aria-label="Issue list"
                  >
                    {visibleIssues.map((issue) => {
                      const meta = ISSUE_TYPE_META[issue.type];
                      return (
                        <div
                          key={issue.id}
                          className="rounded-lg border p-3 transition-colors hover:border-emerald-500/30"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={cn("font-medium", meta.className)}
                            >
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground line-through decoration-rose-500/60">
                              {issue.original}
                            </span>
                            <ArrowRight
                              className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              {issue.suggestion}
                            </span>
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {issue.message}
                          </p>
                        </div>
                      );
                    })}
                    {visibleIssues.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <CheckCircle2
                          className="size-8 text-emerald-500"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-medium">
                          Nothing in this category
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your text is clean here.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : showEmptyCollage ? (
                <EmptyCollage />
              ) : (
                <ReadyState />
              )}
            </section>
          </CardContent>
        </Card>
      </motion.section>

      {/* Tips strip */}
      <motion.section variants={staggerItem} aria-label="Tips">
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Quote className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Recruiters skim for ~7 seconds — every weak phrase costs momentum.
          </p>
          <p className="text-xs text-muted-foreground">
            Safe fixes = spelling &amp; punctuation only. Style edits stay yours.
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ============================== Empty-state illustration ============================== */

function EmptyCollage() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center py-8 text-center">
      <div className="relative" aria-hidden="true">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <SpellCheck className="size-9" />
        </div>
        <motion.span
          className="absolute -left-9 top-1 flex size-9 items-center justify-center rounded-lg border bg-card text-emerald-600 shadow-sm dark:text-emerald-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <FileText className="size-4" />
        </motion.span>
        <motion.span
          className="absolute -right-9 top-7 flex size-9 items-center justify-center rounded-lg border bg-card text-teal-600 shadow-sm dark:text-teal-400"
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          <CheckCircle2 className="size-4" />
        </motion.span>
        <motion.span
          className="absolute -bottom-3 left-4 flex size-9 items-center justify-center rounded-lg border bg-card text-violet-600 shadow-sm dark:text-violet-400"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        >
          <WandSparkles className="size-4" />
        </motion.span>
      </div>
      <h2 className="mt-6 font-display text-lg font-semibold">
        Nothing to check yet
      </h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Paste your text on the left, or load your resume summary and bullets
        with one click.
      </p>
    </div>
  );
}

function ReadyState() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 py-8 text-center">
      <div
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <WandSparkles className="size-7" />
      </div>
      <h2 className="font-display text-lg font-semibold">Ready when you are</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Hit “Check grammar” and we&apos;ll flag spelling, grammar, punctuation,
        and weak phrasing in seconds.
      </p>
    </div>
  );
}
