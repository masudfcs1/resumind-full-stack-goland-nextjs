/**
 * "From your tracker" — deterministic, company-specific interview question
 * sets built from the user's Job Tracker applications.
 *
 * Given a company, role, and pipeline stage, composes a 9-question set:
 *  (a) 4 company-specific templates (why here, mission, 90-day product, values)
 *  (b) 2 role-tailored questions reusing the tracked role title
 *  (c) 3 strong behavioral/technical questions pulled from QUESTION_BANK,
 *      filtered by role relevance
 *
 * Everything is seeded from a djb2 hash of the inputs (same approach as
 * src/components/match/suggest.ts), so the same company + role + stage +
 * variant always produces the exact same set — no Math.random, no flicker.
 *
 * Difficulties follow the practice ladder: each question's tier is derived
 * PURELY deterministically from its index in the set + the seed (an
 * easy,easy,medium,medium,hard cycle offset by seed % 3), so the same
 * company + variant always yields the same difficulty sequence and the set
 * always walks a balanced Easy → Medium → Hard ramp.
 */

import type { ApplicationStage, ResumeData } from "@/lib/resume-store";

import {
  QUESTION_BANK,
  resolvePlaceholders,
  type Difficulty,
  type PracticeQuestion,
  type Question,
  type QuestionCategory,
  type StarAnswer,
} from "./question-bank";

/** Company set questions reuse the exact question shape the page renders. */
export type InterviewQuestion = PracticeQuestion;

/** Options for {@link buildCompanyQuestions}. */
export interface CompanyQuestionOptions {
  /**
   * Active resume — resolves {company}/{skill}/{role} inside pulled bank
   * questions exactly like the main generator does. Optional; falls back to
   * neutral phrasing when omitted.
   */
  resume?: ResumeData;
  /** Changes the seeded pick of pulled questions (used by "Shuffle again"). */
  variant?: number;
}

/* ============================== Seeded randomness ============================== */

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Tiny deterministic LCG (mulberry32) — seeded picks never touch Math.random. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(input: readonly T[], seed: number): T[] {
  const arr = [...input];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
  return arr;
}

/* ============================== Difficulty ladder ============================== */

/**
 * Deterministic difficulty cycle for company sets. A 9-question set walks the
 * practice ladder: the pattern repeats easy,easy,medium,medium,hard across
 * question indexes, offset by seed % 3 so companies and variants differ
 * slightly while every set keeps a balanced Easy → Medium → Hard ramp.
 */
export const LADDER_PATTERN: readonly Difficulty[] = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
];

/**
 * Pure deterministic difficulty for a question at {@link index} in a set
 * seeded with {@link seed}. No Math.random, no Date — SSR-safe and stable.
 */
export function ladderDifficulty(index: number, seed: number): Difficulty {
  const offset = ((seed % 3) + 3) % 3;
  const at = ((index + offset) % LADDER_PATTERN.length + LADDER_PATTERN.length) %
    LADDER_PATTERN.length;
  return LADDER_PATTERN[at] ?? "medium";
}

/* ============================== Stage-aware coaching ============================== */

/** One stage-aware coaching hint, shown under the company set header. */
export const STAGE_HINT: Record<ApplicationStage, string> = {
  saved:
    "Application not sent yet — treat this set as research prep and sharpen your pitch before you hit apply.",
  applied:
    "Resume is in their pipeline — expect a screening call, so keep every answer crisp and under 90 seconds.",
  interview:
    "You are in the loop — go deep on specifics: metrics, team-fit stories, and smart questions back to them.",
  offer:
    "Negotiation-ready answers — practice framing your value, scope, and comp asks with calm confidence.",
  rejected:
    "A past rejection — rehearse sharper answers now so the next company gets your strongest version.",
};

/* ============================== Company avatar ============================== */

/** Tasteful gradient pairs for company avatars — emerald-family preferred, no blue/indigo. */
const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-emerald-600 to-green-600",
] as const;

/** Deterministic gradient pick for a company avatar (hash-based). */
export function companyAvatarGradient(company: string): string {
  const h = djb2(company.trim().toLowerCase());
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length] ?? "from-emerald-500 to-teal-600";
}

/* ============================== Fixed templates ============================== */

