"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, GitCompareArrows } from "lucide-react";

import { CompareBoard } from "@/components/compare/compare-board";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { EASE, staggerItem } from "@/components/tools/variants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useResumeStore,
  useStoreHydrated,
  type ScoreEntry,
} from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

/* ============================== Skeleton ============================== */

function CompareSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading resume comparison…</span>
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="hidden items-center gap-3 sm:flex" aria-hidden="true">
          <Skeleton className="h-9 w-[110px] rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4 rounded-xl border p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-[450px] w-full rounded-lg sm:h-[584px]" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-[120px] shrink-0 rounded-full" />
              <div className="grid flex-1 grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-14 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Freshness row placeholder (label left, pill right) */}
            <div
              className="mt-2.5 flex items-center justify-between rounded-lg border p-2.5"
              aria-hidden="true"
            >
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-4 w-[110px] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== Guard: fewer than 2 resumes ============================== */

function NeedTwoResumes({ count }: { count: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center"
      aria-label="Not enough resumes to compare"
    >
      <div
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <GitCompareArrows className="size-7" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold">
        Two resumes make a match
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {count === 1
          ? "You have a single resume — duplicate it or create another version in Resume Studio, then come back to compare."
          : "Create your first resume in Resume Studio, then come back to compare versions side by side."}
      </p>
      <Button
        asChild
        className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
      >
        <Link href="/dashboard/builder">
          Open Resume Studio
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </motion.section>
  );
}

/* ============================== Category breakdown (scan history) ============================== */

/* Read-only consumer of ScoreEntry.categories — mirrors the canonical
   breakdown order of atsAnalyze() (Keywords/Sections/Impact/Formatting/
   Length, normalized 0–100 per label). Pure module, no store writes. */

const CATEGORY_LABELS = [
  "Keywords",
  "Sections",
  "Impact",
  "Formatting",
  "Length",
] as const;

const BAR_COLOR_A = "bg-emerald-500 dark:bg-emerald-400";
const BAR_COLOR_B = "bg-teal-500 dark:bg-teal-400";
const CHIP_CLASS_A =
  "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400";
const CHIP_CLASS_B =
  "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-400";

interface CategoryRow {
  label: string;
  a?: number;
  b?: number;
}

const clampPct = (v: number): number =>
  Math.max(0, Math.min(100, Math.round(v)));

/** Latest history entry for a resume that actually carries categorical
 *  sub-scores (older entries predate per-category logging). Defensive:
 *  max by `at`, same convention as lastScoreEntryFor() in ats-delta. */
function latestCategoricalEntry(
  history: ScoreEntry[],
  resumeId: string
): ScoreEntry | null {
  let latest: ScoreEntry | null = null;
  for (const entry of history) {
    if (entry.resumeId !== resumeId) continue;
    const cats = entry.categories;
    if (!cats || typeof cats !== "object" || Array.isArray(cats)) continue;
    if (
      !Object.values(cats).some(
        (v) => typeof v === "number" && Number.isFinite(v)
      )
    )
      continue;
    if (!latest || entry.at > latest.at) latest = entry;
  }
  return latest;
}

/** Finite-only view of a stored categories map. */
function sanitizeCategories(
  entry: ScoreEntry | null
): Record<string, number> | null {
  if (!entry?.categories) return null;
  const out: Record<string, number> = {};
  for (const [label, value] of Object.entries(entry.categories)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[label] = clampPct(value);
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Canonical breakdown labels first, then any extra labels present in
 *  either side's history (appended in first-seen order). */
function collectLabels(
  valuesA: Record<string, number> | null,
  valuesB: Record<string, number> | null
): string[] {
  const labels: string[] = [...CATEGORY_LABELS];
  for (const source of [valuesA, valuesB]) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      if (!labels.includes(key)) labels.push(key);
    }
  }
  return labels;
}

/** One-line leader summary, e.g. "Resume A leads on 4 of 5 categories."
 *  Null when the two sides share no comparable category. */
