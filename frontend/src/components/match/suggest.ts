/**
 * Deterministic tailoring-suggestion generator for the Job Match Scanner.
 * Given a missing keyword and resume context, produces a concrete, stable
 * suggestion line (same keyword + same resume always yields the same text —
 * no randomness, so results don't flicker between re-renders).
 */

import type { ResumeData } from "@/lib/resume-store";

export interface Suggestion {
  keyword: string;
  text: string;
}

/* ------------------------------ keyword hashes ---------------------------- */

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/* ------------------------- keyword classification ------------------------- */

const TECH_HINT =
  /[.#+/]|node|react|sql|api|aws|gcp|python|typescript|javascript|java|kubernetes|docker|graphql|rust|ruby|php|swift|kotlin|terraform|tailwind|next\.js|figma|airflow|spark|dbt|pytorch|tensorflow|pandas|playwright|jest|ci|cd/;

const SOFT_WORDS = new Set([
  "communication",
  "leadership",
  "collaboration",
  "stakeholders",
  "stakeholder",
  "mentoring",
  "mentorship",
  "agile",
  "planning",
  "strategy",
  "research",
  "writing",
  "presentation",
  "negotiation",
  "ownership",
  "craft",
  "simplicity",
  "clarity",
  "feedback",
  "product",
  "roadmap",
  "analytics",
  "marketing",
  "seo",
  "growth",
  "recruiting",
  "hiring",
  "onboarding",
  "documentation",
  "process",
  "prioritization",
]);

function isSoftKeyword(kw: string): boolean {
  return !TECH_HINT.test(kw) && SOFT_WORDS.has(kw);
}

/* ---------------------------- display casing ----------------------------- */

const CASE_OVERRIDES: Record<string, string> = {
  "ci/cd": "CI/CD",
  "ci": "CI",
  "cd": "CD",
  sql: "SQL",
  api: "API",
  apis: "APIs",
  aws: "AWS",
  gcp: "GCP",
  css: "CSS",
  html: "HTML",
  seo: "SEO",
  cro: "CRO",
  ui: "UI",
  ux: "UX",
  okr: "OKRs",
  okrs: "OKRs",
  kpi: "KPIs",
  llm: "LLM",
  llms: "LLMs",
  "a/b": "A/B",
  ml: "ML",
  saas: "SaaS",
  rfc: "RFC",
  "wcag": "WCAG",
};

/** Human-friendly label for a lowercase extracted keyword, e.g. "graphql" → "GraphQL". */
export function keywordLabel(kw: string): string {
  const key = kw.trim().toLowerCase();
  if (CASE_OVERRIDES[key]) return CASE_OVERRIDES[key];
  return key
    .split(" ")
    .map((word) => {
      if (CASE_OVERRIDES[word]) return CASE_OVERRIDES[word];
      return word
        .split(".")
        .map((seg) => (seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : seg))
        .join(".");
    })
    .join(" ");
}

/* ------------------------------ templates --------------------------------- */

interface Ctx {
  role: string;
  company: string;
  topSkill: string;
  /** Stable pseudo-random-ish numbers derived from the keyword hash. */
  n1: number;
  n2: number;
  n3: number;
}

function techTemplates(kw: string, label: string, c: Ctx): string[] {
  return [
    `Mention ${label} in a bullet — e.g. "Built ${label}-backed features serving ${c.n1}k+ users at ${c.company}"`,
    `Add ${label} next to ${c.topSkill} in your skills, then back it with a bullet — e.g. "Shipped ${label}-powered workflows that cut release turnaround by ${c.n2}%"`,
    `Pair ${label} with measurable impact — e.g. "Leveraged ${label} to reduce review cycles by ${c.n2}% quarter over quarter"`,
    `Anchor a project around ${label} — e.g. "Prototyped a ${label} workflow that became the default for the ${c.company} team"`,
  ];
}

function softTemplates(kw: string, label: string, c: Ctx): string[] {
  return [
    `Prove ${label} with numbers — e.g. "Aligned ${c.n3} stakeholders across ${c.n1 % 4 + 2} teams to land the roadmap on schedule"`,
    `Work ${label} into a bullet — e.g. "Led ${label} sessions that lifted team velocity ${c.n2}% in two sprints"`,
    `Tie ${label} to outcomes in your summary — e.g. "${c.role} known for ${label} and deep ${c.topSkill} expertise"`,
    `Back ${label} with scope — e.g. "Owned ${label} for a ${c.n3}-person team through ${c.n1 % 5 + 2} product launches"`,
  ];
}

function generalTemplates(kw: string, label: string, c: Ctx): string[] {
  return [
    `Mention ${label} in a bullet — e.g. "Drove ${label} initiatives that improved delivery by ${c.n2}%"`,
    `Work ${label} into your summary — e.g. "${c.role} specializing in ${label} and ${c.topSkill}"`,
    `Pair ${label} with a result — e.g. "Applied ${label} across ${c.n3} projects, cutting onboarding effort by ${c.n2}%"`,
  ];
}

/* ------------------------------ context ----------------------------------- */

function contextFrom(resume: ResumeData, kw: string): Ctx {
  const role =
    resume.personal.jobTitle || resume.experience[0]?.role || "Product engineer";
  const company = resume.experience[0]?.company || "the team";
  const topSkill = resume.skills[0]?.name || "product craft";
  const h = hashStr(kw);
  return {
    role,
    company,
    topSkill,
    n1: 8 + (h % 40), // 8..47  (k users / teams)
    n2: 12 + ((h >> 3) % 27), // 12..38 (percent)
    n3: 3 + ((h >> 6) % 7), // 3..9   (counts)
  };
}

/**
 * Build up to `limit` concrete suggestions for the given missing keywords.
 * Deterministic per (keyword, resume): no randomness, no flicker.
 */
export function buildSuggestions(
  resume: ResumeData,
  keywords: string[],
  limit = 6
): Suggestion[] {
  return keywords.slice(0, limit).map((kw) => {
    const label = keywordLabel(kw);
    const c = contextFrom(resume, kw);
    const pool = isSoftKeyword(kw)
      ? softTemplates(kw, label, c)
      : TECH_HINT.test(kw)
        ? techTemplates(kw, label, c)
        : generalTemplates(kw, label, c);
    const text = pool[hashStr(`${kw}:${resume.id}`) % pool.length];
    return { keyword: kw, text };
  });
}
