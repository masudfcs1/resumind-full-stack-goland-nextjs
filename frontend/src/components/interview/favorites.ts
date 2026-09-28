/**
 * Interview favorites — a tiny localStorage-backed set of starred companies
 * for the "From your tracker" section on the interview page.
 *
 * Stored as a JSON array of company keys (trimmed + lowercased display names)
 * under {@link FAVORITES_STORAGE_KEY}. Reads/writes are SSR-guarded and wrapped
 * in try/catch so server rendering, private browsing, or a full quota can never
 * crash the page — worst case favorites simply do not persist.
 */

/** localStorage key shared by the interview page. */
export const FAVORITES_STORAGE_KEY = "resumeforge-interview-favorites";

/** Normalizes a company display name to the stable key used for storage. */
export function favoriteKey(company: string): string {
  return company.trim().toLowerCase();
}

/**
 * Reads the saved favorite company keys. Returns an empty array on the server,
 * on malformed JSON, or when storage throws — never null, never throws.
 */
export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map(favoriteKey)
      .filter((v) => v.length > 0)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe, keep first
  } catch {
    return [];
  }
}

/**
 * Persists favorites (best effort). Returns false when storage is unavailable
 * or the write fails, so callers can surface a quiet warning.
 */
export function writeFavorites(keys: string[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(keys.map(favoriteKey).filter((v) => v.length > 0))
    );
    return true;
  } catch {
    return false;
  }
}
