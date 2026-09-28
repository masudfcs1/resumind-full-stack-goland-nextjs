import {
  Building2,
  Code2,
  Compass,
  Crown,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import type { ResumeData } from "@/lib/resume-store";

/* ============================== Types ============================== */

export type QuestionCategory =
  | "behavioral"
  | "technical"
  | "situational"
  | "leadership"
  | "company";

export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyFilter = Difficulty | "all";

/** STAR-structured model answer outline. */
export interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  /** May contain {company} / {skill} / {role} placeholders. */
  question: string;
  /** Optional resume-customized variant of the question text. */
  tailored?: (resume: ResumeData) => string | undefined;
  /** STAR framework — may contain the same placeholders. */
  star: StarAnswer;
  tips: string[];
}

/** A question instantiated for a specific resume. */
export interface PracticeQuestion extends Question {
  /** Resolved question text (tailored variant when available). */
  text: string;
  isTailored: boolean;
  resolvedStar: StarAnswer;
}

export interface GenerateOptions {
  categories: QuestionCategory[];
  difficulty: DifficultyFilter;
  count?: number;
}

/* ============================== Category / difficulty meta ============================== */

export const CATEGORY_ORDER: QuestionCategory[] = [
  "behavioral",
  "technical",
  "situational",
  "leadership",
  "company",
];

export const CATEGORY_META: Record<
  QuestionCategory,
  { label: string; icon: LucideIcon; tint: string }
