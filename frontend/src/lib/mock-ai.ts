"use client";

import type { ResumeData } from "./resume-store";
import { formatMonth } from "./resume-store";

/* ============================== utils ============================== */

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ============================== AI Resume Writing ============================== */

const SUMMARY_TEMPLATES: Record<string, string[]> = {
  professional: [
    "{title} with {years}+ years of experience delivering measurable impact across {domain}. Proven track record of {highlight} while leveraging {skills}. Recognized for driving results in fast-paced, cross-functional environments.",
    "Results-oriented {title} bringing {years}+ years of expertise in {domain}. Skilled in {skills}, with a history of {highlight}. Passionate about turning complex problems into elegant, shippable solutions.",
  ],
  confident: [
    "Award-winning {title} with {years}+ years turning ambitious roadmaps into shipped products. I {highlight} — and I bring deep hands-on mastery of {skills} to every team I join.",
    "High-impact {title} with {years}+ years of experience. I specialize in {domain}, regularly {highlight}. My toolkit centers on {skills}, and my bias is always toward measurable outcomes.",
  ],
  friendly: [
    "Hey there — I'm a {title} with {years}+ years of experience who loves {domain}. My happy place is {highlight}, usually powered by {skills}. I thrive on teams that care about craft and kindness in equal measure.",
    "{title} with {years}+ years of experience and a genuine enthusiasm for {domain}. Known for {highlight} and for bringing positive energy (and strong {skills} chops) to every project.",
  ],
};

const DOMAIN_MAP: Array<{ match: RegExp; domain: string }> = [
  { match: /frontend|front-end|react|web|ui/i, domain: "modern web platforms and design systems" },
  { match: /backend|back-end|api|server|node/i, domain: "scalable backend systems and APIs" },
  { match: /data|ml|machine|ai|analyst|scientist/i, domain: "machine learning and large-scale analytics" },
  { match: /product|manager|pm/i, domain: "product strategy and growth" },
  { match: /design|ux|ui/i, domain: "user experience and interface design" },
  { match: /devops|sre|cloud|infra/i, domain: "cloud infrastructure and reliability engineering" },
  { match: /marketing|growth|seo/i, domain: "growth marketing and brand" },
  { match: /mobile|ios|android|flutter/i, domain: "mobile application development" },
];

const HIGHLIGHTS = [
  "reducing operational costs by up to 40%",
  "leading cross-functional teams to ship 25+ features per quarter",
  "improving key product metrics by 30% year-over-year",
  "launching products that reached 1M+ users",
  "cutting release cycles from weeks to days",
  "driving revenue growth of $2M+ annually",
];

export interface SummaryOptions {
  jobTitle: string;
  years?: number;
  skills: string[];
  tone?: "professional" | "confident" | "friendly";
}

export function generateSummary(opts: SummaryOptions): string {
  const tone = opts.tone ?? "professional";
  const templates = SUMMARY_TEMPLATES[tone] ?? SUMMARY_TEMPLATES.professional;
  const years = opts.years ?? 5;
  const domain = DOMAIN_MAP.find((d) => d.match.test(opts.jobTitle))?.domain ?? "cross-functional software delivery";
  const skills = (opts.skills.length ? opts.skills : ["problem solving", "collaboration", "ownership"])
    .slice(0, 3)
    .join(", ");
  return pick(templates)
    .replace("{title}", opts.jobTitle || "Software Professional")
    .replace("{years}", String(years))
    .replaceAll("{domain}", domain)
    .replace("{skills}", skills)
    .replace("{highlight}", pick(HIGHLIGHTS));
}

const ACTION_VERBS = [
  "Spearheaded", "Engineered", "Orchestrated", "Accelerated", "Transformed",
  "Championed", "Streamlined", "Delivered", "Architected", "Drove",
];

const METRICS = [
  "improving performance by 35%",
  "boosting user engagement by 28%",
  "reducing costs by $150K annually",
  "increasing conversion by 19%",
  "cutting load times by 45%",
  "saving 20+ hours per week across the team",
  "achieving 99.9% reliability",
  "scaling to 500K+ daily users",
];

const WEAK_STARTERS = ["Worked on", "Helped with", "Was responsible for", "Responsible for", "Did", "Made", "Assisted with", "Participated in", "Handled", "Took care of"];

export function enhanceBullet(text: string): string {
  let t = text.trim().replace(/^(i\s+|we\s+)/i, "");
  const weak = WEAK_STARTERS.find((w) => t.toLowerCase().startsWith(w.toLowerCase()));
  if (weak) t = t.slice(weak.length).replace(/^\s*(for|in|on|with)?\s*/i, "");
  t = t.charAt(0).toLowerCase() + t.slice(1);
  const verb = pick(ACTION_VERBS);
  const metric = pick(METRICS);
  const capitalized = t.charAt(0).toUpperCase() + t.slice(1);
  const endsWithPunct = /[.!?]$/.test(t);
  return `${verb} ${t}${endsWithPunct ? "" : ","} ${metric}`;
}

