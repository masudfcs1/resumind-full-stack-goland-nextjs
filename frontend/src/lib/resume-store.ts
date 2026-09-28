"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { useSyncExternalStore } from "react";

/* ============================== Types ============================== */

export type TemplateId =
  | "modern"
  | "classic"
  | "minimal"
  | "creative"
  | "executive"
  | "technical"
  | "cambridge"
  | "impact"
  | "summit"
  | "timeline"
  | "vertex"
  | "prestige"
  | "meridian"
  | "compact";

export const TEMPLATE_META: Record<
  TemplateId,
  { name: string; description: string; tag: string; bestFor: string }
> = {
  modern: {
    name: "Modern",
    description: "Two-column layout with a vibrant accent sidebar. Perfect for tech roles.",
    tag: "Most Popular",
    bestFor: "Tech & startup roles",
  },
  classic: {
    name: "Classic",
    description: "Timeless single-column design trusted by recruiters for decades.",
    tag: "Safe Choice",
    bestFor: "Traditional industries",
  },
  minimal: {
    name: "Minimal",
    description: "Ultra-clean whitespace-first layout that lets your content shine.",
    tag: "Clean",
    bestFor: "Content-first storytellers",
  },
  creative: {
    name: "Creative",
    description: "Bold header block with skill chips for design-forward careers.",
    tag: "Bold",
    bestFor: "Design-forward careers",
  },
  executive: {
    name: "Executive",
    description: "Commanding dark header and refined typography for senior roles.",
    tag: "Senior",
    bestFor: "Director & C-suite tracks",
  },
  technical: {
    name: "Technical",
    description: "Dense, keyword-rich engineering layout optimized for ATS parsing.",
    tag: "ATS-Ready",
    bestFor: "Engineering & data",
  },
  cambridge: {
    name: "Cambridge",
    description: "Serif-driven layout with a centered masthead and timeless typography.",
    tag: "Refined",
    bestFor: "Law, academia & finance",
  },
  impact: {
    name: "Impact",
    description: "High-contrast dark sidebar puts your personal brand front and center.",
    tag: "Eye-Catching",
    bestFor: "Sales, marketing & pivots",
  },
  summit: {
    name: "Summit",
    description: "Confident full-width header band over a clean, scannable body.",
    tag: "Balanced",
    bestFor: "Management & operations",
  },
  timeline: {
    name: "Timeline",
    description: "Vertical career timeline that makes your progression impossible to miss.",
    tag: "Structured",
    bestFor: "Promotion-track stories",
  },
  vertex: {
    name: "Vertex",
    description:
      "Google/FAANG-style engineering resume: minimalist one column, hairline rules, zero noise — pure signal for parsers and recruiters.",
    tag: "FAANG-Ready",
    bestFor: "Google, Meta & Big Tech SWE",
  },
  prestige: {
    name: "Prestige",
    description:
      "Traditional serif with a banker's masthead — the conservative, reverse-chronological format hiring committees expect.",
    tag: "Conservative",
    bestFor: "Enterprise, finance & law",
  },
  meridian: {
    name: "Meridian",
    description:
      "Contemporary single column with one restrained accent rule. Skills-first structure built to sail through any ATS.",
    tag: "ATS-First",
    bestFor: "High-volume applications",
  },
  compact: {
    name: "Compact",
    description:
      "Density-tuned typography with no decoration at all — fits a full engineering career on one ATS-perfect page.",
    tag: "One-Page",
    bestFor: "Senior SWEs, 10+ years",
  },
};

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string; // e.g. "2021-06"
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 1..5
}

export interface ProjectItem {
  id: string;
  name: string;
  url: string;
  description: string;
  tech: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface ResumeData {
  id: string;
  title: string;
  template: TemplateId;
  accent: string; // hex
  updatedAt: number;
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  /** Soft-hide flag (additive, optional): archived resumes stay in the store
      (and keep their score history) but drop out of the active list. Older
      persisted state without this field reads as NOT archived — always check
      !!resume.archived, never assume the key exists. */
  archived?: boolean;
}

/** Snapshot of a deleted resume plus its position in the pre-delete array,
    captured so the Undo action on the delete toast can restore it exactly. */
export interface DeletedResumeEntry {
  resume: ResumeData;
  index: number;
}

/* ============================== Helpers ============================== */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const ACCENT_PRESETS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Slate", value: "#475569" },
  { name: "Orange", value: "#f97316" },
  { name: "Fuchsia", value: "#d946ef" },
];