> = {
  behavioral: {
    label: "Behavioral",
    icon: HeartHandshake,
    tint: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  technical: {
    label: "Technical",
    icon: Code2,
    tint: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  situational: {
    label: "Situational",
    icon: Compass,
    tint: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  leadership: {
    label: "Leadership",
    icon: Crown,
    tint: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  company: {
    label: "Company / Culture",
    icon: Building2,
    tint: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
};

export const DIFFICULTY_META: Record<
  Difficulty,
  {
    label: string;
    level: 1 | 2 | 3;
    dot: string;
    /** Soft tint for the tiny uppercase difficulty badge (emerald/amber/rose). */
    badge: string;
    /** Ladder phase name — Warm-up / Core / Stretch. */
    phase: string;
  }
> = {
  easy: {
    label: "Easy",
    level: 1,
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    phase: "Warm-up",
  },
  medium: {
    label: "Medium",
    level: 2,
    dot: "bg-amber-500",
    badge:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    phase: "Core",
  },
  hard: {
    label: "Hard",
    level: 3,
    dot: "bg-rose-500",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    phase: "Stretch",
  },
};

/** Difficulty ladder tier order — Easy, then Medium, then Hard. */
export const TIER_ORDER: Difficulty[] = ["easy", "medium", "hard"];

/**
 * One phase-appropriate coaching sentence per tier, shown under the phase
 * strip while the current question sits in that phase.
 */
export const PHASE_COACH: Record<Difficulty, string> = {
  easy: "Warm-up: settle in and build momentum — these are the answers you should already own, so keep them crisp and confident.",
  medium: "Core: this is where the interview is decided — anchor every answer in one specific story with a number in it.",
  hard: "Stretch: slow down and show judgment — structure the answer, name the trade-offs, and own what you would do differently.",
};

/**
 * Stable ladder sort: orders questions Easy → Medium → Hard while preserving
 * the original order inside each tier (shuffle results stay stable per tier).
 */
export function ladderSort<T extends { difficulty: Difficulty }>(
  questions: readonly T[]
): T[] {
  return questions
    .map((q, i) => ({ q, i }))
    .sort(
      (a, b) =>
        DIFFICULTY_META[a.q.difficulty].level - DIFFICULTY_META[b.q.difficulty].level ||
        a.i - b.i
    )
    .map((entry) => entry.q);
}

/* ============================== Placeholder resolution ============================== */

/** Replaces {company} / {skill} / {role} with data from the active resume. */
export function resolvePlaceholders(text: string, resume: ResumeData): string {
  const company = resume.experience[0]?.company || "your current company";
  const skill = resume.skills[0]?.name || "your core skill";
  const role = resume.personal.jobTitle || resume.title || "this role";
  return text
    .replace(/\{company\}/g, company)
    .replace(/\{skill\}/g, skill)
    .replace(/\{role\}/g, role);
}

function resolveStar(star: StarAnswer, resume: ResumeData): StarAnswer {
  return {
    situation: resolvePlaceholders(star.situation, resume),
    task: resolvePlaceholders(star.task, resume),
    action: resolvePlaceholders(star.action, resume),
    result: resolvePlaceholders(star.result, resume),
  };
}

/* ============================== Question bank (45) ============================== */

export const QUESTION_BANK: Question[] = [
  /* ---------------- Behavioral (10) ---------------- */
  {
    id: "b1",
    category: "behavioral",
    difficulty: "easy",
    question: "Tell me about yourself.",
    star: {
      situation: "Open with one line: who you are now — a {role} focused on {skill}.",
      task: "Set up the arc of your career in a single sentence.",
      action: "Walk through 2–3 career highlights in order, each with a number attached.",
      result: "Land on why this role is the natural next step for you.",
    },
    tips: [
      "Keep it under 90 seconds — rehearse it out loud",
      "This is not your life story; it is your highlight reel",
      "End pointing at the job you are interviewing for",
    ],
  },
  {
    id: "b2",
    category: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time you led a project.",
    tailored: (resume) => {
      const company = resume.experience[0]?.company;
      return company ? `Tell me about a time you led a project at ${company}.` : undefined;
    },
    star: {
      situation: "Name the project at {company}: stakes, timeline, and team size.",
      task: "Your exact mandate — what leading meant: decisions, scope, people.",
      action: "How you aligned stakeholders and used {skill} to keep the team unblocked.",
      result: "Ship the outcome with a metric, plus one lesson about leading.",
    },
    tips: [
      "Say \u201cI led\u201d, not \u201cwe led\u201d — own your contribution",
      "Pick a story with a measurable ending",
      "Mention one thing you would do differently",
    ],
  },
  {
    id: "b3",
    category: "behavioral",
    difficulty: "medium",
    question: "Describe a conflict with a coworker and how you resolved it.",
    star: {
      situation: "The disagreement: roles involved, what was at stake, why it got tense.",
      task: "Your goal: solve the problem without damaging the relationship.",
      action: "You listened first, found shared ground, and proposed a concrete compromise.",
      result: "The project outcome — with a number — plus a stronger working relationship.",
    },
    tips: [
      "Never bad-mouth the other person — stay factual",
      "Show empathy for their position before your reasoning",
      "Avoid any story where HR had to intervene",
    ],
  },
  {
    id: "b4",
    category: "behavioral",
    difficulty: "medium",
    question: "Tell me about your biggest professional failure.",
    star: {
      situation: "A real failure you own — at {company} or before. Not a humble-brag.",
      task: "What was riding on it and why it went sideways.",
      action: "How you surfaced it, contained the damage, and communicated early.",
      result: "The fix, the cost, and the guardrail you added so it never repeats.",
    },
    tips: [
      "Pick a real failure — interviewers smell fake ones",
      "Spend most of the answer on what you changed afterwards",
      "End on the system or habit you built from it",
    ],
  },
  {
    id: "b5",
    category: "behavioral",
    difficulty: "easy",
    question: "Why are you leaving your current job?",
    star: {
      situation: "One neutral sentence about your current {role} position.",
      task: "Name the gap between what you do now and what you want next.",
      action: "What you are moving toward: growth, scope, this company's mission.",
      result: "Frame it as running toward something, never running away.",
    },
    tips: [
      "Never criticize your current employer or manager",
      "Anchor the answer to something this new role offers",
      "Keep it to 30 seconds — this is a landmine question",
    ],
  },
  {
    id: "b6",
    category: "behavioral",
    difficulty: "medium",
    question: "Describe a time you received harsh feedback.",
    star: {
      situation: "The feedback moment: who gave it and how it landed on you.",
      task: "Separating your ego from the signal inside the message.",
      action: "What you asked to clarify it, and the specific change you made.",
      result: "The measurable improvement and how the relationship evolved after.",
    },
    tips: [
      "Show you asked questions instead of defending",
      "Name the concrete behavior change it triggered",
      "Never say the feedback was unfair",
    ],
  },
  {
    id: "b7",
    category: "behavioral",
    difficulty: "hard",
    question: "Tell me about a time you had to deliver bad news to stakeholders.",
    star: {
      situation: "The bad news at {company}: slipped launch, missed target, or cut scope.",
      task: "Get leadership the truth fast, without panic or spin.",
      action: "You prepared options, led with the headline, and owned the cause.",
      result: "The adjusted plan, what it preserved, and trust that survived intact.",
    },
    tips: [
      "Deliver the headline in the first sentence",
      "Always bring 2–3 options, not just the problem",
      "Follow up in writing so nobody hears it secondhand",
    ],
  },
  {
    id: "b8",
    category: "behavioral",
    difficulty: "easy",
    question: "What is your greatest strength?",
    tailored: (resume) => {
      const skill = resume.skills[0]?.name;
      return skill ? `How has ${skill} become your greatest strength in practice?` : undefined;
    },
    star: {
      situation: "Name one strength — {skill} — and where you use it daily.",
      task: "Why that strength matters for this {role} position.",
      action: "A quick proof story with a metric from {company}.",
      result: "How you would apply it to this team's problems in week one.",
    },
    tips: [
      "One strength, one story — not a list of adjectives",
      "Tie it directly to the job description",
      "Prove it with a number, not an opinion",
    ],
  },
  {
    id: "b9",
    category: "behavioral",
    difficulty: "medium",
    question: "What is your greatest weakness?",
    star: {
      situation: "A real, non-fatal weakness — honest and specific.",
      task: "Why it matters in your line of work.",
      action: "The concrete system you built to manage it.",
      result: "Evidence it is handled: a recent example where the system worked.",
    },
    tips: [
      "\u201cPerfectionism\u201d is a cliché — pick something real",
      "Show an active management system, not a promise",
      "Pick a weakness that is not core to this role",
    ],
  },
  {
    id: "b10",
    category: "behavioral",
    difficulty: "hard",
    question: "Tell me about a time you juggled multiple high-priority deadlines.",
    star: {
      situation: "The pile-up at {company}: competing projects with real stakes.",
      task: "Deciding what moved, what waited, and who needed to know.",
      action: "How you triaged by impact, renegotiated scope openly, and tracked it all.",
      result: "Everything landed or was consciously re-prioritized — give the numbers.",
    },
    tips: [
      "Show a triage framework, not heroics",
      "Renegotiating early beats missing silently",
      "Name the tool or system you used to track it all",
    ],
  },

  /* ---------------- Technical (10) ---------------- */
  {
    id: "t1",
    category: "technical",
    difficulty: "medium",
    question: "Walk me through how you make technical decisions.",
    tailored: (resume) => {
      const company = resume.experience[0]?.company;
      return company
        ? `Walk me through a major technical decision you made at ${company}.`
        : undefined;
    },
    star: {
      situation: "A real fork in the road at {company}: two viable options.",
      task: "The constraints — deadline, team skills, maintenance cost.",
      action: "Your evaluation process: criteria, spikes, and who you consulted.",
      result: "The choice, the outcome with numbers, and what you would revisit.",
    },
    tips: [
      "Show a repeatable framework, not a one-off story",
      "Name the trade-offs you accepted explicitly",
      "Mention where you sought a second opinion",
    ],
  },
  {
    id: "t2",
    category: "technical",
    difficulty: "easy",
    question: "What does your daily toolchain look like, and why?",
    tailored: (resume) => {
      const top = resume.skills
        .slice(0, 3)
        .map((s) => s.name)
        .filter(Boolean);
      return top.length >= 2 ? `Why have you bet on ${top.join(", ")}?` : undefined;
    },
    star: {
      situation: "Your daily stack, led by {skill}.",
      task: "The problems you solve with it at {company}.",
      action: "Why each tool earns its place: speed, ecosystem, team familiarity.",
      result: "A concrete win the stack enabled — faster delivery or fewer bugs.",
    },
    tips: [
      "Tie every tool to a problem it solves",
      "Admit one limitation you work around",
      "Show curiosity about alternatives",
    ],
  },
  {
    id: "t3",
    category: "technical",
    difficulty: "medium",
    question: "How do you ensure quality in your work?",
    star: {
      situation: "The quality bar your current team holds work to.",
      task: "What done well means for {skill} work: correctness, readability, performance.",
      action: "Your layers: tests, reviews, linting, staging checks, self-review habits.",
      result: "A bug-catching or regression story with a number attached.",
    },
    tips: [
      "Talk process, not perfection",
      "Include code review — giving and receiving",
      "One story where a quality check caught something big",
    ],
  },
  {
    id: "t4",
    category: "technical",
    difficulty: "hard",
    question: "Describe the most complex technical problem you have ever solved.",
    star: {
      situation: "The problem at {company}: why it was hard — unknowns, scale, ambiguity.",
      task: "What success looked like and the deadline pressure around it.",
      action: "How you broke it down: hypotheses, experiments, the breakthrough with {skill}.",
      result: "The measurable fix and its ripple effects: performance, cost, reliability.",
    },
    tips: [
      "Spend 20% on the problem, 80% on your method",
      "Explaining complexity simply IS the test",
      "Quantify the impact in your last sentence",
    ],
  },
  {
    id: "t5",
    category: "technical",
    difficulty: "medium",
    question: "How do you stay current in your field?",
    star: {
      situation: "Your field moves fast — say so honestly.",
      task: "What you optimize for: depth in {skill} vs. breadth of trends.",
      action: "Your system: sources, side projects, communities, teaching others.",
      result: "One recent technique you shipped into production.",
    },
    tips: [
      "Name specific sources, not \u201cI read a lot\u201d",
      "Side projects make this credible",
      "Teaching or writing about it is the strongest proof",
    ],
  },
  {
    id: "t6",
    category: "technical",
    difficulty: "hard",
    question: "How would you explain a complex technical concept to a non-technical stakeholder?",
    star: {
      situation: "A real moment: leadership needed to understand {skill} trade-offs.",
      task: "The decision they had to make based on your explanation.",
      action: "Your translation: one analogy, the cost of doing nothing, a clear visual.",
      result: "They decided quickly and correctly — describe what happened next.",
    },
    tips: [
      "Lead with the business impact, not the tech",
      "One analogy, used consistently — never condescending",
      "Check understanding with a question at the end",
    ],
  },
  {
    id: "t7",
    category: "technical",
    difficulty: "medium",
    question: "Tell me about a time you made something dramatically faster or cheaper.",
    tailored: (resume) => {
      const company = resume.experience[0]?.company;
      return company
        ? `Tell me about a time you made something at ${company} dramatically faster or cheaper.`
        : undefined;
    },
    star: {
      situation: "The slow or expensive thing: what it cost in time or dollars.",
      task: "The target and the constraint — no behavior changes allowed.",
      action: "How you profiled, found the bottleneck, and fixed it with {skill}.",
      result: "The before/after numbers: latency, cost, or hours saved.",
    },
    tips: [
      "Before/after numbers are the whole story",
      "Show how you measured, not guessed",
      "Mention what you refused to sacrifice",
    ],
  },
  {
    id: "t8",
    category: "technical",
    difficulty: "hard",
    question: "Walk me through something you designed and own end to end.",
    star: {
      situation: "The system or process: its users, scale, and why you owned it.",
      task: "The requirements and the ugliest constraint.",
      action: "Your architecture and iteration: v1 mistakes, v2 fixes, feedback loops.",
      result: "Where it stands today: adoption, reliability, or revenue numbers.",
    },
    tips: [
      "Own the failures inside it — that is credibility",
      "Describe it as components first, then connections",
      "End on how it evolves without you",
    ],
  },
  {
    id: "t9",
    category: "technical",
    difficulty: "easy",
    question: "What project are you most proud of?",
    tailored: (resume) => {
      const project = resume.projects[0]?.name;
      return project ? `Tell me about ${project} — what made it a success?` : undefined;
    },
    star: {
      situation: "The project and the problem it solved for real users.",
      task: "Your specific role and the hardest part.",
      action: "The decisions and craft that made the difference — show {skill} at work.",
      result: "The outcome: users, stars, revenue, or praise — whatever proves it mattered.",
    },
    tips: [
      "Pick something recent and yours, not a team credit",
      "Genuine enthusiasm is contagious — show it",
      "Have the demo or link ready to show",
    ],
  },
  {
    id: "t10",
    category: "technical",
    difficulty: "medium",
    question: "How do you debug something you have never seen before?",
    star: {
      situation: "A real example: unfamiliar system, production pressure.",
      task: "Narrowing an unknown-unknowns problem to a root cause.",
      action: "Your method: reproduce, isolate, bisect, question assumptions — plus {skill} tricks.",
      result: "The fix, the time to resolution, and the doc or test you left behind.",
    },
    tips: [
      "Show a systematic method, not trial and error",
      "Asking for help is a strength — say when you escalate",
      "Say what you wrote down so it never repeats",
    ],
  },

  /* ---------------- Situational (9) ---------------- */
  {
    id: "s1",
    category: "situational",
    difficulty: "medium",
    question: "What would you do in your first 30 days here?",
    star: {
      situation: "You are the new person — say that context out loud.",
      task: "Earn trust while learning: people, product, and process.",
      action: "Week 1: meet the team and ship something small. Weeks 2–4: map systems, find one quick win with {skill}.",
      result: "A 30-day read on where you can create the most value.",
    },
    tips: [
      "Ship something small early — it changes everything",
      "Ask more than you assert in week one",
      "Find their existing rhythm before proposing changes",
    ],
  },
  {
    id: "s2",
    category: "situational",
    difficulty: "hard",
    question: "You inherit a project that is already behind schedule. What are your first steps?",
    star: {
      situation: "The inherited project: a slipping date and murky status.",
      task: "Get an honest picture fast without assigning blame.",
      action: "Audit the plan, find the critical path, cut scope with stakeholders, re-baseline.",
      result: "A new credible date and a recovering team — name the trade-offs made.",
    },
    tips: [
      "Diagnose before touching anything",
      "Renegotiate scope first, hours second",
      "Communicate the new plan in writing to everyone",
    ],
  },
  {
    id: "s3",
    category: "situational",
    difficulty: "medium",
    question: "A teammate disagrees with your approach — in a public channel. What do you do?",
    star: {
      situation: "The public disagreement: what was challenged and who was watching.",
      task: "Resolve the technical question and protect the relationship.",
      action: "Acknowledge the point, move the debate to a call, weigh both options on merit.",
      result: "The better option won on evidence — and the teammate became an ally.",
    },
    tips: [
      "Never fight in public threads — de-escalate to private",
      "Attack the problem, never the person",
      "Be genuinely open to them being right",
    ],
  },
  {
    id: "s4",
    category: "situational",
    difficulty: "easy",
    question: "You have time for one of two urgent tasks. How do you decide?",
    star: {
      situation: "Two urgent tasks, one of you.",
      task: "Work out which one actually moves the needle for the team.",
      action: "Rank by impact and reversibility, then confirm with your manager in one message.",
      result: "A deliberate choice — and the other task re-planned, not dropped.",
    },
    tips: [
      "Impact first, effort second",
      "A one-line heads-up to stakeholders prevents surprises",
      "\u201cUrgent\u201d is not the same as \u201cimportant\u201d",
    ],
  },
  {
    id: "s5",
    category: "situational",
    difficulty: "medium",
    question: "How would you handle a stakeholder who keeps changing requirements?",
    star: {
      situation: "The shifting stakeholder: why the changes keep coming.",
      task: "Protect the timeline while keeping them engaged.",
      action: "Create a change process: written requests, cost trade-offs, a decision checkpoint.",
      result: "Fewer surprises, a shipped product, and a stakeholder who feels heard.",
    },
    tips: [
      "Show the cost of each change, in writing",
      "Never a flat no — offer options instead",
      "Understand the why behind the churn first",
    ],
  },
  {
    id: "s6",
    category: "situational",
    difficulty: "hard",
    question: "You spot a serious mistake in shipped work that nobody else noticed. What now?",
    star: {
      situation: "The discovered mistake: user impact and blast radius.",
      task: "Fix it fast and honestly, without triggering panic.",
      action: "Assess severity, notify the owner immediately, propose the fix, help ship it.",
      result: "Fixed before users noticed — plus a process tweak so it stays fixed.",
    },
    tips: [
      "Speed of disclosure beats perfection of diagnosis",
      "Bring a proposed fix, not just the alarm",
      "Blameless postmortems keep teams honest",
    ],
  },
  {
    id: "s7",
    category: "situational",
    difficulty: "medium",
    question: "Your manager asks you to take on work outside your role. How do you respond?",
    star: {
      situation: "The out-of-scope request and your current load.",
      task: "Be a team player without derailing your commitments.",
      action: "Say yes to learning if feasible, lay out trade-offs, agree priorities explicitly.",
      result: "Both goals met — or one consciously deferred with your manager aligned.",
    },
    tips: [
      "Never a flat no — make it \u201cyes, and here is what moves\u201d",
      "Frame stretch work as growth, if it genuinely is",
      "Get the re-prioritization in writing",
    ],
  },
  {
    id: "s8",
    category: "situational",
    difficulty: "easy",
    question: "How do you prioritize when everything feels urgent?",
    star: {
      situation: "The crunch moment: many tasks, all flagged urgent.",
      task: "Find the real order underneath the noise.",
      action: "Your method: impact vs. effort, deadlines, dependencies — then communicate the order.",
      result: "The important things shipped; the noise handled or declined with reasons.",
    },
    tips: [
      "Write the list down — brains are bad at ranking",
      "Ask \u201curgent for whom?\u201d — the answer reorders everything",
      "Communicate the ranking so nobody is surprised",
    ],
  },
  {
    id: "s9",
    category: "situational",
    difficulty: "hard",
    question: "First week in, you find a process that seems broken. Do you speak up?",
    star: {
      situation: "The broken process and why nobody has fixed it yet.",
      task: "Earn the right to suggest change without stepping on toes.",
      action: "Learn the history first, then propose a small experiment backed with data.",
      result: "Improved with buy-in — or you learned the constraint you were missing.",
    },
    tips: [
      "Understand why it exists before criticizing it",
      "Propose experiments, not verdicts",
      "Find the process owner and make them the hero",
    ],
  },

  /* ---------------- Leadership (8) ---------------- */
  {
    id: "l1",
    category: "leadership",
    difficulty: "medium",
    question: "Tell me about a time you mentored someone.",
    tailored: (resume) => {
      const company = resume.experience[0]?.company;
      return company ? `Tell me about someone you mentored at ${company}.` : undefined;
    },
    star: {
      situation: "The mentee: where they started and what they struggled with at {company}.",
      task: "What they actually needed — skill, confidence, or direction.",
      action: "Your cadence: pairing, feedback loops, progressively bigger ownership.",
      result: "The concrete outcome — promotion, shipped project, new skill — with a number.",
    },
    tips: [
      "Focus on their growth, not your teaching",
      "Name the moment they no longer needed you",
      "Numbers: promotions, retention, or delivery wins",
    ],
  },
  {
    id: "l2",
    category: "leadership",
    difficulty: "hard",
    question: "Tell me about influencing a decision when you had no formal authority.",
    star: {
      situation: "The decision that was not yours to make — and why it mattered.",
      task: "Win over people with different incentives than yours.",
      action: "You built the case with data, recruited allies one-on-one, let the owner decide.",
      result: "The decision went your way — the outcome and the trust it built.",
    },
    tips: [
      "Influence is earned one conversation at a time",
      "Frame ideas in the other person's incentives",
      "Let the decision owner keep the credit",
    ],
  },
  {
    id: "l3",
    category: "leadership",
    difficulty: "medium",
    question: "How do you delegate?",
    star: {
      situation: "Work you own that you cannot do alone.",
      task: "Match tasks to people's growth edges, not just availability.",
      action: "Your method: clear outcome, context, authority level, a check-in plan.",
      result: "Delivered work plus a person who grew — name a real example.",
    },
    tips: [
      "Delegate the outcome, not the task steps",
      "Delegation is development, not just offloading",
      "Say what you do NOT delegate and why",
    ],
  },
  {
    id: "l4",
    category: "leadership",
    difficulty: "hard",
    question: "Tell me about a time you made an unpopular decision.",
    star: {
      situation: "The decision at {company} and why it was necessary.",
      task: "The resistance: who disagreed and what it cost you socially.",
      action: "How you explained the reasoning, listened genuinely, and held the line.",
      result: "Vindicated by results — or adjusted with humility. Either is a good answer.",
    },
    tips: [
      "Disagree with the decision, never the people",
      "Show you genuinely considered the opposition",
      "Own the social cost — that is leadership",
    ],
  },
  {
    id: "l5",
    category: "leadership",
    difficulty: "easy",
    question: "How do you keep a team motivated during a crunch?",
    star: {
      situation: "The crunch: deadline pressure and visibly tired people.",
      task: "Sustain output without burning humans.",
      action: "Shield the team, celebrate small wins, work alongside them, cut scope openly.",
      result: "The delivered milestone plus a team intact — retention or follow-on results.",
    },
    tips: [
      "Protect the team from churn above you",
      "Small public wins beat big promises",
      "People remember how you acted at 11pm",
    ],
  },
  {
    id: "l6",
    category: "leadership",
    difficulty: "medium",
    question: "Tell me about helping a struggling teammate.",
    star: {
      situation: "The teammate: the signs of struggle, not your assumptions about causes.",
      task: "Help without taking over their work.",
      action: "You created safety, asked what they needed, paired on the hardest parts.",
      result: "Their recovery: delivered work, confidence back, maybe a saved role.",
    },
    tips: [
      "Ask before advising — diagnose together",
      "Privacy matters: no public rescues",
      "Struggles are usually context, not character",
    ],
  },
  {
    id: "l7",
    category: "leadership",
    difficulty: "hard",
    question: "You join a team with low trust. How do you build trust fast?",
    star: {
      situation: "The low-trust situation: what caused it, how it shows up day to day.",
      task: "Rebuild credibility as a newcomer without overstepping.",
      action: "Listen first, fix one visible pain point, make your own commitments trackable.",
      result: "Trust returning: honest debates, improved delivery, people staying.",
    },
    tips: [
      "Trust is built by kept micro-promises",
      "Do the unglamorous work visibly",
      "Never talk about trust — demonstrate it",
    ],
  },
  {
    id: "l8",
    category: "leadership",
    difficulty: "medium",
    question: "What does great leadership look like to you?",
    star: {
      situation: "Ground it in a leader you actually worked with.",
      task: "What their impact was on you and the team.",
      action: "Extract the behaviors: clarity, shielding, high standards, genuine care.",
      result: "How you practice those behaviors today with your team and your {skill} work.",
    },
    tips: [
      "Show a philosophy, not a motivational poster",
      "One concrete story beats five abstractions",
      "Tie it to how you would lead this team",
    ],
  },

  /* ---------------- Company / Culture (8) ---------------- */
  {
    id: "c1",
    category: "company",
    difficulty: "easy",
    question: "Why do you want to work here?",
    star: {
      situation: "What drew you: the product, the mission, or a problem you have lived.",
      task: "The match between your {skill} strengths and their needs.",
      action: "Research: name a product detail, launch, or value that resonates with you.",
      result: "Close with the specific contribution you want to make in the {role} seat.",
    },
    tips: [
      "Name something specific — no generic praise",
      "Connect their roadmap to your experience",
      "Enthusiasm is a strategy, not a weakness",
    ],
  },
  {
    id: "c2",
    category: "company",
    difficulty: "medium",
    question: "What do you know about our company so far?",
    star: {
      situation: "Open with their one-liner: what they do and for whom.",
      task: "Layer in what you found: recent launches, growth, culture signals.",
      action: "Show how you researched — product used, docs read, people followed.",
      result: "End with a smart question — research earns the right to ask.",
    },
    tips: [
      "Use their product the week before",
      "Mention something recent — a launch or milestone",
      "One thoughtful question beats ten facts",
    ],
  },
  {
    id: "c3",
    category: "company",
    difficulty: "easy",
    question: "What kind of culture helps you do your best work?",
    star: {
      situation: "Your best-work conditions: autonomy, feedback, pace.",
      task: "Why those conditions matter for {skill} work.",
      action: "Evidence: a team where you thrived and what it had in common with this one.",
      result: "Invite the fit check — ask how their team would describe itself.",
    },
    tips: [
      "Describe conditions, not demands",
      "Show you adapt to different cultures",
      "Turn it into a two-way conversation",
    ],
  },
  {
    id: "c4",
    category: "company",
    difficulty: "medium",
    question: "How do you prefer to receive feedback?",
    star: {
      situation: "Your honest preference: direct, specific, written or verbal.",
      task: "Why that format helps you act faster.",
      action: "How you adapted to managers with other styles — give one example.",
      result: "Feedback loops that made you measurably better — name a change it drove.",
    },
    tips: [
      "Never say \u201cany feedback is fine\u201d",
      "Show you act on feedback quickly",
      "Asking for it proactively is the real flex",
    ],
  },
  {
    id: "c5",
    category: "company",
    difficulty: "medium",
    question: "Where do you see yourself in two years?",
    star: {
      situation: "Your two-year arc: deeper expertise in {skill}, broader scope.",
      task: "Why this role is the right platform for that arc.",
      action: "Concrete markers: ownership, mentorship, a domain you want to master here.",
      result: "Their win: someone who grows in place instead of leaving.",
    },
    tips: [
      "Ambition plus commitment — in that order",
      "Anchor growth to this company, not away from it",
      "Avoid titles; talk about scope and impact",
    ],
  },
  {
    id: "c6",
    category: "company",
    difficulty: "easy",
    question: "What questions do you have for us?",
    star: {
      situation: "Have three ready: role, team, and success.",
      task: "The question that shows you already think like an insider.",
      action: "Ask about the biggest challenge in the first 90 days and how success is measured.",
      result: "Their answer tells you what you are really signing up for.",
    },
    tips: [
      "Never say \u201cI have no questions\u201d",
      "Ask about challenges, not perks — perks come later",
      "One question should reference something they said earlier",
    ],
  },
  {
    id: "c7",
    category: "company",
    difficulty: "medium",
    question: "Why should we hire you over other candidates?",
    star: {
      situation: "Acknowledge the competition gracefully — no trash talk.",
      task: "The two or three things this role actually needs.",
      action: "Match your proof: {skill} track record with numbers from {company}.",
      result: "The unique overlap: their need, your evidence, your excitement for this team.",
    },
    tips: [
      "Be confident, never cocky",
      "Answer the need behind the question",
      "End with genuine excitement, not a summary",
    ],
  },
  {
    id: "c8",
    category: "company",
    difficulty: "hard",
    question: "What would make you turn down an offer from us?",
    star: {
      situation: "Answer honestly but constructively — this is a values check.",
      task: "Your non-negotiables: growth, honesty, sustainable pace.",
      action: "How you would raise concerns early instead of silently leaving.",
      result: "Reassure them: most concerns are solvable when talked about early.",
    },
    tips: [
      "Lead with values — money alone is a weak answer",
      "Keep it to two non-negotiables, at most",
      "Show you resolve problems by talking, not leaving",
    ],
  },
];

/* ============================== Generator ============================== */

function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
  return arr;
}

function instantiate(question: Question, resume: ResumeData): PracticeQuestion {
  const tailoredText = question.tailored?.(resume);
  const useTailored = typeof tailoredText === "string" && tailoredText.length > 0;
  return {
    ...question,
    text:
      useTailored && tailoredText
        ? tailoredText
        : resolvePlaceholders(question.question, resume),
    isTailored: useTailored,
    resolvedStar: resolveStar(question.star, resume),
  };
}

/**
 * Builds a practice set: filters the bank by category + difficulty, shuffles,
 * prefers resume-tailored variants, and round-robins across categories so
 * every selected category is represented when possible.
 */
export function generateQuestions(
  resume: ResumeData,
  { categories, difficulty, count = 8 }: GenerateOptions
): PracticeQuestion[] {
  const allowed = categories.length > 0 ? categories : CATEGORY_ORDER;
  const pool = QUESTION_BANK.filter(
    (q) =>
      allowed.includes(q.category) &&
      (difficulty === "all" || q.difficulty === difficulty)
  );

  // One shuffled, tailored-first bucket per selected category.
  const buckets = new Map<QuestionCategory, Question[]>();
  for (const cat of allowed) {
    const inCat = shuffle(pool.filter((q) => q.category === cat)).sort(
      (a, b) => Number(Boolean(b.tailored)) - Number(Boolean(a.tailored))
    );
    if (inCat.length > 0) buckets.set(cat, inCat);
  }

  const picked: Question[] = [];
  while (picked.length < count && buckets.size > 0) {
    for (const [cat, queue] of buckets) {
      const next = queue.shift();
      if (next) picked.push(next);
      if (queue.length === 0) buckets.delete(cat);
      if (picked.length >= count) break;
    }
  }

  return picked.map((q) => instantiate(q, resume));
}
