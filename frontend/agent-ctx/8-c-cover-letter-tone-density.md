# Task 8-c — Cover Letter: tone-aware tailoring + keyword density guard

Agent: Cover Letter Generator agent (round 8c)
Status: DONE — lint clean, tsc src/ 0 errors, QA passed (session s8c), worklog appended.

## What changed
- src/lib/mock-ai.ts (ADDITIVE ONLY):
  - `TAILOR_TONE_LEADS` / `TAILOR_TONE_SOLO_LEADS`: per-tone voice for the injected "JD alignment" paragraph (professional keeps legacy `TAILOR_LEADS` + new `TAILOR_SOLO_LEAD` constant, behavior identical).
  - Density guard in `generateTailoredCoverLetter`: `cap = max(1, min(5, floor(baseWords/120), kws.length))`; `injected = kws.slice(0, cap)`.
  - `TailoredCoverLetter` return extended: `appliedCap: number`, `requestedKeywords: string[]` (pre-cap post-filter list). No signatures broken; `tailorKeywords` untouched.
- src/app/dashboard/cover-letter/page.tsx:
  - `requested` state through buildLetter/generate/regenerate; tone chip (`Badge variant="outline"`, "Tone: X") inside the genKey-staggered strip; density note (`motion.p`, Info icon, amber-700 dark:amber-400) rendered ONLY when `requested.length > injected.length`, hidden otherwise; plain letters show no strip.

## QA evidence
- Script: tool-results/qa8c-cap-verify.ts — 19/19 checks (cap formula, min-1, prefix invariant, 4 tone voices, openers intact, no-cap hidden).
- Browser s8c: match scan flow → tailored Professional letter (badge + chip + Edge chip + amber "1 of 2 requested keywords injected (short letter)") → Enthusiastic regenerate (letters differ via eval diff, chip updates, enthusiastic lead confirmed) → 390x844 no overflow (scrollW 390) → dark note amber-400 → reload console clean, 0 page errors.
- Screenshots: tool-results/qa8c-desktop-professional.png, qa8c-desktop-enthusiastic.png, qa8c-mobile-tailored.png, qa8c-mobile-dark-note.png, qa8c-desktop-dark.png.

## Notes for next agents
- "Requested" = post-stop-filter, pre-cap keyword list (not raw tailorKeywords output) — the note therefore never blames the prose filter for dropped keywords.
- Note text is spec-fixed "(short letter)"; cap can also come from the absolute 5 max only on 600+ word letters (rare).
- Do not remove the `?? TAILOR_LEADS` / `?? [TAILOR_SOLO_LEAD]` fallbacks — they pin professional behavior.
