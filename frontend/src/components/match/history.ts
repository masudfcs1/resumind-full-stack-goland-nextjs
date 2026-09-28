/**
 * Local persistence for the Job Match Scanner's recent analyses.
 * Stored under `resumeforge-match-history` (last 5 entries, newest first).
 * All reads are guarded for SSR and JSON parse failures.
 */

export interface MatchHistoryEntry {
  id: string;
  resumeId: string;
  resumeTitle: string;
  /** First meaningful line of the JD, trimmed to 60 chars. */
  jdBrief: string;
  /** Full JD text so a history row can restore the exact analysis. */
  jd: string;
  score: number;
  /** Epoch milliseconds of the analysis. */
  at: number;
}

const STORAGE_KEY = "resumeforge-match-history";
const MAX_ENTRIES = 5;

/** First non-empty line of the JD, trimmed to 60 characters. */
export function jdBrief(jd: string): string {
  const first = jd
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  const line = first ?? "Job description";
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

/** Deterministic djb2-style hash, base36 — used for result keys and dedupe. */
export function hashJd(jd: string): string {
  let h = 5381;
  for (let i = 0; i < jd.length; i++) {
    h = ((h << 5) + h + jd.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function isEntry(value: unknown): value is MatchHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.resumeId === "string" &&
    typeof v.resumeTitle === "string" &&
    typeof v.jdBrief === "string" &&
    typeof v.jd === "string" &&
    typeof v.score === "number" &&
    typeof v.at === "number"
  );
}

/** Read history from localStorage. Never throws; returns [] on any failure. */
export function loadMatchHistory(): MatchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Persist history (newest first, capped). Never throws. */
export function saveMatchHistory(entries: MatchHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES))
    );
  } catch {
    // Storage unavailable (private mode / quota) — history is best-effort.
  }
}

/** Prepend an entry, deduping on resumeId + identical JD. Returns the new list. */
export function upsertMatchHistory(
  current: MatchHistoryEntry[],
  entry: MatchHistoryEntry
): MatchHistoryEntry[] {
  const rest = current.filter(
    (h) => !(h.resumeId === entry.resumeId && h.jd === entry.jd)
  );
  return [entry, ...rest].slice(0, MAX_ENTRIES);
}
