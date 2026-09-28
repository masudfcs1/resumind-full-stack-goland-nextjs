"use client";

import * as React from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  Braces,
  Check,
  CheckCircle2,
  Equal,
  Lightbulb,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { EASE } from "@/components/tools/variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AtsIssue, AtsResult } from "@/lib/mock-ai";
import type { ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

/** Both sides of the comparison, fully resolved. */
export interface SidePair {
  a: { resume: ResumeData; result: AtsResult };
  b: { resume: ResumeData; result: AtsResult };
}

/* ============================== AnimatedNumber ============================== */

/** Count-up number (framer-motion animate + useMotionValue, tracker/metrics pattern). */
function AnimatedNumber({ value }: { value: number }) {
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

  return <span className="tabular-nums">{Math.round(display)}</span>;
}

/* ============================== DeltaChip ============================== */

function DeltaChip({ delta, delay = 0 }: { delta: number; delay?: number }) {
  const abs = Math.abs(delta);
  if (abs === 0) {
    return (
      <span
        title="Dead even"
        className="inline-flex h-6 items-center justify-center rounded-full border border-zinc-500/25 bg-zinc-500/10 px-2 text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300"
      >
        ±0
      </span>
    );
  }
  const aAhead = delta > 0;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: EASE }}
      title={aAhead ? `Resume A ahead by ${abs} points` : `Resume B ahead by ${abs} points`}
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full border px-2 text-[11px] font-semibold tabular-nums",
        aAhead
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      )}
    >
      {aAhead ? `+${abs}` : `-${abs}`}
      <span className="sr-only">
        {aAhead ? ` Resume A ahead by ${abs} points` : ` Resume B ahead by ${abs} points`}
      </span>
    </motion.span>
  );
}

/* ============================== VerdictBanner ============================== */

interface Advisory {
  icon: LucideIcon;
  text: string;
  chips?: string[];
}