const SKILL_BANKS: Record<string, string[]> = {
  frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Vue", "Redux", "GraphQL", "Webpack", "Jest", "Accessibility"],
  backend: ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "Kafka", "Docker", "Kubernetes", "gRPC", "Microservices"],
  data: ["Python", "SQL", "PyTorch", "TensorFlow", "Pandas", "Spark", "Airflow", "scikit-learn", "Tableau", "dbt"],
  product: ["Roadmapping", "A/B Testing", "SQL", "Figma", "Jira", "User Research", "OKRs", "Analytics", "Stakeholder Mgmt", "Agile"],
  design: ["Figma", "Design Systems", "Prototyping", "User Research", "Motion Design", "Adobe CC", "Sketch", "Wireframing"],
  devops: ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Prometheus", "Grafana", "Linux", "Ansible", "GitOps"],
  marketing: ["SEO", "Google Analytics", "Content Strategy", "HubSpot", "Email Marketing", "Paid Ads", "CRO", "Copywriting"],
  mobile: ["Swift", "Kotlin", "React Native", "Flutter", "App Store Optimization", "Firebase", "MVVM"],
  default: ["Leadership", "Communication", "Project Management", "Problem Solving", "Collaboration", "Data Analysis"],
};

export function suggestSkills(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase();
  let bank = SKILL_BANKS.default;
  if (/frontend|front-end|react|web|ui/.test(t)) bank = SKILL_BANKS.frontend;
  else if (/backend|back-end|server|node|api/.test(t)) bank = SKILL_BANKS.backend;
  else if (/data|ml|machine|ai|scientist/.test(t)) bank = SKILL_BANKS.data;
  else if (/product|pm/.test(t)) bank = SKILL_BANKS.product;
  else if (/design|ux/.test(t)) bank = SKILL_BANKS.design;
  else if (/devops|sre|infra|cloud/.test(t)) bank = SKILL_BANKS.devops;
  else if (/marketing|growth/.test(t)) bank = SKILL_BANKS.marketing;
  else if (/mobile|ios|android|flutter/.test(t)) bank = SKILL_BANKS.mobile;
  return [...bank].sort(() => Math.random() - 0.5).slice(0, 8);
}

/* ============================== ATS Scanner ============================== */

export interface AtsIssue {
  id: string;
  severity: "critical" | "warning" | "good" | "info";
  category: string;
  title: string;
  detail: string;
  fix?: string;
}

export interface AtsBreakdownItem {
  label: string;
  score: number;
  max: number;
  hint: string;
}

export interface AtsResult {
  score: number;
  grade: "Excellent" | "Good" | "Fair" | "Needs Work";
  breakdown: AtsBreakdownItem[];
  issues: AtsIssue[];
  matchedKeywords: string[];
  missingKeywords: string[];
  wordCount: number;
}

function resumeToText(resume: ResumeData): string {
  const parts: string[] = [
    resume.personal.fullName,
    resume.personal.jobTitle,
    resume.summary,
    ...resume.skills.map((s) => s.name),
  ];
  for (const e of resume.experience) {
    parts.push(e.role, e.company, ...e.bullets);
  }
  for (const e of resume.education) parts.push(e.degree, e.field, e.school);
  for (const p of resume.projects) parts.push(p.name, p.description, ...p.tech);
  for (const c of resume.certifications) parts.push(c.name, c.issuer);
  return parts.filter(Boolean).join(" ");
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: ["React", "TypeScript", "JavaScript", "CSS", "HTML", "testing", "performance", "accessibility", "REST", "GraphQL", "Git", "responsive"],
  backend: ["API", "Node", "Python", "SQL", "databases", "microservices", "Docker", "testing", "security", "scaling", "CI/CD", "Git"],
  data: ["Python", "SQL", "machine learning", "statistics", "Pandas", "modeling", "A/B testing", "data pipelines", "visualization", "cloud"],
  product: ["roadmap", "stakeholders", "A/B testing", "metrics", "user research", "go-to-market", "backlog", "OKR", "analytics", "strategy"],
  design: ["Figma", "prototyping", "user research", "design systems", "wireframes", "usability", "accessibility", "visual design"],
  default: ["leadership", "communication", "collaboration", "project management", "analytics", "agile", "stakeholders", "planning"],
};

function roleKeywordSet(resume: ResumeData): string[] {
  const t = `${resume.personal.jobTitle} ${resume.title}`.toLowerCase();
  if (/frontend|front-end|react|web|ui/.test(t)) return ROLE_KEYWORDS.frontend;
  if (/backend|back-end|server|node/.test(t)) return ROLE_KEYWORDS.backend;
  if (/data|ml|machine|scientist/.test(t)) return ROLE_KEYWORDS.data;
  if (/product|pm/.test(t)) return ROLE_KEYWORDS.product;
  if (/design|ux/.test(t)) return ROLE_KEYWORDS.design;
  return ROLE_KEYWORDS.default;
}