interface TrackerTemplate {
  category: QuestionCategory;
  /** Raw text with {company}/{role} placeholders, resolved from the tracker. */
  question: string;
  star: StarAnswer;
  tips: string[];
  /** Marks the card with the violet "Tailored" chip (built from the user's tracker). */
  tailored: boolean;
}

const TRACKER_TEMPLATES: TrackerTemplate[] = [
  {
    category: "company",
    question: "Why do you want to work at {company}?",
    star: {
      situation:
        "Open with one genuine hook: what {company} builds and why it matters to you personally.",
      task: "Connect the hook to your own track record — admiration alone is not an answer.",
      action:
        "Cite proof you did the homework: products used, launches followed, problems you want to own.",
      result: "Land on the value you would add to {company}, not only what you want from them.",
    },
    tips: [
      "Use their product the week before — specifics beat flattery",
      "Name the moment you became interested — a launch, a doc, a talk",
      "Tie one line back to the {role} scope you are interviewing for",
    ],
    tailored: true,
  },
  {
    category: "company",
    question: "What do you know about {company}'s mission and recent launches?",
    star: {
      situation: "State the mission in your own words — one sentence, no marketing speak.",
      task: "Pick one or two recent launches or milestones that genuinely interest you.",
      action: "Explain why those launches matter: users served, problems solved, bets being made.",
      result: "Close with a question that shows insider-level curiosity about what comes next.",
    },
    tips: [
      "Read the blog, changelog, and careers page the night before",
      "Paraphrasing the mission simply beats reciting it word for word",
      "Two launches handled deeply beat five name-dropped",
    ],
    tailored: true,
  },
  {
    category: "company",
    question: "How would you improve {company}'s product in your first 90 days?",
    star: {
      situation: "Anchor on one concrete feature or workflow you would improve — not a list.",
      task: "Frame the user problem behind it and why it matters to {company}'s goals.",
      action: "Sketch a 90-day arc: listen first, instrument what exists, ship one visible win.",
      result: "Show judgment: name what you would measure before claiming success.",
    },
    tips: [
      "Critique with empathy — assume the current design had constraints",
      "One sharp idea with a plan beats ten shallow ones",
      "Stay humble: acknowledge you may be missing context",
    ],
    tailored: true,
  },
  {
    category: "company",
    question: "Which of {company}'s values resonates most with you and why?",
    star: {
      situation: "Pick one value and define it as you genuinely understand it.",
      task: "Explain why that value fits the way you already work.",
      action: "Prove it with a story where you lived that value under real pressure.",
      result: "Connect it to how you would operate inside {company} from day one.",
    },
    tips: [
      "Read their values page — pick the one you can prove, not just like",
      "A concrete story beats reciting the value verbatim",
      "One value, owned fully, is more credible than five name-checked",
    ],
    tailored: true,
  },
  {
    category: "behavioral",
    question: "Walk me through a project that prepared you for {role} work.",
    star: {
      situation: "Pick the project with the closest overlap to {role} responsibilities.",
      task: "Your specific mandate — scope, constraints, and what success meant.",
      action: "The decisions you drove, the trade-offs you made, and how you kept others aligned.",
      result: "The measurable outcome — plus the part that maps directly to this role.",
    },
    tips: [
      "Structure it: context, your role, decisions, numbers",
      "Choose depth over breadth — one project, told well",
      "Name the methods or tooling this team will recognize",
    ],
    tailored: true,
  },
  {
    category: "behavioral",
    question: "How does your experience map to a typical {role} day here?",
    star: {
      situation: "Sketch a real day from your current or last role that resembles this one.",
      task: "Highlight the recurring activities that overlap with {role} work.",
      action: "Show how you prioritize: deep work blocks, collaboration, communication rhythms.",
      result: "End on what you would keep doing and what you would adapt to their team.",
    },
    tips: [
      "Be concrete: meetings, focus blocks, artifacts you produce",
      "Mirror the language from the job description",
      "Flag one gap honestly and how you plan to close it",
    ],
    tailored: true,
  },
];

/* ============================== Role relevance ============================== */

/** Bank categories whose questions fit the tracked role's keywords. */
function relevantCategories(role: string): QuestionCategory[] {
  const r = role.toLowerCase();
  const cats = new Set<QuestionCategory>(["behavioral"]);
  if (/engineer|developer|data|scientist|analyst|architect|devops/.test(r)) {
    cats.add("technical");
  }
  if (/lead|senior|principal|staff|manager|head|director|founder/.test(r)) {
    cats.add("leadership");
  }
  if (/manager|product|design|program|operations/.test(r)) {
    cats.add("situational");
  }
  return [...cats];
}

