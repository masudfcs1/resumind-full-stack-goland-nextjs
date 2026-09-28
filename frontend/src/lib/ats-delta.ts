import type { ScoreEntry } from "@/lib/resume-store";
import type { AtsBreakdownItem } from "@/lib/mock-ai";

/**
 * Pure helpers for the ATS "vs last scan" delta view. No side effects, no
 * store access — callers pass data in. (This module intentionally does not
 * touch resume-store.ts or mock-ai.ts.)
 */

export type DeltaKind = "up" | "down" | "flat";

/** Latest history entry for a resume (defensive: max by `at`, not array order). */
export function lastScoreEntryFor(
  history: ScoreEntry[],
  resumeId: string
): ScoreEntry | null {
  let latest: ScoreEntry | null = null;
  for (const entry of history) {
    if (entry.resumeId !== resumeId) continue;
    if (!latest || entry.at > latest.at) latest = entry;
  }
  return latest;
}

/** Direction of a score delta: +N up, −N down, 0 flat. */
export function deltaKind(diff: number): DeltaKind {
  if (diff > 0) return "up";
  if (diff < 0) return "down";
  return "flat";
}

/** Chip text for the delta: "+5" / "-5" / "±0" (flat renders "No change" in UI). */
export function formatDelta(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "±0";
}

/** Screen-reader description for the delta chip. */
export function deltaAriaLabel(diff: number): string {
  if (diff > 0) {
    return `Score improved by ${diff} point${diff === 1 ? "" : "s"} since the last scan`;
  }
  if (diff < 0) {
    const n = Math.abs(diff);
    return `Score dropped by ${n} point${n === 1 ? "" : "s"} since the last scan`;
  }
  return "No score change since the last scan";
}

/** Highest / lowest scoring category (by ratio, since maxes differ). */
export function bestWorstCategories(breakdown: AtsBreakdownItem[]): {
  best: AtsBreakdownItem | null;
  worst: AtsBreakdownItem | null;
} {
  if (breakdown.length === 0) return { best: null, worst: null };
  const ratio = (b: AtsBreakdownItem) => (b.max > 0 ? b.score / b.max : 0);
  const sorted = [...breakdown].sort((a, b) => ratio(b) - ratio(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return { best, worst };
}

/** One-line insight from the live breakdown, e.g.
 *  "Strongest: Keywords (24/30) · Weakest: Formatting (6/15)". */
export function deltaInsight(breakdown: AtsBreakdownItem[]): string | null {
  const { best, worst } = bestWorstCategories(breakdown);
  if (!best) return null;
  if (!worst || worst.label === best.label) {
    return `Strongest category: ${best.label} (${best.score}/${best.max})`;
  }
  return `Strongest: ${best.label} (${best.score}/${best.max}) · Weakest: ${worst.label} (${worst.score}/${worst.max})`;
}