export function VerdictBanner({ a, b }: SidePair) {
  const delta = a.result.score - b.result.score;
  const tie = delta === 0;
  const winnerSide = delta > 0 ? "A" : "B";
  const win = tie ? a : delta > 0 ? a : b;
  const lose = tie ? b : delta > 0 ? b : a;
  const gap = Math.abs(delta);

  // Category deltas sorted by absolute difference
  const catDiffs = a.result.breakdown
    .map((item, i) => ({
      label: item.label,
      delta: item.score - (b.result.breakdown[i]?.score ?? 0),
    }))
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  const topDiff = catDiffs[0];

  // Keywords the winner covers that the loser misses
  const winnerOnly = win.result.matchedKeywords
    .filter((k) => !lose.result.matchedKeywords.includes(k))
    .slice(0, 6);

  // Loser's weakest category = the quickest available lift
  const weakest = [...lose.result.breakdown].sort(
    (x, y) => x.score / x.max - y.score / y.max
  )[0];

  const advisories: Advisory[] = [];
  if (tie) {
    advisories.push({
      icon: Equal,
      text: `Both resumes land on ${a.result.score}/100 — adjust keywords or add quantified impact to break the tie.`,
    });
    if (topDiff && topDiff.delta !== 0) {
      advisories.push({
        icon: TrendingUp,
        text: `The category mix differs though: “${topDiff.label}” goes ${topDiff.delta > 0 ? "to Resume A" : "to Resume B"} by ${Math.abs(topDiff.delta)} pts.`,
      });
    }
  } else {
    if (topDiff) {
      advisories.push({
        icon: TrendingUp,
        text: `Biggest gap: ${topDiff.label} — Resume ${topDiff.delta > 0 ? "A" : "B"} leads by ${Math.abs(topDiff.delta)} pts.`,
      });
    }
    advisories.push(
      winnerOnly.length > 0
        ? {
            icon: Braces,
            text: `It also covers ${winnerOnly.length} keyword${winnerOnly.length === 1 ? "" : "s"} the other resume misses:`,
            chips: winnerOnly,
          }
        : {
            icon: Braces,
            text: "Keyword coverage is evenly matched — neither resume owns an exclusive term.",
          }
    );
    if (weakest) {
      advisories.push({
        icon: Lightbulb,
        text: `Fastest lift for “${lose.resume.title}”: raise ${weakest.label} (${weakest.score}/${weakest.max}), its weakest category.`,
      });
    }
  }

  return (
    <section aria-live="polite" aria-label="Comparison verdict">
      <motion.div
        key={`${a.resume.id}|${b.resume.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 sm:p-6"
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 size-40 rounded-full bg-emerald-500/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg",
                tie
                  ? "bg-zinc-700 shadow-zinc-700/25"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
              )}
            >
              {tie ? (
                <Equal className="size-6" aria-hidden="true" />
              ) : (
                <Trophy className="size-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {tie ? "Dead heat" : `Resume ${winnerSide} wins`}
              </h2>
              <p
                className="mt-0.5 max-w-xs truncate text-sm text-muted-foreground"
                title={win.resume.title}
              >
                “{win.resume.title}” · {win.result.grade}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            {tie ? (
              <p className="font-display text-2xl font-bold tabular-nums">
                {a.result.score}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  pts each
                </span>
              </p>
            ) : (
              <>
                <p className="font-display text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +<AnimatedNumber value={gap} />
                  <span className="ml-1.5 align-middle text-sm font-semibold">pts</span>
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {a.result.score} vs {b.result.score}
                </p>
              </>
            )}
          </div>
        </div>

        <ul className="relative mt-4 space-y-2 border-t border-emerald-500/15 pt-4">
          {advisories.map((adv, i) => {
            const Icon = adv.icon;
            return (
              <li
                key={i}
                className="text-sm"
              >
                <span className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{adv.text}</span>
                </span>
                {adv.chips ? (
                  <span className="mt-1.5 flex flex-wrap gap-1.5 sm:pl-6">
                    {adv.chips.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </motion.div>
    </section>
  );
}

/* ============================== BreakdownDiff ============================== */

interface DiffRow {
  label: string;
  hint: string;
  aScore: number;
  aMax: number;
  bScore: number;
  bMax: number;
  delta: number;
}

function Bar({
  pct,
  accent,
  delay,
}: {
  pct: number;
  accent: string;
  delay: number;
}) {
  const width = `${Math.round(Math.min(1, Math.max(0, pct)) * 100)}%`;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: accent }}
        initial={{ width: 0 }}
        animate={{ width }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      />
    </div>
  );
}

export function BreakdownDiff({ a, b }: SidePair) {
  const rows: DiffRow[] = a.result.breakdown.map((item, i) => {
    const other = b.result.breakdown[i];
    return {
      label: item.label,
      hint: item.hint,
      aScore: item.score,
      aMax: item.max,
      bScore: other?.score ?? 0,
      bMax: other?.max ?? 0,
      delta: item.score - (other?.score ?? 0),
    };
  });
  const maxAbs = rows.reduce((m, r) => Math.max(m, Math.abs(r.delta)), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Breakdown diff</CardTitle>
        <CardDescription>
          Five scoring categories side by side — the widest gap is highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div key={`${a.resume.id}|${b.resume.id}`}>
          {/* Column headers (desktop) */}
          <div className="mb-1 hidden grid-cols-[1fr_128px_64px_128px] items-end gap-x-3 px-2.5 pb-2 sm:grid">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </span>
            <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: a.resume.accent }}
              />
              A
            </span>
            <span aria-hidden="true" />
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: b.resume.accent }}
              />
              B
            </span>
          </div>

          <div className="space-y-1.5">
            {rows.map((r, i) => {
              const isTop = maxAbs > 0 && Math.abs(r.delta) === maxAbs;
              return (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
                  className={cn(
                    "grid grid-cols-[1fr_64px_1fr] items-center gap-x-3 gap-y-1.5 rounded-lg px-2.5 py-2.5 sm:grid-cols-[1fr_128px_64px_128px]",
                    isTop && "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/35"
                  )}
                >
                  <div className="col-span-3 sm:col-span-1">
                    <p className="text-sm font-medium leading-tight">{r.label}</p>
                    <p className="mt-0.5 hidden text-[11px] text-muted-foreground lg:block">
                      {r.hint}
                    </p>
                  </div>

                  {/* A cell */}
                  <div className="space-y-1">
                    <p className="text-right text-xs tabular-nums">
                      <span className="sr-only">Resume A: </span>
                      <span className="font-bold">{r.aScore}</span>
                      <span className="text-muted-foreground">/{r.aMax}</span>
                    </p>
                    <Bar
                      pct={r.aMax > 0 ? r.aScore / r.aMax : 0}
                      accent={a.resume.accent}
                      delay={0.15 + i * 0.08}
                    />
                  </div>

                  <div className="flex justify-center">
                    <DeltaChip delta={r.delta} delay={0.25 + i * 0.08} />
                  </div>

                  {/* B cell */}
                  <div className="space-y-1">
                    <p className="text-xs tabular-nums">
                      <span className="sr-only">Resume B: </span>
                      <span className="font-bold">{r.bScore}</span>
                      <span className="text-muted-foreground">/{r.bMax}</span>
                    </p>
                    <Bar
                      pct={r.bMax > 0 ? r.bScore / r.bMax : 0}
                      accent={b.resume.accent}
                      delay={0.2 + i * 0.08}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================== IssuesPanel ============================== */

function IssueList({ issues }: { issues: AtsIssue[] }) {
  const shown = issues.slice(0, 5);
  const extra = issues.length - shown.length;

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        No critical or warning issues — clean scan.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {shown.map((issue) => (
        <li
          key={issue.id}
          className="flex items-center gap-2.5 rounded-lg border p-2.5"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full",
              issue.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
            )}
          />
          <Badge
            variant="outline"
            className="shrink-0 px-1.5 py-0 text-[10px] text-muted-foreground"
          >
            {issue.category}
          </Badge>
          <span
            className="min-w-0 flex-1 truncate text-sm"
            title={issue.title}
          >
            <span className="sr-only">
              {issue.severity === "critical" ? "Critical: " : "Warning: "}
            </span>
            {issue.title}
          </span>
        </li>
      ))}
      {extra > 0 ? (
        <li className="px-1 pt-1 text-xs text-muted-foreground">
          +{extra} more — run the ATS Scanner for the full list.
        </li>
      ) : null}
    </ul>
  );
}

export function IssuesPanel({ a, b }: SidePair) {
  const pick = (result: AtsResult) =>
    result.issues.filter(
      (issue) => issue.severity === "critical" || issue.severity === "warning"
    );
  const issuesA = pick(a.result);
  const issuesB = pick(b.result);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display">Fix-list face-off</CardTitle>
        <CardDescription>
          Critical and warning findings from each ATS scan, most severe first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="a">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="a" className="flex-1 sm:flex-none">
              Resume A
              <span className="text-muted-foreground">({issuesA.length})</span>
            </TabsTrigger>
            <TabsTrigger value="b" className="flex-1 sm:flex-none">
              Resume B
              <span className="text-muted-foreground">({issuesB.length})</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="mt-4">
            <IssueList issues={issuesA} />
          </TabsContent>
          <TabsContent value="b" className="mt-4">
            <IssueList issues={issuesB} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ============================== KeywordEdge ============================== */

interface KeywordGroupProps {
  label: string;
  /** Optional resume title shown under the group header. */
  sub?: string;
  chips: string[];
  /** "shared" = emerald + check chips; "side" = chips tinted with the resume accent. */
  tone: "shared" | "side";
  accent?: string;
  emptyText: string;
  cap?: number;
}

function KeywordGroup({
  label,
  sub,
  chips,
  tone,
  accent,
  emptyText,
  cap = 8,
}: KeywordGroupProps) {
  const shown = chips.slice(0, cap);
  const extra = chips.length - shown.length;

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        {tone === "shared" ? (
          <Check
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
        ) : (
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className="text-xs text-muted-foreground">({chips.length})</span>
      </div>
      {sub ? (
        <p
          className="mb-2 truncate text-[11px] text-muted-foreground"
          title={sub}
        >
          {sub}
        </p>
      ) : (
        <div className="mb-2 h-4" aria-hidden="true" />
      )}
      <ul
        className="flex max-h-36 flex-wrap content-start gap-2 overflow-y-auto pr-1 scrollbar-thin"
        aria-label={`${label} keywords`}
      >
        {shown.map((kw) =>
          tone === "shared" ? (
            <li
              key={kw}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
            >
              <Check className="size-3" aria-hidden="true" />
              {kw}
            </li>
          ) : (
            <li
              key={kw}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${accent}14`,
                borderColor: `${accent}45`,
              }}
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {kw}
            </li>
          )
        )}
        {extra > 0 ? (
          <li className="inline-flex items-center rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground">
            +{extra}
          </li>
        ) : null}
        {chips.length === 0 ? (
          <li className="text-xs text-muted-foreground">{emptyText}</li>
        ) : null}
      </ul>
    </div>
  );
}

interface KeywordEdgeProps {
  both: string[];
  onlyA: string[];
  onlyB: string[];
  accentA: string;
  accentB: string;
  titleA: string;
  titleB: string;
}

export function KeywordEdge({
  both,
  onlyA,
  onlyB,
  accentA,
  accentB,
  titleA,
  titleB,
}: KeywordEdgeProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display">Keyword edge</CardTitle>
        <CardDescription>
          Terms one resume hits and the other doesn&apos;t — shared ground first.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-3">
        <KeywordGroup
          label="Both hit"
          chips={both}
          tone="shared"
          emptyText="No shared keyword hits."
        />
        <KeywordGroup
          label="Only A"
          sub={titleA}
          chips={onlyA}
          tone="side"
          accent={accentA}
          emptyText="A owns nothing extra."
        />
        <KeywordGroup
          label="Only B"
          sub={titleB}
          chips={onlyB}
          tone="side"
          accent={accentB}
          emptyText="B owns nothing extra."
        />
      </CardContent>
    </Card>
  );
}