export function formatMonth(value: string): string {
  if (!value) return "";
  const [y, m] = value.split("-");
  if (!y) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!m) return y;
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] ?? ""} ${y}`;
}

export function emptyResume(title = "Untitled Resume", template: TemplateId = "modern", accent = "#10b981"): ResumeData {
  return {
    id: uid(),
    title,
    template,
    accent,
    updatedAt: Date.now(),
    personal: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };
}

/* ============================== Seed data ============================== */

function seedResume1(): ResumeData {
  return {
    id: "seed-alex",
    title: "Senior Frontend Engineer — Google",
    template: "modern",
    accent: "#10b981",
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    personal: {
      fullName: "Alexander Chen",
      jobTitle: "Senior Frontend Engineer",
      email: "alex.chen@email.com",
      phone: "+1 (415) 555-0132",
      location: "San Francisco, CA",
      website: "alexchen.dev",
      linkedin: "linkedin.com/in/alexchen",
      github: "github.com/alexchen",
    },
    summary:
      "Senior Frontend Engineer with 7+ years of experience designing and scaling web applications for 2M+ monthly active users. Expert in React, TypeScript, Next.js, and performance engineering. Cut page load times 43%, led a 6-engineer team shipping 30+ production features per quarter, and championed accessibility and design-system practices across 5 product teams.",
    experience: [
      {
        id: uid(),
        company: "Nova Digital",
        role: "Senior Frontend Engineer",
        location: "San Francisco, CA",
        startDate: "2021-06",
        endDate: "",
        current: true,
        bullets: [
          "Led the migration of a legacy AngularJS monolith to Next.js and TypeScript, improving Core Web Vitals scores 43% and cutting bounce rate 18% for 2M+ monthly users",
          "Architected a company-wide design system in React and Storybook, adopted by 5 product teams and reducing UI development time 60%",
          "Introduced automated accessibility testing with axe and CI gates, raising WCAG 2.1 AA compliance from 71% to 98%",
          "Mentored 6 junior engineers through code reviews and weekly design reviews; 3 were promoted within 18 months",
        ],
      },
      {
        id: uid(),
        company: "PixelWorks",
        role: "Frontend Engineer",
        location: "Seattle, WA",
        startDate: "2018-03",
        endDate: "2021-05",
        current: false,
        bullets: [
          "Built a real-time collaboration dashboard with React, WebSockets, and Redis serving 200K daily active users at 99.95% uptime",
          "Reduced JavaScript bundle size 38% through route-level code-splitting and dependency audits, cutting time-to-interactive from 4.2s to 1.9s",
          "Shipped 30+ customer-facing features across 12 product releases while keeping unit-test coverage above 80%",
        ],
      },
      {
        id: uid(),
        company: "BrightLabs",
        role: "Web Developer",
        location: "Portland, OR",
        startDate: "2016-07",
        endDate: "2018-02",
        current: false,
        bullets: [
          "Developed responsive marketing sites with Next.js and Tailwind CSS, lifting lead conversion 25% across 3 campaign landings",
          "Automated an image-optimization pipeline in CI, saving 12 hours of manual work weekly and halving page weight",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        school: "University of California, Berkeley",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2012-08",
        endDate: "2016-05",
        gpa: "3.8",
      },
    ],
    skills: [
      { id: uid(), name: "React", level: 5 },
      { id: uid(), name: "TypeScript", level: 5 },
      { id: uid(), name: "Next.js", level: 5 },
      { id: uid(), name: "Node.js", level: 4 },
      { id: uid(), name: "GraphQL", level: 4 },
      { id: uid(), name: "Tailwind CSS", level: 4 },
      { id: uid(), name: "PostgreSQL", level: 4 },
      { id: uid(), name: "Testing (Jest/RTL)", level: 4 },
      { id: uid(), name: "REST APIs", level: 4 },
      { id: uid(), name: "CI/CD", level: 4 },
      { id: uid(), name: "AWS", level: 3 },
      { id: uid(), name: "Accessibility (WCAG)", level: 4 },
    ],
    projects: [
      {
        id: uid(),
        name: "Design System Pro",
        url: "github.com/alexchen/design-system-pro",
        description: "Open-source React component library with 4.2K GitHub stars, used in production by 300+ projects.",
        tech: ["React", "TypeScript", "Storybook"],
      },
      {
        id: uid(),
        name: "Realtime Collab",
        url: "realtimecollab.app",
        description: "Multiplayer whiteboard with CRDT-based sync, sustaining 10K concurrent editing sessions.",
        tech: ["WebSockets", "CRDT", "Canvas API"],
      },
    ],
    certifications: [
      { id: uid(), name: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2023" },
      { id: uid(), name: "Professional Scrum Master I", issuer: "Scrum.org", year: "2022" },
    ],
    languages: [
      { id: uid(), name: "English", level: "Native" },
      { id: uid(), name: "Mandarin", level: "Fluent" },
    ],
  };
}

function seedResume2(): ResumeData {
  return {
    id: "seed-maya",
    title: "Product Manager — Stripe",
    template: "executive",
    accent: "#f59e0b",
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    personal: {
      fullName: "Maya Rodriguez",
      jobTitle: "Senior Product Manager",
      email: "maya.rodriguez@email.com",
      phone: "+1 (212) 555-0184",
      location: "New York, NY",
      website: "mayarodriguez.co",
      linkedin: "linkedin.com/in/mayarodriguez",
      github: "",
    },
    summary:
      "Results-driven Product Manager with 8 years of experience scaling fintech products from zero to $40M ARR. Expert in data-led discovery, experimentation, and cross-functional leadership across teams of 25+.",
    experience: [
      {
        id: uid(),
        company: "PayFlow",
        role: "Senior Product Manager",
        location: "New York, NY",
        startDate: "2020-01",
        endDate: "",
        current: true,
        bullets: [
          "Owned payments checkout product generating $40M ARR; grew conversion 22% through 60+ A/B tests",
          "Launched instant payouts feature in 3 months, capturing 15% market share in first year",
          "Managed roadmap across 4 squads (25 engineers/designers) using OKR framework",
        ],
      },
      {
        id: uid(),
        company: "CommerceOS",
        role: "Product Manager",
        location: "Boston, MA",
        startDate: "2016-09",
        endDate: "2019-12",
        current: false,
        bullets: [
          "Scaled merchant analytics platform from 5K to 80K active merchants",
          "Defined north-star metrics adopted company-wide, aligning 3 business units",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        school: "Columbia University",
        degree: "MBA",
        field: "Business Administration",
        startDate: "2014-08",
        endDate: "2016-05",
        gpa: "",
      },
      {
        id: uid(),
        school: "Boston University",
        degree: "B.A.",
        field: "Economics",
        startDate: "2010-08",
        endDate: "2014-05",
        gpa: "3.7",
      },
    ],
    skills: [
      { id: uid(), name: "Product Strategy", level: 5 },
      { id: uid(), name: "A/B Testing", level: 5 },
      { id: uid(), name: "SQL", level: 4 },
      { id: uid(), name: "Roadmapping", level: 5 },
      { id: uid(), name: "Figma", level: 4 },
      { id: uid(), name: "Stakeholder Mgmt", level: 5 },
    ],
    projects: [],
    certifications: [{ id: uid(), name: "Certified Scrum Product Owner", issuer: "Scrum Alliance", year: "2021" }],
    languages: [
      { id: uid(), name: "English", level: "Native" },
      { id: uid(), name: "Spanish", level: "Native" },
    ],
  };
}

function seedResume3(): ResumeData {
  return {
    id: "seed-david",
    title: "Data Scientist — OpenAI",
    template: "technical",
    accent: "#8b5cf6",
    updatedAt: Date.now() - 1000 * 60 * 60 * 50,
    personal: {
      fullName: "David Kim",
      jobTitle: "Data Scientist",
      email: "david.kim@email.com",
      phone: "+1 (206) 555-0177",
      location: "Seattle, WA",
      website: "davidkim.ai",
      linkedin: "linkedin.com/in/davidkim",
      github: "github.com/davidkim",
    },
    summary:
      "Data Scientist with 5 years of experience in machine learning and large-scale data pipelines. Deployed models serving 10M+ daily predictions and reduced inference costs by 35%.",
    experience: [
      {
        id: uid(),
        company: "CloudMetrics",
        role: "Data Scientist",
        location: "Seattle, WA",
        startDate: "2021-02",
        endDate: "",
        current: true,
        bullets: [
          "Built churn-prediction ensemble (XGBoost + neural nets) saving $2.3M annually in retained revenue",
          "Designed feature store on Spark processing 4TB daily with sub-hour freshness",
          "Reduced model inference costs 35% via distillation and ONNX runtime optimization",
        ],
      },
      {
        id: uid(),
        company: "InsightEngine",
        role: "ML Engineer",
        location: "Remote",
        startDate: "2019-06",
        endDate: "2021-01",
        current: false,
        bullets: [
          "Deployed NLP classification pipeline (BERT fine-tuning) reaching 94% F1 across 12 languages",
          "Automated retraining workflows cutting model refresh cycle from 2 weeks to 2 days",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        school: "University of Washington",
        degree: "M.S.",
        field: "Statistics",
        startDate: "2017-08",
        endDate: "2019-05",
        gpa: "3.9",
      },
    ],
    skills: [
      { id: uid(), name: "Python", level: 5 },
      { id: uid(), name: "PyTorch", level: 5 },
      { id: uid(), name: "SQL", level: 5 },
      { id: uid(), name: "Spark", level: 4 },
      { id: uid(), name: "XGBoost", level: 4 },
      { id: uid(), name: "Docker/K8s", level: 4 },
      { id: uid(), name: "AWS", level: 4 },
      { id: uid(), name: "Airflow", level: 3 },
    ],
    projects: [
      {
        id: uid(),
        name: "ForecastBench",
        url: "github.com/davidkim/forecastbench",
        description: "Time-series benchmarking toolkit with 1.1K GitHub stars and 40+ model implementations.",
        tech: ["Python", "Prophet", "MLflow"],
      },
    ],
    certifications: [{ id: uid(), name: "Google Cloud Professional ML Engineer", issuer: "Google Cloud", year: "2023" }],
    languages: [
      { id: uid(), name: "English", level: "Fluent" },
      { id: uid(), name: "Korean", level: "Native" },
    ],
  };
}

/* ============================== Job Applications ============================== */

export type ApplicationStage = "saved" | "applied" | "interview" | "offer" | "rejected";

export const STAGE_META: Record<
  ApplicationStage,
  { label: string; color: string; tint: string; icon: string }
> = {
  saved: { label: "Saved", color: "#78716c", tint: "#78716c14", icon: "Bookmark" },
  applied: { label: "Applied", color: "#8b5cf6", tint: "#8b5cf614", icon: "Send" },
  interview: { label: "Interview", color: "#f59e0b", tint: "#f59e0b14", icon: "Users" },
  offer: { label: "Offer", color: "#10b981", tint: "#10b98114", icon: "Trophy" },
  rejected: { label: "Rejected", color: "#f43f5e", tint: "#f43f5e14", icon: "XCircle" },
};

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  url: string;
  stage: ApplicationStage;
  resumeId: string; // resume used to apply ("" = none)
  notes: string;
  appliedAt: number; // epoch ms when added
  updatedAt: number;
}

export interface ScoreEntry {
  id: string;
  resumeId: string;
  resumeTitle: string;
  score: number;
  at: number; // epoch ms
  /** Optional per-category sub-scores (0–100), keyed by breakdown label
      (e.g. "Keywords", "Impact", "Formatting"). Older entries omit it. */
  categories?: Record<string, number>;
}

function seedApplications(): JobApplication[] {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return [
    {
      id: uid(),
      company: "Vercel",
      role: "Senior Frontend Engineer",
      location: "Remote",
      salary: "$180K – $220K",
      url: "vercel.com/careers",
      stage: "interview",
      resumeId: "seed-alex",
      notes: "Technical interview scheduled — review React Server Components & rendering patterns.",
      appliedAt: now - day * 9,
      updatedAt: now - day * 1,
    },
    {
      id: uid(),
      company: "Linear",
      role: "Product Engineer",
      location: "Remote",
      salary: "$160K – $200K",
      url: "linear.app/careers",
      stage: "applied",
      resumeId: "seed-alex",
      notes: "Referred by a friend on the design team.",
      appliedAt: now - day * 4,
      updatedAt: now - day * 4,
    },
    {
      id: uid(),
      company: "Stripe",
      role: "Senior Product Manager",
      location: "New York, NY",
      salary: "$190K – $240K",
      url: "stripe.com/jobs",
      stage: "offer",
      resumeId: "seed-maya",
      notes: "Verbal offer received — negotiating equity. Deadline Friday.",
      appliedAt: now - day * 21,
      updatedAt: now - day * 2,
    },
    {
      id: uid(),
      company: "Notion",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA (Hybrid)",
      salary: "$170K – $210K",
      url: "notion.so/careers",
      stage: "saved",
      resumeId: "seed-alex",
      notes: "Tailor resume bullets toward collaborative editing / realtime sync.",
      appliedAt: now - day * 2,
      updatedAt: now - day * 2,
    },
    {
      id: uid(),
      company: "Anthropic",
      role: "Data Scientist, Applied",
      location: "Remote",
      salary: "$200K – $275K",
      url: "anthropic.com/careers",
      stage: "applied",
      resumeId: "seed-david",
      notes: "Emphasize eval methodology + LLM fine-tuning experience.",
      appliedAt: now - day * 6,
      updatedAt: now - day * 3,
    },
    {
      id: uid(),
      company: "Figma",
      role: "Senior Frontend Engineer",
      location: "Remote",
      salary: "$185K – $230K",
      url: "figma.com/careers",
      stage: "rejected",
      resumeId: "seed-alex",
      notes: "Passed on role — keep in touch with recruiter for Q3 openings.",
      appliedAt: now - day * 30,
      updatedAt: now - day * 12,
    },
  ];
}

function seedScoreHistory(): ScoreEntry[] {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const mk = (resumeId: string, resumeTitle: string, score: number, daysAgo: number): ScoreEntry => ({
    id: uid(),
    resumeId,
    resumeTitle,
    score,
    at: now - day * daysAgo,
  });
  return [
    mk("seed-alex", "Senior Frontend Engineer — Google", 71, 20),
    mk("seed-alex", "Senior Frontend Engineer — Google", 78, 14),
    mk("seed-maya", "Product Manager — Stripe", 74, 11),
    mk("seed-alex", "Senior Frontend Engineer — Google", 82, 9),
    mk("seed-david", "Data Scientist — OpenAI", 80, 7),
    mk("seed-maya", "Product Manager — Stripe", 80, 5),
    mk("seed-david", "Data Scientist — OpenAI", 86, 3),
    mk("seed-alex", "Senior Frontend Engineer — Google", 87, 1),
  ];
}

/* ============================== Undo buffer (module-local, NOT persisted) ============================== */

/* Captures the most recent delete action so the Undo button on the delete
   toast can put the resumes back exactly where they were. Deliberately kept
   OUTSIDE the persisted store: undo data is transient and must never reach
   localStorage or widen the persisted schema. */
let undoBuffer: DeletedResumeEntry[] = [];
let undoBatchIds: string[] = [];
let undoBatchSealed = false;

/* deleteResume may fire several times for ONE user action (multi-select
   delete loops over the selected ids). Calls made within the same synchronous
   task share one batch: the first call snapshots the pre-delete id order so
   every captured entry keeps its ORIGINAL position even though the array
   shrinks between calls; the next task starts a fresh batch. */
function openUndoBatch(): void {
  if (undoBatchSealed) return;
  undoBuffer = [];
  undoBatchIds = useResumeStore.getState().resumes.map((r) => r.id);
  undoBatchSealed = true;
  queueMicrotask(() => {
    undoBatchSealed = false;
  });
}

/** Returns (and clears) the snapshots captured for the most recent delete
    action. Feed the result straight into showDeleteUndoToast. */
export function takeUndoEntries(): DeletedResumeEntry[] {
  const entries = undoBuffer;
  undoBuffer = [];
  return entries;
}

/** Standard "deleted" toast with a 7s Undo action that restores the given
    entries at their original positions (restoreResumes). */
export function showDeleteUndoToast(entries: DeletedResumeEntry[]): void {
  const n = entries.length;
  if (n === 0) return;
  toast.success(n === 1 ? "Resume deleted" : `Deleted ${n} resumes`, {
    description:
      n === 1
        ? `“${entries[0]!.resume.title}” was removed from your workspace.`
        : `${n} resumes were removed from your workspace.`,
    duration: 7000,
    action: {
      label: "Undo",
      onClick: () => {
        useResumeStore.getState().restoreResumes(entries);
        toast.success(n === 1 ? "Resume restored" : `Restored ${n} resumes`, {
          description: n === 1 ? "Back at its original position." : "Back at their original positions.",
        });
      },
    },
  });
}

/* ============================== Store ============================== */

interface ResumeState {
  resumes: ResumeData[];
  activeResumeId: string;
  coverLetterCount: number;
  applications: JobApplication[];
  scoreHistory: ScoreEntry[];
  createResume: (title?: string, template?: TemplateId, accent?: string) => string;
  duplicateResume: (id: string) => string | undefined;
  deleteResume: (id: string) => void;
  /** Soft-hide: keeps the resume in the store but flags it archived. */
  archiveResume: (id: string) => void;
  /** Reverse of archiveResume — clears the archived flag. */
  unarchiveResume: (id: string) => void;
  /** Batch archive/unarchive for the resume select-mode bulk toolbar.
      Idempotent per resume: flags already in the target state are left so
      their updatedAt is untouched. */
  bulkSetArchived: (ids: string[], archived: boolean) => void;
  /** Splices previously deleted resumes back at their original positions
      (used by the Undo action on delete toasts). Idempotent: entries whose id
      is already present are skipped. */
  restoreResumes: (entries: DeletedResumeEntry[]) => void;
  setActive: (id: string) => void;
  updateResume: (id: string, patch: Partial<ResumeData>) => void;
  resetAll: () => void;
  /** Validates a parsed backup payload and replaces the workspace with it. Returns the number of resumes imported, or -1 if the payload is invalid. */
  importData: (payload: unknown) => number;
  incrementCoverLetters: () => void;
  addApplication: (app: Omit<JobApplication, "id" | "appliedAt" | "updatedAt">) => string;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  moveApplication: (id: string, stage: ApplicationStage) => void;
  deleteApplication: (id: string) => void;
  logScore: (
    resumeId: string,
    resumeTitle: string,
    score: number,
    categories?: Record<string, number>
  ) => void;
  /* --- Per-tool data purge (Settings → Data & privacy). Each action clears
         exactly ONE domain to its empty state and deliberately leaves
         `resumes` (and `activeResumeId`) untouched. Additive: older persisted
         state simply never had these keys, and clearing only writes slices the
         persist config already serializes. --- */
  /** Empties the ATS score-history log (all entries). Resumes are untouched,
      but anything derived from this log resets with it: resume-health
      freshness falls back to "never scanned" and Compare loses its baseline
      entries. Not undoable — callers confirm first. */
  clearScoreHistory: () => void;
  /** Empties the job-application tracker. Resumes are untouched; the dangling
      `resumeId` references simply have no applications left to point at. */
  clearApplications: () => void;
  /** Resets the generated-cover-letter counter to 0. Cover letters are not
      stored as documents anywhere — this counter is the only persisted trace
      of them — so resetting it IS the full cover-letter purge. Resumes are
      untouched. */
  clearCoverLetters: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [seedResume1(), seedResume2(), seedResume3()],
      activeResumeId: "seed-alex",
      coverLetterCount: 2,
      applications: seedApplications(),
      scoreHistory: seedScoreHistory(),
      createResume: (title, template, accent) => {
        const id = uid();
        const base = emptyResume(title ?? "Untitled Resume", template ?? "modern", accent ?? "#10b981");
        const resume: ResumeData = { ...base, id, updatedAt: Date.now() };
        set((s) => ({ resumes: [resume, ...s.resumes], activeResumeId: id }));
        return id;
      },
      duplicateResume: (id) => {
        const src = get().resumes.find((r) => r.id === id);
        if (!src) return undefined;
        const newId = uid();
        const copy: ResumeData = {
          ...structuredClone(src),
          id: newId,
          title: `${src.title} (Copy)`,
          updatedAt: Date.now(),
          /* Copies always start life in the active list, even if the source was archived. */
          archived: false,
        };
        set((s) => ({ resumes: [copy, ...s.resumes] }));
        return newId;
      },
      deleteResume: (id) => {
        const s = get();
        const index = s.resumes.findIndex((r) => r.id === id);
        if (index === -1) return;
        /* Capture BEFORE removal (deep copy + original position, anchored to
           the batch's pre-delete order) so the Undo toast can restore it. */
        openUndoBatch();
        const batchIndex = undoBatchIds.indexOf(id);
        undoBuffer.push({
          resume: structuredClone(s.resumes[index]!),
          index: batchIndex !== -1 ? batchIndex : index,
        });
        const resumes = s.resumes.filter((r) => r.id !== id);
        set({
          resumes,
          activeResumeId:
            s.activeResumeId === id ? (resumes[0]?.id ?? "") : s.activeResumeId,
        });
      },
      /* Archive bumps updatedAt like every other mutation (store convention).
         The active pointer is intentionally left untouched when archiving the
         active resume — it still resolves (the resume stays in the store), so
         the builder/ATS binding never breaks. */
      archiveResume: (id) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, archived: true, updatedAt: Date.now() } : r
          ),
        })),
      unarchiveResume: (id) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, archived: false, updatedAt: Date.now() } : r
          ),
        })),
      bulkSetArchived: (ids, archived) =>
        set((s) => {
          const wanted = new Set(ids);
          return {
            resumes: s.resumes.map((r) =>
              wanted.has(r.id) && r.archived !== archived
                ? { ...r, archived, updatedAt: Date.now() }
                : r
            ),
          };
        }),
      restoreResumes: (entries) =>
        set((s) => {
          const resumes = [...s.resumes];
          const present = new Set(resumes.map((r) => r.id));
          /* Splice in descending index order so every entry lands exactly
             where it came from, regardless of how many were removed. */
          const ordered = [...entries].sort((a, b) => b.index - a.index);
          for (const entry of ordered) {
            if (present.has(entry.resume.id)) continue;
            const at = Math.min(Math.max(entry.index, 0), resumes.length);
            resumes.splice(at, 0, structuredClone(entry.resume));
            present.add(entry.resume.id);
          }
          return { resumes };
        }),
      setActive: (id) => set({ activeResumeId: id }),
      updateResume: (id, patch) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
          ),
        })),
      resetAll: () =>
        set({
          resumes: [seedResume1(), seedResume2(), seedResume3()],
          activeResumeId: "seed-alex",
          coverLetterCount: 2,
          applications: seedApplications(),
          scoreHistory: seedScoreHistory(),
        }),
      importData: (payload) => {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) return -1;
        const raw = payload as Record<string, unknown>;

        /* Resumes are required — every entry needs an id, a title and a personal object. */
        const rawResumes = raw.resumes;
        if (!Array.isArray(rawResumes) || rawResumes.length === 0) return -1;
        const blank = emptyResume();
        const resumes: ResumeData[] = [];
        for (const entry of rawResumes) {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) return -1;
          const r = entry as Record<string, unknown>;
          if (typeof r.id !== "string" || r.id.trim() === "") return -1;
          if (typeof r.title !== "string") return -1;
          if (!r.personal || typeof r.personal !== "object" || Array.isArray(r.personal)) return -1;
          const copy = structuredClone(entry) as ResumeData;
          copy.template = typeof r.template === "string" && r.template in TEMPLATE_META ? (r.template as TemplateId) : blank.template;
          copy.accent = typeof r.accent === "string" && r.accent.trim() !== "" ? r.accent : blank.accent;
          copy.summary = typeof r.summary === "string" ? r.summary : blank.summary;
          copy.personal = { ...blank.personal, ...(r.personal as Partial<PersonalInfo>) };
          for (const key of ["experience", "education", "skills", "projects", "certifications", "languages"] as const) {
            if (!Array.isArray(copy[key])) copy[key] = [];
          }
          copy.updatedAt = typeof r.updatedAt === "number" && Number.isFinite(r.updatedAt) ? r.updatedAt : Date.now();
          resumes.push(copy);
        }

        /* Active resume falls back to the first import if the id is missing or unknown. */
        const wantedActive = typeof raw.activeResumeId === "string" ? raw.activeResumeId : "";
        const firstId = resumes[0]!.id;
        const activeResumeId = resumes.some((r) => r.id === wantedActive) ? wantedActive : firstId;

        const coverLetterCount =
          typeof raw.coverLetterCount === "number" && Number.isFinite(raw.coverLetterCount)
            ? Math.max(0, Math.round(raw.coverLetterCount))
            : 0;

        /* Applications and score history fall back to seeds when absent (mirrors resetAll). */
        let applications = seedApplications();
        if (Array.isArray(raw.applications)) {
          const clean: JobApplication[] = [];
          for (const entry of raw.applications) {
            if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
            const a = entry as Record<string, unknown>;
            clean.push({
              id: typeof a.id === "string" && a.id !== "" ? a.id : uid(),
              company: typeof a.company === "string" ? a.company : "",
              role: typeof a.role === "string" ? a.role : "",
              location: typeof a.location === "string" ? a.location : "",
              salary: typeof a.salary === "string" ? a.salary : "",
              url: typeof a.url === "string" ? a.url : "",
              stage: typeof a.stage === "string" && a.stage in STAGE_META ? (a.stage as ApplicationStage) : "applied",
              resumeId: typeof a.resumeId === "string" ? a.resumeId : "",
              notes: typeof a.notes === "string" ? a.notes : "",
              appliedAt: typeof a.appliedAt === "number" && Number.isFinite(a.appliedAt) ? a.appliedAt : Date.now(),
              updatedAt: typeof a.updatedAt === "number" && Number.isFinite(a.updatedAt) ? a.updatedAt : Date.now(),
            });
          }
          if (clean.length > 0) applications = clean;
        }

        let scoreHistory = seedScoreHistory();
        if (Array.isArray(raw.scoreHistory)) {
          const clean: ScoreEntry[] = [];
          for (const entry of raw.scoreHistory) {
            if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
            const e = entry as Record<string, unknown>;
            if (typeof e.score !== "number" || !Number.isFinite(e.score)) continue;
            clean.push({
              id: typeof e.id === "string" && e.id !== "" ? e.id : uid(),
              resumeId: typeof e.resumeId === "string" ? e.resumeId : "",
              resumeTitle: typeof e.resumeTitle === "string" ? e.resumeTitle : "Untitled",
              score: e.score,
              at: typeof e.at === "number" && Number.isFinite(e.at) ? e.at : Date.now(),
            });
          }
          if (clean.length > 0) scoreHistory = clean.slice(-60);
        }

        set({ resumes, activeResumeId, coverLetterCount, applications, scoreHistory });
        return resumes.length;
      },
      incrementCoverLetters: () => set((s) => ({ coverLetterCount: s.coverLetterCount + 1 })),
      addApplication: (app) => {
        const id = uid();
        const full: JobApplication = {
          ...app,
          id,
          appliedAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ applications: [full, ...s.applications] }));
        return id;
      },
      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a
          ),
        })),
      moveApplication: (id, stage) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, stage, updatedAt: Date.now() } : a
          ),
        })),
      deleteApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
      logScore: (resumeId, resumeTitle, score, categories) =>
        set((s) => ({
          scoreHistory: [
            ...s.scoreHistory,
            { id: uid(), resumeId, resumeTitle, score, at: Date.now(), categories },
          ].slice(-60),
        })),
      /* Per-tool data purge (Settings → Data & privacy) — one line each,
         mirrors the one-liner style of incrementCoverLetters/deleteApplication. */
      clearScoreHistory: () => set({ scoreHistory: [] }),
      clearApplications: () => set({ applications: [] }),
      clearCoverLetters: () => set({ coverLetterCount: 0 }),
    }),
    {
      name: "resumeforge-store",
      storage: createJSONStorage(() => localStorage),
      // Rehydrate AFTER React hydration (see <StoreRehydrator /> in root layout).
      // Synchronous rehydration makes the first client render read localStorage
      // while the server rendered seed data — any divergence (extra resumes,
      // archived flags, renamed profile…) shifts the render tree and breaks
      // hydration (Radix useId mismatches on every dashboard route).
      skipHydration: true,
    }
  )
);

/* Convenience selectors */

/**
 * True once the persisted store has finished (post-hydration) rehydration —
 * see <StoreRehydrator />. Components whose DOM SHAPE depends on stored data
 * (e.g. the Compare category bars vs their muted "no scan" placeholders)
 * should read this and render their seed-neutral shape until it flips, so a
 * rehydrate landing inside a hydration pass can never change element types
 * or counts mid-hydration.
 */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useResumeStore.persist.onFinishHydration(onStoreChange),
    () => useResumeStore.persist.hasHydrated(),
    () => false
  );
}
export function useActiveResume(): ResumeData | undefined {
  return useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId));
}

export function useGetResume() {
  return (id: string) => useResumeStore.getState().resumes.find((r) => r.id === id);
}