function extractJobKeywords(jd: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "you", "our", "are", "will", "that", "this", "have", "from", "your", "work", "team", "role", "job", "who", "all", "not", "but", "can", "has", "may", "per", "using", "use", "experience", "years", "including", "ability", "strong", "plus", "etc", "new", "other", "well", "across", "within", "about", "into", "more", "than", "also", "such", "their", "them", "they", "what", "when", "where", "which", "while", "would", "should", "could", "been", "being", "were", "does", "each", "some", "most", "must", "need", "required", "requirements", "preferred", "qualifications", "responsibilities", "company", "candidate", "candidates", "looking", "join", "help", "build", "help us"]);
  const words = jd.toLowerCase().match(/[a-z][a-z+#.\-]{2,}/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([w]) => w);
}

export function atsAnalyze(resume: ResumeData, jobDescription?: string): AtsResult {
  const text = resumeToText(resume);
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const issues: AtsIssue[] = [];

  /* --- Keywords (30) --- */
  const targetKeywords = jobDescription && jobDescription.trim().length > 40
    ? extractJobKeywords(jobDescription)
    : roleKeywordSet(resume);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of targetKeywords) {
    if (lower.includes(kw.toLowerCase())) matched.push(kw);
    else missing.push(kw);
  }
  const keywordScore = targetKeywords.length
    ? Math.round((matched.length / targetKeywords.length) * 30)
    : 18;
  if (missing.length > 6) {
    issues.push({
      id: "kw-missing",
      severity: "warning",
      category: "Keywords",
      title: `${missing.length} target keywords missing`,
      detail: `The job description mentions terms like ${missing.slice(0, 6).join(", ")} that don't appear in your resume.`,
      fix: "Weave the most relevant missing keywords naturally into your summary and experience bullets.",
    });
  } else {
    issues.push({
      id: "kw-good",
      severity: "good",
      category: "Keywords",
      title: "Strong keyword coverage",
      detail: `${matched.length} of ${targetKeywords.length} target keywords found in your resume.`,
    });
  }

  /* --- Sections (20) --- */
  const sectionChecks: Array<[boolean, string, string]> = [
    [resume.summary.trim().length > 40, "Professional summary", "Add a 2–3 sentence summary at the top."],
    [resume.experience.length > 0, "Work experience", "Add at least one work experience entry."],
    [resume.education.length > 0, "Education", "Add your education history."],
    [resume.skills.length >= 5, "Skills (5+)", "List at least 5 relevant skills."],
  ];
  let sectionCount = 0;
  for (const [ok, label, fix] of sectionChecks) {
    if (ok) sectionCount++;
    else
      issues.push({
        id: `section-${label}`,
        severity: "critical",
        category: "Sections",
        title: `Missing section: ${label}`,
        detail: `ATS parsers expect a dedicated ${label} section.`,
        fix,
      });
  }
  const bonus = (resume.projects.length > 0 ? 1 : 0) + (resume.certifications.length > 0 ? 1 : 0);
  const sectionScore = Math.min(20, sectionCount * 5 + bonus);
  if (resume.projects.length === 0 && resume.certifications.length === 0) {
    issues.push({
      id: "section-bonus",
      severity: "info",
      category: "Sections",
      title: "Consider adding Projects or Certifications",
      detail: "These optional sections give ATS filters more context to match you against job requirements.",
    });
  }

  /* --- Impact & content (25) --- */
  const allBullets = resume.experience.flatMap((e) => e.bullets);
  const quantified = allBullets.filter((b) => /\d/.test(b)).length;
  const quantRatio = allBullets.length ? quantified / allBullets.length : 0;
  const impactScore = Math.round(Math.min(1, quantRatio / 0.6) * 15);
  const actionScore = Math.min(10, allBullets.filter((b) => /^(Led|Built|Drove|Launched|Reduced|Increased|Designed|Developed|Managed|Owned|Shipped|Improved|Created|Architected|Spearheaded|Scaled|Automated|Mentored|Delivered|Optimized)/i.test(b.trim())).length * 2);
  if (quantRatio < 0.5 && allBullets.length > 0) {
    issues.push({
      id: "impact-quantify",
      severity: "warning",
      category: "Impact",
      title: "Add numbers to your achievements",
      detail: `Only ${Math.round(quantRatio * 100)}% of your bullet points contain measurable results. Recruiters and ATS algorithms favor quantified impact.`,
      fix: 'Rewrite bullets like "Reduced page load time by 43%, cutting bounce rate 18%".',
    });
  } else if (allBullets.length > 0) {
    issues.push({
      id: "impact-good",
      severity: "good",
      category: "Impact",
      title: "Achievements are well quantified",
      detail: `${quantified} of ${allBullets.length} bullets include measurable results.`,
    });
  }

  /* --- Formatting (15) --- */
  let formatScore = 15;
  const datesPresent = resume.experience.every((e) => e.startDate && (e.current || e.endDate));
  if (!datesPresent) {
    formatScore -= 5;
    issues.push({
      id: "fmt-dates",
      severity: "warning",
      category: "Formatting",
      title: "Missing employment dates",
      detail: "One or more experience entries lack start/end dates. ATS systems use dates to compute years of experience.",
      fix: "Add month + year for every role, or mark it as your current position.",
    });
  }
  const hasBullets = resume.experience.some((e) => e.bullets.length > 0);
  if (!hasBullets) {
    formatScore -= 5;
    issues.push({
      id: "fmt-bullets",
      severity: "warning",
      category: "Formatting",
      title: "No bullet points detected",
      detail: "Bulleted achievements are easier for ATS to parse than paragraphs.",
      fix: "Break each role into 3–5 achievement bullets.",
    });
  }
  if (resume.personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.personal.email)) {
    formatScore -= 3;
    issues.push({
      id: "fmt-email",
      severity: "critical",
      category: "Formatting",
      title: "Invalid email format",
      detail: `"${resume.personal.email}" doesn't look like a valid email — ATS contact parsers may fail.`,
      fix: "Use the format name@domain.com.",
    });
  }
  if (!resume.personal.phone && !resume.personal.email) {
    formatScore -= 4;
    issues.push({
      id: "fmt-contact",
      severity: "critical",
      category: "Formatting",
      title: "No contact information",
      detail: "Add at least an email address and phone number so recruiters can reach you.",
    });
  }
  if (formatScore === 15) {
    issues.push({
      id: "fmt-good",
      severity: "good",
      category: "Formatting",
      title: "Clean, parseable formatting",
      detail: "Dates, bullets, and contact details are all present and correctly formatted.",
    });
  }

  /* --- Length (10) --- */
  let lengthScore: number;
  if (wordCount < 250) {
    lengthScore = 4;
    issues.push({
      id: "len-short",
      severity: "warning",
      category: "Length",
      title: "Resume is too short",
      detail: `${wordCount} words. Aim for 400–800 words to give ATS enough context.`,
    });
  } else if (wordCount > 900) {
    lengthScore = 6;
    issues.push({
      id: "len-long",
      severity: "info",
      category: "Length",
      title: "Resume is quite long",
      detail: `${wordCount} words. Trim older or less relevant roles to stay under ~800 words.`,
    });
  } else {
    lengthScore = 10;
    issues.push({
      id: "len-good",
      severity: "good",
      category: "Length",
      title: "Ideal resume length",
      detail: `${wordCount} words hits the 400–800 sweet spot for ATS readability.`,
    });
  }

  const score = Math.max(0, Math.min(100, keywordScore + sectionScore + impactScore + actionScore + Math.max(0, formatScore) + lengthScore));
  const grade = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Work";

  return {
    score,
    grade,
    breakdown: [
      { label: "Keywords", score: keywordScore, max: 30, hint: "Match against target role keywords" },
      { label: "Sections", score: sectionScore, max: 20, hint: "Standard sections present" },
      { label: "Impact", score: impactScore + actionScore, max: 25, hint: "Quantified, action-driven content" },
      { label: "Formatting", score: Math.max(0, formatScore), max: 15, hint: "Dates, bullets, contact info" },
      { label: "Length", score: lengthScore, max: 10, hint: "Word count in the sweet spot" },
    ],
    issues: issues.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, good: 3 };
      return order[a.severity] - order[b.severity];
    }),
    matchedKeywords: matched.slice(0, 12),
    missingKeywords: missing.slice(0, 12),
    wordCount,
  };
}