function buildLeadInsight(rows: CategoryRow[]): string | null {
  const comparable = rows.filter(
    (r) => r.a !== undefined && r.b !== undefined
  );
  if (comparable.length === 0) return null;
  const n = comparable.length;
  const aLeads = comparable.filter((r) => r.a! > r.b!).length;
  const bLeads = comparable.filter((r) => r.b! > r.a!).length;
  const ties = n - aLeads - bLeads;
  if (aLeads === 0 && bLeads === 0) {
    return `Dead even across all ${n} categories.`;
  }
  if (aLeads >= bLeads) {
    let s = `Resume A leads on ${aLeads} of ${n} categories.`;
    if (bLeads > 0) s += ` Resume B takes ${bLeads}.`;
    else if (ties > 0) s += ` ${ties} dead even.`;
    return s;
  }
  let s = `Resume B leads on ${bLeads} of ${n} categories.`;
  if (aLeads > 0) s += ` Resume A takes ${aLeads}.`;
  else if (ties > 0) s += ` ${ties} dead even.`;
  return s;
}

/** One slim horizontal bar (or the muted "no scan" fallback) for a side. */
function CategoryBarLine({
  side,
  color,
  chipClass,
  value,
  lead,
  reduceMotion,
}: {
  side: "a" | "b";
  color: string;
  chipClass: string;
  value: number | undefined;
  /** Lead magnitude when this side wins the row, else null. */
  lead: number | null;
  reduceMotion: boolean | null;
}) {
  if (value === undefined) {
    return (
      <p
        data-cat-missing={side}
        className="text-[11px] italic leading-snug text-muted-foreground"
      >
        No scan yet — run the ATS scanner
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <motion.div
          data-cat-bar={side}
          data-cat-value={value}
          className={cn("h-full rounded-full", color)}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground/90">
        {value}
      </span>
      {/* Fixed-width chip slot keeps the two sides' numbers aligned */}
      <span className="flex w-12 shrink-0 justify-end">
        {lead !== null ? (
          <span
            data-cat-delta={side}
            data-delta-value={lead}
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-inset",
              chipClass
            )}
            aria-hidden="true"
          >
            +{lead}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * "Category breakdown" card: for each of the 5 ATS categories, both
 * resumes' latest known per-category values (from scoreHistory) as two
 * slim bars — A emerald, B teal — with a delta chip on the leading side
 * and a one-line leader insight. Data comes from each resume's latest
 * scoreHistory entry that carries `categories`; sides without one get a
 * muted fallback. Hidden entirely when NEITHER side has any.
 *
 * Pair sync: CompareBoard owns the A/B selection and mirrors it into the
 * URL (?a=&b=, history.replaceState). This component reads that query and
 * re-syncs by wrapping replaceState for its lifetime (restored on
 * unmount) — replaceState fires no events, so this is the only way to
 * follow the board's swaps/picks without touching its files.
 */
export function CategoryBreakdown() {
  const resumes = useResumeStore((s) => s.resumes);
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  const reduceMotion = useReducedMotion();
  /* Until the persisted store has rehydrated, every entry is treated as
     seed-neutral (no categories) — the section renders its muted shape so a
     rehydrate landing inside a hydration pass can never swap element types
     or counts mid-hydration. */
  const hydrated = useStoreHydrated();

  const readPair = React.useCallback((): { a: string; b: string } | null => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    const b = params.get("b");
    if (!a || !b || a === b) return null;
    return { a, b };
  }, []);

  // Initialize from the URL (client-only component — the page gate keeps
  // this out of the hydration tree) so the first paint already matches
  // the board; the effect below keeps it in sync afterwards.
  const [pair, setPair] = React.useState(readPair);

  React.useEffect(() => {
    /* Deferred via queueMicrotask: sync() fires from inside a patched
       history.replaceState that CompareBoard invokes mid-commit. Calling
       setPair synchronously there lands inside React's insertion-effect
       window ("useInsertionEffect must not schedule updates"). A microtask
       moves the update safely outside React's sync windows. */
    const sync = () => {
      queueMicrotask(() => {
        const next = readPair();
        setPair((prev) =>
          prev?.a === next?.a && prev?.b === next?.b ? prev : next
        );
      });
    };
    sync();
    const original = window.history.replaceState.bind(window.history);
    const patched: typeof original = (...args) => {
      original(...args);
      sync();
    };
    window.history.replaceState = patched;
    window.addEventListener("popstate", sync);
    return () => {
      window.history.replaceState = original;
      window.removeEventListener("popstate", sync);
    };
  }, [readPair]);

  // Resolve the pair with the same graceful fallbacks as CompareBoard.
  const rawA = pair ? resumes.find((r) => r.id === pair.a) : undefined;
  const rawB = pair ? resumes.find((r) => r.id === pair.b) : undefined;
  const resumeA = rawA ?? resumes.find((r) => r.id !== rawB?.id) ?? resumes[0];
  const resumeB = rawB ?? resumes.find((r) => r.id !== resumeA?.id) ?? resumes[0];
  if (!resumeA || !resumeB || resumeA.id === resumeB.id) return null;

  const entryA = hydrated ? latestCategoricalEntry(scoreHistory, resumeA.id) : null;
  const entryB = hydrated ? latestCategoricalEntry(scoreHistory, resumeB.id) : null;
  const valuesA = sanitizeCategories(entryA);
  const valuesB = sanitizeCategories(entryB);

  // Neither side has categorical history → no section at all.
  if (!valuesA && !valuesB) return null;

  const rows: CategoryRow[] = collectLabels(valuesA, valuesB).map((label) => ({
    label,
    a: valuesA?.[label],
    b: valuesB?.[label],
  }));
  const insight = buildLeadInsight(rows);

  return (
    <motion.section
      variants={staggerItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      aria-label="Category breakdown from scan history"
      data-category-breakdown="true"
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Category breakdown</CardTitle>
          <CardDescription>
            Latest per-category scores from each resume&apos;s scan history
            (0–100) — run the ATS scanner to refresh a side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", BAR_COLOR_A)}
              />
              Resume A — {resumeA.title}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", BAR_COLOR_B)}
              />
              Resume B — {resumeB.title}
            </span>
          </div>

          {/* Rows */}
          <div className="mt-4 space-y-3.5">
            {rows.map((row) => {
              if (row.a === undefined && row.b === undefined) return null;
              const lead: number | null =
                row.a !== undefined && row.b !== undefined && row.a !== row.b
                  ? Math.abs(row.a - row.b)
                  : null;
              const leadsA = lead !== null && (row.a as number) > (row.b as number);
              return (
                <div
                  key={row.label}
                  data-cat-row={row.label}
                  role="group"
                  aria-label={`${row.label}: Resume A ${row.a ?? "no scan"}, Resume B ${row.b ?? "no scan"}`}
                  className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <span
                    className="truncate text-xs font-medium text-muted-foreground"
                    title={row.label}
                  >
                    {row.label}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <CategoryBarLine
                      side="a"
                      color={BAR_COLOR_A}
                      chipClass={CHIP_CLASS_A}
                      value={row.a}
                      lead={leadsA ? lead : null}
                      reduceMotion={reduceMotion}
                    />
                    <CategoryBarLine
                      side="b"
                      color={BAR_COLOR_B}
                      chipClass={CHIP_CLASS_B}
                      value={row.b}
                      lead={!leadsA && lead !== null ? lead : null}
                      reduceMotion={reduceMotion}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* One-line auto-insight */}
          {insight ? (
            <p
              data-cat-insight={insight}
              className="mt-4 flex items-start gap-1.5 border-t pt-3 text-xs leading-snug text-muted-foreground"
            >
              <GitCompareArrows
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{insight}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.section>
  );
}

/* ============================== Page ============================== */

export default function ComparePage() {
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <CompareSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {resumes.length >= 2 ? (
        <>
          <CompareBoard />
          <CategoryBreakdown />
        </>
      ) : (
        <>
          <ToolPageHeader
            icon={GitCompareArrows}
            title="Resume Comparison"
            description="Put two versions head-to-head: live previews, ATS scores, a category-by-category diff, and the keyword edge between them."
          />
          <NeedTwoResumes count={resumes.length} />
        </>
      )}
    </div>
  );
}