/* ============================== Instantiation ============================== */

/** Fills tracker placeholders ({company}/{role}) — the tracker is the source here. */
function fill(text: string, company: string, role: string): string {
  return text.replace(/\{company\}/g, company).replace(/\{role\}/g, role);
}

/**
 * Resolves a pulled bank question's placeholders. Uses the active resume (same
 * semantics as the main generator: {company} = current employer, {role} = your
 * title, {skill} = top skill); falls back to neutral phrasing without one.
 */
function resolveBankText(text: string, resume: ResumeData | undefined, role: string): string {
  if (resume) return resolvePlaceholders(text, resume);
  return text
    .replace(/\{company\}/g, "your current company")
    .replace(/\{skill\}/g, "your core skill")
    .replace(/\{role\}/g, role || "this role");
}

function instantiateTracker(
  t: TrackerTemplate,
  company: string,
  role: string,
  key: string,
  i: number,
  /** Ladder tier — derived deterministically from the set index + seed. */
  difficulty: Difficulty
): InterviewQuestion {
  return {
    id: `cq-${key}-${i}`,
    category: t.category,
    difficulty,
    question: fill(t.question, company, role),
    text: fill(t.question, company, role),
    isTailored: t.tailored,
    star: t.star,
    resolvedStar: {
      situation: fill(t.star.situation, company, role),
      task: fill(t.star.task, company, role),
      action: fill(t.star.action, company, role),
      result: fill(t.star.result, company, role),
    },
    tips: t.tips.map((tip) => fill(tip, company, role)),
  };
}

function instantiateBank(
  q: Question,
  resume: ResumeData | undefined,
  role: string,
  key: string,
  i: number,
  /** Ladder tier — derived deterministically from the set index + seed. */
  difficulty: Difficulty
): InterviewQuestion {
  const tailoredText = resume ? q.tailored?.(resume) : undefined;
  const useTailored = typeof tailoredText === "string" && tailoredText.length > 0;
  return {
    ...q,
    id: `cq-${key}-v-${i}`,
    difficulty,
    text: useTailored && tailoredText ? tailoredText : resolveBankText(q.question, resume, role),
    isTailored: useTailored,
    resolvedStar: {
      situation: resolveBankText(q.star.situation, resume, role),
      task: resolveBankText(q.star.task, resume, role),
      action: resolveBankText(q.star.action, resume, role),
      result: resolveBankText(q.star.result, resume, role),
    },
  };
}

/* ============================== Generator ============================== */

const PULLED_COUNT = 3;

/**
 * Builds a deterministic company-specific practice set from a tracked
 * application. Same inputs (+ variant) always yield the same questions.
 */
export function buildCompanyQuestions(
  company: string,
  role: string,
  stage: ApplicationStage,
  opts: CompanyQuestionOptions = {}
): InterviewQuestion[] {
  const { resume, variant = 0 } = opts; // stage shapes coaching (STAGE_HINT), not the mix
  const seed = djb2(`${company}:${role}:${stage}:${variant}`);
  const key = djb2(`${company}:${role}`.trim().toLowerCase()).toString(36);

  // Composed in set order; each question's ladder tier comes purely from its
  // index + seed (LADDER_PATTERN cycle), never from Math.random or the clock.
  const composed: InterviewQuestion[] = [];
  TRACKER_TEMPLATES.forEach((t, i) => {
    composed.push(
      instantiateTracker(t, company, role, key, i, ladderDifficulty(composed.length, seed))
    );
  });

  const cats = relevantCategories(role);
  const relevant = QUESTION_BANK.filter((q) => cats.includes(q.category));
  const strong = relevant.filter((q) => q.difficulty !== "easy");
  const pool = strong.length >= PULLED_COUNT ? strong : relevant;
  const picked = seededShuffle(pool, seed).slice(0, PULLED_COUNT);
  picked.forEach((q, i) => {
    composed.push(
      instantiateBank(q, resume, role, key, i, ladderDifficulty(composed.length, seed))
    );
  });

  return composed;
}