/* ============================== Grammar Checker ============================== */

export interface GrammarIssue {
  id: string;
  type: "spelling" | "grammar" | "style" | "punctuation" | "weak-phrase";
  original: string;
  suggestion: string;
  message: string;
}

export interface GrammarResult {
  score: number;
  wordCount: number;
  sentenceCount: number;
  issues: GrammarIssue[];
  stats: { label: string; value: string }[];
}

const MISSPELLINGS: Record<string, string> = {
  recieve: "receive", seperate: "separate", teh: "the", definately: "definitely",
  occured: "occurred", acheive: "achieve", responsable: "responsible",
  managment: "management", sucessful: "successful", adviced: "advised",
  independant: "independent", enviroment: "environment", developement: "development",
  commited: "committed", excellant: "excellent", experiance: "experience",
  knowlege: "knowledge", maintance: "maintenance", neccessary: "necessary",
  occassion: "occasion", posession: "possession", proffesional: "professional",
  recomend: "recommend", succesful: "successful", truely: "truly",
  untill: "until", wich: "which", wierd: "weird", leadeship: "leadership",
  buisness: "business", colaboration: "collaboration", acheivment: "achievement",
};

const WEAK_PHRASES: Array<{ phrase: RegExp; suggestion: string; why: string }> = [
  { phrase: /\bresponsible for\b/gi, suggestion: "Owned / Led", why: "Weak opener — lead with a strong action verb instead" },
  { phrase: /\bworked on\b/gi, suggestion: "Developed / Built / Delivered", why: "Vague verb — describe what you actually did" },
  { phrase: /\bhelped (with|to)?\b/gi, suggestion: "Supported / Contributed to", why: "Understates your contribution" },
  { phrase: /\bduties included\b/gi, suggestion: "Drove / Managed", why: "Task-focused; reframe as achievements" },
  { phrase: /\bteam player\b/gi, suggestion: "Collaborated cross-functionally", why: "Cliché — show collaboration through results" },
  { phrase: /\bhard working\b|\bhard-working\b/gi, suggestion: "Results-driven", why: "Cliché — quantify your output instead" },
  { phrase: /\bvery\s+(\w+)/gi, suggestion: "stronger adjective", why: "'Very' weakens the word that follows" },
  { phrase: /\breally\s+(\w+)/gi, suggestion: "stronger adjective", why: "'Really' is filler — cut it" },
  { phrase: /\bjust\b/gi, suggestion: "(remove)", why: "Filler word that minimizes your impact" },
  { phrase: /\bin order to\b/gi, suggestion: "to", why: "Wordy — 'to' means the same thing" },
];

const PASSIVE_RE = /\b(was|were|been|being)\s+\w+(ed|en)\b/gi;

