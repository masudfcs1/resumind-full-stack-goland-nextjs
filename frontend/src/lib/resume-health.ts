import type { ScoreEntry } from "@/lib/resume-store";

/* ------------------------------------------------------------------ */
/* Resume health — scan RECENCY derived from the store's scoreHistory  */
/*                                                                     */
/* This is intentionally a different signal from the live ATS score    */
/* (atsAnalyze / atsScoreOf): health answers "how stale is the last    */
/* scan?", not "how good is the resume right now?".                    */
/* ------------------------------------------------------------------ */

export type HealthBucket = "fresh" | "aging" | "stale";

export interface ResumeHealth {
  bucket: HealthBucket;
  /** True when at least one ATS scan exists for this resume (even if old). */
  scanned: boolean;
  /** Most recent scan entry, or null when the resume was never scanned. */
  latest: ScoreEntry | null;
}

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/**
 * Derives scan recency for one resume from the store's score history.
 * Fresh: last scan < 24h ago · Aging: 1–7 days · Stale: > 7 days or never.
 */
export function resumeHealth(
  scoreHistory: readonly ScoreEntry[],
  resumeId: string,
  now: number = Date.now()
): ResumeHealth {
  let latest: ScoreEntry | null = null;
  for (const entry of scoreHistory) {
    if (entry.resumeId !== resumeId) continue;
    if (latest === null || entry.at > latest.at) latest = entry;
  }
  if (latest === null) return { bucket: "stale", scanned: false, latest: null };

  const age = now - latest.at;
  if (age < DAY) return { bucket: "fresh", scanned: true, latest };
  if (age <= WEEK) return { bucket: "aging", scanned: true, latest };
  return { bucket: "stale", scanned: true, latest };
}

/**
 * Sort rank for the "Health first" ordering (best → worst):
 * fresh (0) → aging (1) → stale with an old scan (2) → never scanned (3).
 * Pair with a secondary `updatedAt desc` comparison for deterministic order
 * inside each bucket.
 */
export function healthRank(health: ResumeHealth): number {
  if (health.bucket === "fresh") return 0;
  if (health.bucket === "aging") return 1;
  return health.scanned ? 2 : 3;
}
