"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { AtsBreakdownItem } from "@/lib/mock-ai";
import { deltaKind, formatDelta, type DeltaKind } from "@/lib/ats-delta";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Per-category score history + delta chips for the ATS "vs last scan" */
/* panel.                                                              */
/*                                                                     */
/* The store's logScore() accepts an optional 4th argument — a map of  */
/* per-category sub-scores (0–100, keyed by breakdown label). This     */
/* module owns that contract on the UI side:                           */
/*   - normalizeBreakdownCategories() converts an atsAnalyze()         */
/*     breakdown ({label, score, max}) into the stored 0–100 map.      */
/*   - categoryDeltas() diffs two such maps, skipping categories that  */
/*     are missing from either side (older entries carry none).        */
/*   - <CategoryDeltaChips /> renders the diff as small tinted badges  */
/*     plus a one-line strongest-gain / weakest-drop insight.          */
/* Pure module: no store access, no side effects.                      */
/* ------------------------------------------------------------------ */

/** Convert a live scan breakdown into the per-category map stored on
 *  ScoreEntry.categories (0–100 per label, normalized by max). */
export function normalizeBreakdownCategories(
  breakdown: AtsBreakdownItem[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of breakdown) {
    out[b.label] = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
  }
  return out;
}

export interface CategoryDelta {
  label: string;
  delta: number; // current − previous (both 0–100)
}

/** Diff two category maps. Categories missing from either side are
 *  skipped, so histories that predate per-category logging simply
 *  produce no chips. Order follows the `current` map (breakdown order). */
export function categoryDeltas(
  previous: Record<string, number>,
  current: Record<string, number>
): CategoryDelta[] {
  const deltas: CategoryDelta[] = [];
  for (const label of Object.keys(current)) {
    if (!(label in previous)) continue;
    const prev = Number(previous[label]);
    const next = Number(current[label]);
    if (!Number.isFinite(prev) || !Number.isFinite(next)) continue;
    deltas.push({ label, delta: Math.round(next - prev) });
  }
  return deltas;
}

/** One-line strongest-gain / weakest-drop sentence (null when fewer
 *  than 2 categories are comparable). */
export function categoryDeltaInsight(
  deltas: CategoryDelta[]
): string | null {
  if (deltas.length < 2) return null;
  const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
  const worst = deltas.reduce((a, b) => (b.delta < a.delta ? b : a));
  if (best.delta === worst.delta) {
    return best.delta === 0
      ? `All ${deltas.length} comparable categories held steady since the last scan.`
      : `All ${deltas.length} comparable categories moved ${formatDelta(best.delta)} — even progress across the board.`;
  }
  if (best.delta > 0 && worst.delta < 0) {
    return `Strongest gain: ${best.label} (${formatDelta(best.delta)}) · Biggest drop: ${worst.label} (${formatDelta(worst.delta)})`;
  }
  if (best.delta > 0) {
    return `Strongest gain: ${best.label} (${formatDelta(best.delta)}) · No category dropped.`;
  }
  return `Biggest drop: ${worst.label} (${formatDelta(worst.delta)}) · No category improved.`;
}

const CATEGORY_CHIP_CLASS: Record<DeltaKind, string> = {
  up: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  down: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400",
  flat: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
};

function CategoryChipIcon({ delta }: { delta: number }) {
  const Icon =
    delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return <Icon className="size-3" aria-hidden="true" />;
}

/**
 * Additive sub-section of the "vs last scan" panel: one small tinted
 * badge per comparable category ("Keywords +6" / "Impact −3" /
 * "Formatting ±0"), plus a strongest-gain/weakest-drop insight when at
 * least two categories are comparable. Renders nothing when the two
 * sides share no categories (e.g. the previous scan predates
 * per-category history).
 */
export function CategoryDeltaChips({
  previous,
  current,
}: {
  previous: Record<string, number>;
  current: Record<string, number>;
}) {
  const deltas = categoryDeltas(previous, current);
  if (deltas.length === 0) return null;
  const insight = categoryDeltaInsight(deltas);

  return (
    <div
      data-category-deltas
      aria-label="Per-category changes since the last scan"
      className="mt-3 border-t pt-3"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {deltas.map((d) => {
          const kind = deltaKind(d.delta);
          return (
            <span
              key={d.label}
              data-category-delta={d.label}
              data-delta-value={d.delta}
              aria-label={`${d.label}: ${Math.abs(d.delta) === 0 ? "no change" : `${Math.abs(d.delta)} point${Math.abs(d.delta) === 1 ? "" : "s"} ${d.delta > 0 ? "better" : "worse"}`} since the last scan`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                CATEGORY_CHIP_CLASS[kind]
              )}
            >
              <CategoryChipIcon delta={d.delta} />
              <span>{d.label}</span>
              <span className="font-bold tabular-nums">
                {formatDelta(d.delta)}
              </span>
            </span>
          );
        })}
      </div>
      {insight ? (
        <p className="mt-2 text-xs leading-snug text-muted-foreground">
          {insight}
        </p>
      ) : null}
    </div>
  );
}