export function grammarCheckText(text: string): GrammarResult {
  const issues: GrammarIssue[] = [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = (text.match(/[.!?]+(\s|$)/g) ?? []).length || 1;

  /* spelling */
  const words = text.match(/[A-Za-z][A-Za-z']*/g) ?? [];
  const seen = new Set<string>();
  for (const w of words) {
    const lw = w.toLowerCase();
    if (MISSPELLINGS[lw] && !seen.has(lw)) {
      seen.add(lw);
      issues.push({
        id: `sp-${lw}`,
        type: "spelling",
        original: w,
        suggestion: MISSPELLINGS[lw],
        message: `Possible misspelling — did you mean "${MISSPELLINGS[lw]}"?`,
      });
    }
  }

  /* lowercase standalone i */
  const loneI = text.match(/(^|\s)i(\s|,|'|\.)/g);
  if (loneI) {
    issues.push({
      id: "gr-lower-i",
      type: "grammar",
      original: "i",
      suggestion: "I",
      message: 'The pronoun "I" should always be capitalized.',
    });
  }

  /* double spaces */
  if (/ {2,}/.test(text)) {
    issues.push({
      id: "pu-double-space",
      type: "punctuation",
      original: "double spaces",
      suggestion: "single space",
      message: "Multiple consecutive spaces found — use a single space.",
    });
  }

  /* repeated words */
  const repeated = text.match(/\b(\w+)\s+\1\b/gi);
  if (repeated) {
    for (const r of repeated.slice(0, 3)) {
      const w = r.trim().split(/\s+/)[0];
      if (w.length > 1) {
        issues.push({
          id: `gr-repeat-${w}`,
          type: "grammar",
          original: r.trim(),
          suggestion: w,
          message: `"${w}" is repeated — remove the duplicate.`,
        });
      }
    }
  }

  /* passive voice */
  const passives = text.match(PASSIVE_RE) ?? [];
  if (passives.length > 0) {
    issues.push({
      id: "st-passive",
      type: "style",
      original: passives[0] ?? "passive voice",
      suggestion: "active voice",
      message: `${passives.length} passive construction${passives.length > 1 ? "s" : ""} found. Active voice is stronger: "Led the migration" vs "The migration was led".`,
    });
  }

  /* weak phrases */
  for (const { phrase, suggestion, why } of WEAK_PHRASES) {
    const m = text.match(phrase);
    if (m) {
      issues.push({
        id: `wk-${suggestion.replace(/\W/g, "")}`,
        type: "weak-phrase",
        original: m[0],
        suggestion,
        message: why,
      });
    }
  }

  /* missing capitalization at sentence start */
  const sentences = text.split(/[.!?]\s+/).filter((s) => s.trim().length > 3);
  const lowerStarts = sentences.filter((s) => /^[a-z]/.test(s.trim())).length;
  if (lowerStarts > 0) {
    issues.push({
      id: "pu-sentence-case",
      type: "punctuation",
      original: "sentence start",
      suggestion: "Capital letter",
      message: `${lowerStarts} sentence${lowerStarts > 1 ? "s start" : " starts"} with a lowercase letter.`,
    });
  }

  const score = Math.max(40, Math.min(100, 100 - issues.length * 7 - (passives.length > 2 ? 5 : 0)));

  const avgWords = Math.round(wordCount / sentenceCount);
  return {
    score,
    wordCount,
    sentenceCount,
    issues,
    stats: [
      { label: "Words", value: String(wordCount) },
      { label: "Sentences", value: String(sentenceCount) },
      { label: "Avg. words / sentence", value: String(avgWords) },
      { label: "Readability", value: avgWords > 25 ? "Complex" : avgWords > 18 ? "Moderate" : "Easy to read" },
    ],
  };
}

/* ============================== Cover Letter ============================== */

const COVER_OPENERS: Record<string, string> = {
  professional: "I am writing to express my strong interest in the {role} position at {company}. With a proven track record of {highlight}, I am confident I would make an immediate contribution to your team.",
  enthusiastic: "When I saw the {role} opening at {company}, I couldn't click \"Apply\" fast enough. {company}'s reputation for {companyTrait} is exactly the environment where I've done my best work — {highlight}.",
  concise: "I'm excited to apply for the {role} role at {company}. Short version: I've spent my career {highlight}, and I'd love to bring that energy to {company}.",
  creative: "Every great team needs a {role} who treats goals like puzzles — and every puzzle I've met lately, I've solved by {highlight}. That's why the {role} opening at {company} caught my attention.",
};

const COVER_CLOSERS: Record<string, string> = {
  professional: "I would welcome the opportunity to discuss how my experience aligns with {company}'s goals. Thank you for your time and consideration.",
  enthusiastic: "I'd love to tell you more about how I can help {company} win. Thank you for considering my application — I hope to hear from you soon!",
  concise: "I'd welcome a conversation about how I can contribute at {company}. Thank you for your time.",
  creative: "Let's find 15 minutes to talk about what we could build together at {company}. Thank you for reading!",
};

const COMPANY_TRAITS = [
  "innovation and customer obsession", "building products people love",
  "moving fast without breaking trust", "world-class engineering culture",
];

export type CoverTone = "professional" | "enthusiastic" | "concise" | "creative";

export function generateCoverLetter(opts: {
  resume: ResumeData;
  company: string;
  role: string;
  tone: CoverTone;
}): string {
  const { resume, company, role, tone } = opts;
  const name = resume.personal.fullName || "Your Name";
  const jobTitle = resume.personal.jobTitle || role;
  const topSkills = resume.skills.slice(0, 3).map((s) => s.name).join(", ") || "problem solving";
  const recent = resume.experience[0];
  const highlight = recent?.bullets[0]
    ? recent.bullets[0].replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/\.$/, "")
    : "delivering measurable results in fast-paced teams";
  const companyTrait = pick(COMPANY_TRAITS);
  const years = Math.max(2, resume.experience.length * 3);

  const opener = (COVER_OPENERS[tone] ?? COVER_OPENERS.professional)
    .replaceAll("{role}", role)
    .replaceAll("{company}", company)
    .replace("{highlight}", highlight)
    .replace("{companyTrait}", companyTrait);

  const body1 = `In my ${years > 2 ? `${years} years` : "time"} as a ${jobTitle}, I have consistently ${highlight}. My core toolkit — ${topSkills} — maps directly to what your team is building${company ? ` at ${company}` : ""}.`;

  const body2 = recent
    ? `Most recently at ${recent.company}, I ${
        recent.bullets[1]
          ? recent.bullets[1].replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/\.$/, "")
          : "partnered with product and engineering to ship high-impact work"
      }. These experiences taught me how to balance craft with deadlines — and how to bring stakeholders along for the ride.`
    : `Throughout my career I have partnered closely with product and engineering teams to ship high-impact work, and I bring that same ownership mentality to every challenge.`;

  const closer = (COVER_CLOSERS[tone] ?? COVER_CLOSERS.professional).replaceAll("{company}", company);

  return `${name}
${resume.personal.email || "email@example.com"}${resume.personal.phone ? ` · ${resume.personal.phone}` : ""}

Dear Hiring Team,

${opener}

${body1}

${body2}

${closer}

Sincerely,
${name}`;
}

/* ============================== Tailored Cover Letter (Job Match) ============================== */

/**
 * Display-casing for keywords mined from a job description (which arrive
 * lowercase) so they read naturally inside letter prose. Everything not
 * listed stays lowercase — "performance and accessibility" reads better
 * mid-sentence than "Performance And Accessibility".
 */
const KEYWORD_CASE: Record<string, string> = {
  "ci/cd": "CI/CD", sql: "SQL", api: "API", apis: "APIs", html: "HTML", css: "CSS",
  git: "Git", "node.js": "Node.js", node: "Node.js", react: "React", vue: "Vue",
  typescript: "TypeScript", javascript: "JavaScript", graphql: "GraphQL",
  "a/b testing": "A/B testing", ui: "UI", ux: "UX", aws: "AWS", gcp: "GCP",
  docker: "Docker", kubernetes: "Kubernetes", python: "Python", java: "Java",
  rest: "REST", restful: "REST", figma: "Figma", agile: "Agile", scrum: "Scrum",
  "next.js": "Next.js", "react native": "React Native",
};

function displayKeyword(kw: string): string {
  const key = kw.trim().toLowerCase();
  if (KEYWORD_CASE[key]) return KEYWORD_CASE[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Tokens that read badly as standalone sentence topics ("investing in End",
 * "emphasis on Manager") — excluded from the letter weave even when the
 * JD is missing them. The full list still reaches the UI via tailorKeywords.
 */
const PROSE_STOP = new Set([
  "own", "end", "before", "after", "core", "applied", "decisions", "launch",
  "ship", "fast", "real", "cross", "well", "day", "deep", "high", "new", "best",
  "developer", "manager", "scientist", "engineer", "senior", "junior",
  "staff", "lead", "role", "roles",
]);

/** Lead sentence of the added "JD alignment" paragraph (covers kw[0] + kw[1]). */
const TAILOR_LEADS: Array<(a: string, b: string, company: string) => string> = [
  (a, b) => `Your emphasis on ${a} and ${b} aligns directly with my experience — most recently ${pick(METRICS)}.`,
  (a, b, company) => `What drew me to this posting is the weight it places on ${a} and ${b}; that is precisely the intersection where I have done my strongest work, ${company ? `and it is exactly what I would bring to ${company}` : "and exactly what I would bring to your team"}.`,
  (a, b) => `Your job description calls out ${a} and ${b} — the two areas I have invested in most deliberately, ${pick(METRICS)}.`,
];

/** Second sentence of the added paragraph, covering kw[3] (+ kw[4]). */
const TAILOR_DEPTHS: Array<(a: string, b: string | null) => string> = [
  (a, b) => b ? `${a} and ${b} are the threads running through my recent projects — depth I would put to work from week one.` : `${a} is the thread that runs through most of my recent work, and I would bring that depth to your team from day one.`,
  (a, b) => b ? `I have also invested heavily in ${a} and ${b}, pairing them daily to ship outcomes rather than output.` : `I have also been deliberately going deeper on ${a}, treating it as a craft rather than a checkbox.`,
];

/**
 * Tone recolors for the injected "JD alignment" paragraph. Professional
 * keeps TAILOR_LEADS above (classic, formal); the other tones re-voice
 * the same keyword payload so a tailored letter's voice matches the
 * tone picked for its opener/closer instead of snapping back to formal.
 * Same pick()-based template style as the rest of the generator.
 */
const TAILOR_TONE_LEADS: Partial<Record<CoverTone, typeof TAILOR_LEADS>> = {
  enthusiastic: [
    (a, b) => `I was thrilled to see ${a} and ${b} at the top of your list — those are exactly the areas where I shine, ${pick(METRICS)}.`,
    (a, b, company) => `I was genuinely excited to see how much your posting leans on ${a} and ${b} — that is where I do my best work${company ? `, and I would bring that energy to ${company} on day one` : ", and I would bring that energy to your team on day one"}.`,
    (a, b) => `Seeing ${a} and ${b} called out in your job description made me sit up — those are my two favorite problems to solve, ${pick(METRICS)}.`,
  ],
  concise: [
    (a, b) => `Your posting emphasizes ${a} and ${b} — both are core to my recent work, ${pick(METRICS)}.`,
    (a, b) => `Two things in your job description stood out: ${a} and ${b}. Both are where I am strongest — ${pick(METRICS)}.`,
    (a, b) => `On ${a} and ${b}: that is precisely what I have been doing most recently, ${pick(METRICS)}.`,
  ],
  creative: [
    (a, b) => `Your posting reads like a brief written for me: ${a} and ${b} front and center — the two threads running through my best work, ${pick(METRICS)}.`,
    (a, b, company) => `Most job descriptions list requirements; yours reads like a challenge I have already been training for, with ${a} and ${b} as my two strongest tools${company ? ` — and ${company} is where I would like to put them to work` : " — and your team is where I would like to put them to work"}, ${pick(METRICS)}.`,
    (a, b) => `The mention of ${a} and ${b} is what hooked me — those are the lenses I bring to every project, ${pick(METRICS)}.`,
  ],
};

/**
 * Single-keyword lead per tone (used when the JD yields only one
 * prose-worthy keyword). Professional keeps the inline default below.
 */
const TAILOR_TONE_SOLO_LEADS: Partial<Record<CoverTone, Array<(a: string) => string>>> = {
  enthusiastic: [
    (a) => `I was genuinely excited to see ${a} called out in your posting — that is exactly where I do my best work, ${pick(METRICS)}.`,
  ],
  concise: [
    (a) => `Your posting leans on ${a} — that is precisely what I have been doing most recently, ${pick(METRICS)}.`,
  ],
  creative: [
    (a) => `The line about ${a} is what hooked me — it is the lens I bring to every project, ${pick(METRICS)}.`,
  ],
};

/** Professional default for the single-keyword lead (unchanged). */
const TAILOR_SOLO_LEAD = (a: string) =>
  `Your posting leans heavily on ${a} — an area where I have done my strongest work, ${pick(METRICS)}.`;

/**
 * Keywords from a job description that the resume is missing (up to 5,
 * ordered by how prominently the JD mentions them). Empty when the JD is
 * too short to analyze. Deterministic for a given resume + JD pair.
 */
export function tailorKeywords(resume: ResumeData, jd: string): string[] {
  if (!jd || jd.trim().length <= 40) return [];
  return atsAnalyze(resume, jd.trim()).missingKeywords.slice(0, 5);
}

export interface TailoredCoverLetter {
  /** The full letter text (letterhead + body + signature), ready to render. */
  text: string;
  /** Keywords from the JD that were woven into the body (display-cased). */
  injectedKeywords: string[];
  /**
   * Keyword budget actually applied by the density guard:
   * max(1, min(5, floor(letterWords / 120), available)) — roughly one
   * keyword per 120 words of letter, at least one whenever a keyword
   * qualifies. 0 when no keywords qualified at all.
   */
  appliedCap: number;
  /** Keywords that qualified for injection before the density cap
   *  (display-cased). Length may exceed injectedKeywords when the cap
   *  bit — the UI surfaces that as "X of Y requested keywords injected". */
  requestedKeywords: string[];
}

/**
 * Generates a cover letter and weaves the JD's missing keywords into it:
 * an added "alignment" paragraph before the closer covers up to four
 * keywords, and — when the JD needs a third — one more is dropped into
 * the "most recent role" paragraph as a proof point. Reuses
 * generateCoverLetter for the base letter so tone and letterhead
 * behavior stay identical, and the alignment paragraph is re-voiced per
 * tone (TAILOR_TONE_LEADS) so tailored letters keep the selected voice.
 *
 * A density guard caps injection at roughly one keyword per 120 words of
 * base letter (max 5, min 1): the requested-but-dropped keywords are
 * returned in requestedKeywords so the UI can say "X of Y requested
 * keywords injected" instead of silently stuffing a short letter.
 */
export function generateTailoredCoverLetter(opts: {
  resume: ResumeData;
  company: string;
  role: string;
  tone: CoverTone;
  jd: string;
}): TailoredCoverLetter {
  const keywords = tailorKeywords(opts.resume, opts.jd);
  const base = generateCoverLetter(opts);

  /* Skip keywords that are just echoes of the company/role the letter
     already names ("vercel" while applying to Vercel reads oddly), plus
     generic tokens that can't carry a sentence on their own. */
  const stopTokens = new Set(
    `${opts.company} ${opts.role}`.toLowerCase().match(/[a-z][a-z+#.\-]{1,}/g) ?? []
  );
  const kws = keywords
    .filter((k) => !stopTokens.has(k) && !PROSE_STOP.has(k))
    .map(displayKeyword);
  if (kws.length === 0) {
    return { text: base, injectedKeywords: [], appliedCap: 0, requestedKeywords: [] };
  }

  const paragraphs = base.split("\n\n");
  if (paragraphs.length < 4) {
    return { text: base, injectedKeywords: kws, appliedCap: kws.length, requestedKeywords: kws };
  }

  /* Density guard: a short letter reads as keyword-stuffed when every
     missing token is crammed in. Budget ≈ 1 keyword per 120 words of the
     base letter (max 5, never 0), then keep only the top of the list. */
  const baseWords = base.split(/\s+/).filter(Boolean).length;
  const cap = Math.max(1, Math.min(5, Math.floor(baseWords / 120), kws.length));
  const injected = kws.slice(0, cap);

  /* Base shape: [letterhead, salutation, opener, body1, body2, closer, signature]
     — locate the closer (second-to-last) and body2 (just before it). */
  const closerIdx = paragraphs.length - 2;
  const body2Idx = closerIdx - 1;
  const company = opts.company.trim();

  /* kw[0] (+ kw[1]) open the alignment paragraph... tone-voiced. */
  const a = injected[0] ?? "";
  const b = injected[1];
  const deep1 = injected[3];
  const deep2 = injected[4];
  const lead = b
    ? pick(TAILOR_TONE_LEADS[opts.tone] ?? TAILOR_LEADS)(a, b, company)
    : pick(TAILOR_TONE_SOLO_LEADS[opts.tone] ?? [TAILOR_SOLO_LEAD])(a);
  const depth = deep1 ? ` ${pick(TAILOR_DEPTHS)(deep1, deep2 ?? null)}` : "";
  paragraphs.splice(closerIdx, 0, lead + depth);

  /* ...kw[2] drops into the "most recent role" paragraph as a proof point. */
  const c = injected[2];
  if (c) {
    const body2 = paragraphs[body2Idx] ?? "";
    paragraphs[body2Idx] = `${body2} My current role has also pushed me deeper into ${c}, most recently ${pick(METRICS)}.`;
  }

  return { text: paragraphs.join("\n\n"), injectedKeywords: injected, appliedCap: cap, requestedKeywords: kws };
}

/* ============================== LinkedIn Import ============================== */

export interface LinkedInParsed {
  name: string;
  headline: string;
  location: string;
  summary: string;
  experience: Array<{ company: string; role: string; period: string; bullets: string[] }>;
  education: Array<{ school: string; degree: string; period: string }>;
  skills: string[];
  confidence: number;
}

export function parseLinkedInProfile(text: string): LinkedInParsed {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result: LinkedInParsed = {
    name: "", headline: "", location: "", summary: "",
    experience: [], education: [], skills: [], confidence: 0,
  };

  let section = "header";
  let currentExp: LinkedInParsed["experience"][number] | null = null;
  const lowerSections = new Set(["experience", "education", "skills", "about", "summary", "licenses & certifications"]);

  for (const line of lines) {
    const l = line.toLowerCase().replace(/:$/, "").trim();
    if (lowerSections.has(l)) {
      section = l === "summary" ? "about" : l;
      continue;
    }
    if (section === "header") {
      if (!result.name) result.name = line;
      else if (!result.headline) result.headline = line;
      else if (!result.location && /^(greater |)[A-Z]/.test(line) && line.split(",").length >= 2) result.location = line;
    } else if (section === "about") {
      result.summary += (result.summary ? " " : "") + line;
    } else if (section === "experience") {
      const atMatch = line.match(/^(.{2,60}?)\s+at\s+(.+)$/i);
      const dateMatch = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[A-Za-z]+ \d{4}).*\d{4}/i.test(line) || /^\d{4}\s*[-–]\s*/.test(line);
      if (atMatch) {
        if (currentExp) result.experience.push(currentExp);
        currentExp = { role: atMatch[1], company: atMatch[2], period: "", bullets: [] };
      } else if (dateMatch && currentExp) {
        currentExp.period = line;
      } else if (currentExp && (line.startsWith("•") || line.startsWith("-") || line.startsWith("· ") || line.length > 40)) {
        currentExp.bullets.push(line.replace(/^[•\-·]\s*/, ""));
      }
    } else if (section === "education") {
      const m = line.match(/^(.+?),\s*(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Master|Doctor)/i);
      if (m) result.education.push({ school: m[1], degree: m[2], period: "" });
      else if (result.education.length && !result.education[result.education.length - 1].period && /\d{4}/.test(line)) {
        result.education[result.education.length - 1].period = line;
      }
    } else if (section === "skills") {
      for (const s of line.split(/[,•·|]/)) {
        const t = s.trim();
        if (t && t.length < 40 && !result.skills.includes(t)) result.skills.push(t);
      }
    }
  }
  if (currentExp) result.experience.push(currentExp);

  let filled = 0;
  const checks = [result.name, result.headline, result.summary, result.experience.length, result.education.length, result.skills.length];
  for (const c of checks) if (c) filled++;
  result.confidence = Math.round((filled / checks.length) * 100);
  return result;
}
