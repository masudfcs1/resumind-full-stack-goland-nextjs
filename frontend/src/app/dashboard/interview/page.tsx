"use client";

import * as React from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  Check,
  Compass,
  EyeOff,
  Focus,
  GraduationCap,
  ListChecks,
  Loader2,
  MessagesSquare,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_META, useResumeStore, type ApplicationStage } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

import { FocusMode } from "@/components/interview/focus-mode";
import { Flashcard } from "@/components/interview/flashcard";
import {
  favoriteKey,
  readFavorites,
  writeFavorites,
} from "@/components/interview/favorites";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  DIFFICULTY_META,
  PHASE_COACH,
  TIER_ORDER,
  generateQuestions,
  ladderSort,
  type Difficulty,
  type DifficultyFilter,
  type PracticeQuestion,
  type QuestionCategory,
  type StarAnswer,
} from "@/components/interview/question-bank";
import {
  buildCompanyQuestions,
  companyAvatarGradient,
  STAGE_HINT,
} from "@/components/interview/company-questions";
import { TipsPanel } from "@/components/interview/tips-panel";
import { ResumeSelect } from "@/components/tools/resume-select";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { staggerContainer, staggerItem } from "@/components/tools/variants";
import { companyInitials } from "@/components/tracker/stage-utils";

/* ============================== Constants ============================== */

const QUESTIONS_PER_SET = 8;
const GENERATE_DELAY_MS = 1200;
const COMPANY_GENERATE_DELAY_MS = 700;

/** Where the active session's questions came from. */
type SessionOrigin =
  | { kind: "bank" }
  | { kind: "company"; company: string; role: string; stage: ApplicationStage };

/** One deduped company derived from the Job Tracker applications. */
interface CompanyEntry {
  key: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  count: number;
}

const DIFFICULTY_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

/** Phase strip segments — one per ladder tier, in ladder order. */
const PHASE_SEGMENTS: {
  tier: Difficulty;
  id: string;
  /** Border + background when this segment is the active phase. */
  active: string;
  /** Subtle tier-tinted glow ring on the active segment (light + dark). */
  glow: string;
  /** Label tint when active (tier color, dark-aware). */
  text: string;
  /** Practiced-progress fill behind the segment. */
  fill: string;
}[] = [
  {
    tier: "easy",
    id: "warm-up",
    active: "border-emerald-500/50 bg-emerald-500/5",
    glow:
      "ring-1 ring-emerald-500/40 shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)] dark:ring-emerald-400/30 dark:shadow-[0_0_18px_-6px_rgba(52,211,153,0.35)]",
    text: "text-emerald-700 dark:text-emerald-400",
    fill: "bg-emerald-500/15 dark:bg-emerald-500/20",
  },
  {
    tier: "medium",
    id: "core",
    active: "border-amber-500/50 bg-amber-500/5",
    glow:
      "ring-1 ring-amber-500/40 shadow-[0_0_18px_-6px_rgba(245,158,11,0.5)] dark:ring-amber-400/30 dark:shadow-[0_0_18px_-6px_rgba(251,191,36,0.35)]",
    text: "text-amber-700 dark:text-amber-400",
    fill: "bg-amber-500/15 dark:bg-amber-500/20",
  },
  {
    tier: "hard",
    id: "stretch",
    active: "border-rose-500/50 bg-rose-500/5",
    glow:
      "ring-1 ring-rose-500/40 shadow-[0_0_18px_-6px_rgba(244,63,94,0.5)] dark:ring-rose-400/30 dark:shadow-[0_0_18px_-6px_rgba(251,113,133,0.35)]",
    text: "text-rose-700 dark:text-rose-400",
    fill: "bg-rose-500/15 dark:bg-rose-500/20",
  },
];

/** Coach-tip tint for the phase guidance line, keyed by the active tier. */
const PHASE_COACH_TINT: Record<Difficulty, string> = {
  easy: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
  medium: "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300",
  hard: "border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-300",
};

/* ============================== Sub components ============================== */

function DifficultySegmentedControl({
  value,
  onChange,
}: {
  value: DifficultyFilter;
  onChange: (value: DifficultyFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by difficulty"
      className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
    >
      {DIFFICULTY_FILTERS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryChips({
  selected,
  onToggle,
}: {
  selected: QuestionCategory[];
  onToggle: (category: QuestionCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Question categories">
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        const active = selected.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(cat)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
              active
                ? cn(meta.tint, "shadow-sm")
                : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {meta.label}
            {active ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Rounded initials avatar with a deterministic tasteful gradient. */
function CompanyAvatar({
  company,
  className,
}: {
  company: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm",
        companyAvatarGradient(company),
        className ?? "size-8 text-[11px]"
      )}
    >
      {companyInitials(company)}
    </span>
  );
}

/** Stage badge using the tracker's color conventions (dot + label). */
function StageBadge({ stage }: { stage: ApplicationStage }) {
  const meta = STAGE_META[stage];
  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1.5 border-border/70 bg-background/60 text-[10px] font-medium text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </Badge>
  );
}

/**
 * Amber star toggle for favoriting a company. Filled amber-400 when active,
 * pops on press, and stops propagation so it can live beside a select button.
 */
function StarToggle({
  active,
  companyName,
  onToggle,
  size = "size-7",
  iconSize = "size-3.5",
  className,
}: {
  active: boolean;
  companyName: string;
  onToggle: () => void;
  size?: string;
  iconSize?: string;
  className?: string;
}) {
  const label = active
    ? `Remove ${companyName} from favorites`
    : `Add ${companyName} to favorites`;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "text-amber-400 hover:bg-amber-500/10"
          : "text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-500",
        size,
        className
      )}
    >
      <Star
        aria-hidden="true"
        className={cn(iconSize, active && "fill-amber-400")}
      />
    </motion.button>
  );
}

/** Tabs-like All/Starred two-button filter for the company chip list. */
function FavFilterToggle({
  value,
  onChange,
  starredCount,
}: {
  value: "all" | "starred";
  onChange: (value: "all" | "starred") => void;
  starredCount: number;
}) {
  const options = [
    { value: "all" as const, label: "All" },
    { value: "starred" as const, label: "Starred", count: starredCount },
  ];
  return (
    <div
      role="group"
      aria-label="Filter companies by favorites"
      className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              active
                ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.value === "starred" ? (
              <Star
                aria-hidden="true"
                className={cn("size-3", active && "fill-amber-400 text-amber-400")}
              />
            ) : null}
            {option.label}
            {option.count !== undefined ? (
              <span className="tabular-nums opacity-70">{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Ladder-aware Focus Mode toggle — a compact pill with an embedded mini-switch
 * and aria-pressed. ON filters the grid down to the unpracticed cards of the
 * current phase and powers the tier-clearance flow below the phase strip.
 * (Named "Focus" in the UI to stay distinct from the one-card-at-a-time
 * "Focus Mode" practice dialog that already lived on this page.)
 */
function FocusToggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Ladder focus — show only unpracticed questions in the current phase"
      data-focus-toggle="true"
      data-focus-on={on ? "true" : "false"}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        on
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 shadow-[0_0_16px_-6px_rgba(16,185,129,0.6)] dark:border-emerald-400/50 dark:bg-emerald-400/10 dark:text-emerald-300 dark:shadow-[0_0_16px_-6px_rgba(52,211,153,0.45)]"
          : "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground"
      )}
    >
      <Target className="size-3.5" aria-hidden="true" />
      Focus
      <span
        aria-hidden="true"
        className={cn(
          "flex h-3.5 w-6 items-center rounded-full p-0.5 transition-colors duration-200",
          on ? "bg-emerald-500 dark:bg-emerald-400" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "size-2.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            on ? "translate-x-2.5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

/** Shimmering placeholder card shown while "AI" generates the set. */
function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-5 w-full" />
      <Skeleton className="mt-2 h-5 w-3/4" />
      <div className="mt-10 flex items-center justify-between">
        <Skeleton className="h-2.5 w-12 rounded-full" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
        animate={{ x: ["-140%", "360%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
}

/* ============================== Phase strip ============================== */

/**
 * Slim 3-segment difficulty ladder strip (Warm-up / Core / Stretch) shown
 * above the question list. Each segment carries its phase count and a
 * practiced-progress fill; the active segment glows in its tier tint, and a
 * one-line coach hint sits underneath. While ladder-aware Focus Mode is on,
 * fully-practiced segments show a small check and the active segment stays
 * on the practice frontier (the ladder marker) even when the user has
 * steered Focus elsewhere — the steered tier instead carries a small
 * emerald focus pip so both signals stay visible at once.
 */
function PhaseStrip({
  questions,
  practicedIds,
  activeTier,
  focusActive,
  focusTier,
  steeredTier,
  focusNote,
}: {
  questions: PracticeQuestion[];
  practicedIds: ReadonlySet<string>;
  /** Tier shown as the active segment (frontier or dialog card). */
  activeTier: Difficulty;
  /** Focus Mode on? Gates the cleared checks + the focus coach note. */
  focusActive: boolean;
  /** Tier Focus Mode filters to (null while off). */
  focusTier: Difficulty | null;
  /** Tier the user explicitly steered to (null = auto-follow frontier). */
  steeredTier: Difficulty | null;
  /** Pre-computed focus coach note (null while focus is off). */
  focusNote: string | null;
}) {
  const reducedMotion = useReducedMotion();

  const segments = React.useMemo(
    () =>
      PHASE_SEGMENTS.map((seg) => {
        const idxs = questions
          .map((q, i) => (q.difficulty === seg.tier ? i : -1))
          .filter((i) => i >= 0);
        const practiced = idxs.filter((i) => {
          const q = questions[i];
          return q ? practicedIds.has(q.id) : false;
        }).length;
        return { ...seg, count: idxs.length, practiced };
      }),
    [questions, practicedIds]
  );

  const currentSegment = PHASE_SEGMENTS.find((s) => s.tier === activeTier);

  return (
    <motion.section
      variants={staggerItem}
      aria-label="Difficulty phases"
      data-phase-strip="true"
      data-current-phase={currentSegment?.id ?? "warm-up"}
      data-focus-active={focusActive ? "true" : "false"}
      data-focus-tier={focusActive && focusTier ? focusTier : ""}
      data-focus-steered={focusActive && steeredTier ? "true" : "false"}
    >
      <div className="flex gap-1.5 sm:gap-2">
        {segments.map((seg) => {
          const active = seg.tier === activeTier;
          const cleared = seg.count > 0 && seg.practiced === seg.count;
          const fillPct =
            seg.count > 0 ? Math.round((seg.practiced / seg.count) * 100) : 0;
          return (
            <div
              key={seg.tier}
              data-phase={seg.id}
              data-tier={seg.tier}
              data-count={seg.count}
              data-active={active ? "true" : "false"}
              data-cleared={cleared ? "true" : "false"}
              className={cn(
                "relative min-w-0 flex-1 overflow-hidden rounded-lg border px-2.5 py-1.5 transition-all sm:px-3",
                active ? cn(seg.active, seg.glow) : "border-border"
              )}
            >
              <motion.div
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0", seg.fill)}
                initial={false}
                animate={{ width: `${fillPct}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 140, damping: 22 }
                }
              />
              <div className="relative flex min-w-0 items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[10px] font-semibold uppercase tracking-[0.12em]",
                    active ? seg.text : "text-muted-foreground"
                  )}
                >
                  {DIFFICULTY_META[seg.tier].phase}
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-[10px] font-semibold tabular-nums",
                    active ? seg.text : "text-muted-foreground/70"
                  )}
                >
                  {/* Focus pip — marks the steered tier, distinct from the
                      ladder marker (active glow) and the cleared check. */}
                  {focusActive && steeredTier === seg.tier ? (
                    <span
                      aria-hidden="true"
                      data-focus-pip="true"
                      title="Focus pinned to this tier"
                      className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.65)] dark:bg-emerald-400"
                    />
                  ) : null}
                  {focusActive && cleared ? (
                    <Check
                      className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : null}
                  {seg.practiced}/{seg.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p
        className={cn(
          "mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed",
          PHASE_COACH_TINT[activeTier]
        )}
      >
        <Compass className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Coach:</span> {PHASE_COACH[activeTier]}
          {focusNote ? (
            <span className="font-medium">{focusNote}</span>
          ) : null}
        </span>
      </p>
      <p className="sr-only">
        {`Phases: ${segments
          .map((s) => `${DIFFICULTY_META[s.tier].phase} ${s.count} questions`)
          .join(" · ")}. Currently in the ${DIFFICULTY_META[activeTier].phase} phase.${
          focusActive && focusTier
            ? steeredTier
              ? ` Focus Mode is on and pinned to the ${DIFFICULTY_META[steeredTier].phase} tier — showing its unpracticed questions.`
              : ` Focus Mode is on — showing unpracticed ${DIFFICULTY_META[focusTier].phase} questions.`
            : ""
        }`}
      </p>
    </motion.section>
  );
}

/* ============================== Clearance lookup ============================== */

/** Per-tier practice counts driving the ladder flow. */
type TierStat = { count: number; practiced: number; unpracticed: number };

/**
 * Mid-ladder clearance lookup: finds the tier whose completion the clearance
 * CTA announces plus the next tier (skipping cleared and empty ones) that
 * still has unpracticed cards. Two announcement sources:
 *  - Steered (focusTier set): the pinned tier itself, announced once every
 *    card of it is practiced (the filter stays pinned, so the grid empties
 *    and the CTA gates the next step).
 *  - Auto (focusTier null): the filter keeps auto-queueing to the first tier
 *    with unpracticed cards exactly as before, so the just-cleared tier is
 *    the closest fully-practiced tier below the frontier — the CTA announces
 *    it while the grid has already moved on ("Warm-up cleared — focus Core").
 * Returns null while nothing is announcable; the replay CTA covers the
 * everything-practiced case separately.
 */
function findClearance(
  focusOn: boolean,
  focusTier: Difficulty | null,
  orderedSession: PracticeQuestion[] | null,
  frontierTier: Difficulty,
  tierStats: ReadonlyMap<Difficulty, TierStat>
): { announced: Difficulty; target: Difficulty } | null {
  if (!focusOn || !orderedSession || orderedSession.length === 0) return null;
  let announced: Difficulty | null = null;
  if (focusTier) {
    const stat = tierStats.get(focusTier);
    announced = stat && stat.count > 0 && stat.unpracticed === 0 ? focusTier : null;
  } else {
    const frontierIdx = TIER_ORDER.indexOf(frontierTier);
    for (let i = frontierIdx - 1; i >= 0; i -= 1) {
      const stat = tierStats.get(TIER_ORDER[i]);
      if (stat && stat.count > 0 && stat.unpracticed === 0) {
        announced = TIER_ORDER[i];
        break;
      }
    }
  }
  if (!announced) return null;
  const start = TIER_ORDER.indexOf(announced);
  for (let i = start + 1; i < TIER_ORDER.length; i += 1) {
    const tier = TIER_ORDER[i];
    if ((tierStats.get(tier)?.unpracticed ?? 0) > 0) {
      return { announced, target: tier };
    }
  }
  return null;
}

/* ============================== Page ============================== */

export default function InterviewPage() {
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const applications = useResumeStore((s) => s.applications);

  const resume = resumes.find((r) => r.id === activeResumeId) ?? resumes[0];

  const [selectedCategories, setSelectedCategories] =
    React.useState<QuestionCategory[]>(CATEGORY_ORDER);
  const [difficulty, setDifficulty] = React.useState<DifficultyFilter>("all");
  const [generating, setGenerating] = React.useState(false);
  const [session, setSession] = React.useState<PracticeQuestion[] | null>(null);
  const [generation, setGeneration] = React.useState(0);
  const [practicedIds, setPracticedIds] = React.useState<Set<string>>(new Set());
  /**
   * Ladder-aware Focus Mode — UI-local BY DESIGN: deliberately NOT persisted
   * and NOT stored in the resume store. Hiding practiced cards is a per-visit
   * viewing preference and the tier-clearance flow restarts whenever the set
   * is regenerated, so there is nothing worth carrying across reloads.
   */
  const [focusOn, setFocusOn] = React.useState(false);
  /** Explicit focus tier; null = auto-follow the practice frontier. */
  const [focusTier, setFocusTier] = React.useState<Difficulty | null>(null);
  const [focusOpen, setFocusOpen] = React.useState(false);
  /** Restore target for keyboard users when the Focus Mode dialog closes —
      Radix's built-in restore can lose the trigger when its layout block
      re-renders mid-close (focus would fall to <body>). */
  const focusTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [focusIndex, setFocusIndex] = React.useState(0);
  const [starNotes, setStarNotes] = React.useState<Record<string, StarAnswer>>({});
  const [sessionOrigin, setSessionOrigin] = React.useState<SessionOrigin | null>(null);
  const [companyVariant, setCompanyVariant] = React.useState(0);
  /** Starred companies (normalized keys) — lazy-read after mount, SSR-safe. */
  const [favorites, setFavorites] = React.useState<string[]>(() => readFavorites());
  const [favFilter, setFavFilter] = React.useState<"all" | "starred">("all");
  const timerRef = React.useRef<number | null>(null);

  /** Sync mirror of favorites so rapid toggles never race the persisted copy. */
  const favoritesRef = React.useRef<string[]>(favorites);

  /** Adds/removes a company from favorites and persists best-effort. */
  const toggleFavorite = React.useCallback(
    (companyName: string) => {
      const key = favoriteKey(companyName);
      const cur = favoritesRef.current;
      const wasFavorite = cur.includes(key);
      const next = wasFavorite
        ? cur.filter((f) => f !== key)
        : [...cur, key];
      favoritesRef.current = next;
      setFavorites(next);
      if (!writeFavorites(next)) {
        toast.error("Couldn't save favorites", {
          description: "Browser storage is unavailable in this session.",
        });
      }
      if (wasFavorite) {
        toast(`${companyName} removed from favorites`);
      } else {
        toast.success(`${companyName} added to favorites`);
      }
    },
    []
  );

  React.useEffect(() => {
    // If the last favorite is un-starred while the Starred filter is active,
    // fall back to All so the list never renders as an empty mystery.
    if (favFilter === "starred" && favorites.length === 0) setFavFilter("all");
  }, [favFilter, favorites.length]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const generate = React.useCallback(() => {
    if (!resume || generating) return;
    setGenerating(true);
    const next = generateQuestions(resume, {
      categories: selectedCategories,
      difficulty,
      count: QUESTIONS_PER_SET,
    });
    timerRef.current = window.setTimeout(() => {
      if (next.length === 0) {
        toast.warning("No questions match those filters", {
          description: "Try selecting more categories or a different difficulty.",
        });
        setGenerating(false);
        return;
      }
      setSession(next);
      setPracticedIds(new Set());
      setFocusTier(null); // Focus re-syncs to the fresh practice frontier
      setFocusIndex(0);
      setGeneration((g) => g + 1);
      setSessionOrigin({ kind: "bank" });
      setCompanyVariant(0);
      setGenerating(false);
      toast.success(`Question set ready — ${next.length} questions`, {
        description: `Tailored from "${resume.title}". Flip a card to reveal the STAR framework.`,
      });
    }, GENERATE_DELAY_MS);
  }, [resume, generating, selectedCategories, difficulty]);

  /** Starts a company-specific session from a tracked application. */
  const startCompanySession = React.useCallback(
    (entry: CompanyEntry) => {
      if (generating) return;
      setGenerating(true);
      setCompanyVariant(0);
      const next = buildCompanyQuestions(entry.company, entry.role, entry.stage, {
        resume,
        variant: 0,
      });
      timerRef.current = window.setTimeout(() => {
        setSession(next);
        setPracticedIds(new Set());
        setFocusTier(null); // Focus re-syncs to the fresh practice frontier
        setFocusIndex(0);
        setGeneration((g) => g + 1);
        setSessionOrigin({
          kind: "company",
          company: entry.company,
          role: entry.role,
          stage: entry.stage,
        });
        setGenerating(false);
        toast.success(`${entry.company} set ready — ${next.length} questions`, {
          description: `Built from your tracker · ${STAGE_META[entry.stage].label} stage.`,
        });
      }, COMPANY_GENERATE_DELAY_MS);
    },
    [generating, resume]
  );

  /** Re-rolls the pulled questions of the active company set (6 fixed ones stay). */
  const reshuffleCompany = React.useCallback(() => {
    if (!sessionOrigin || sessionOrigin.kind !== "company" || generating) return;
    const variant = companyVariant + 1;
    setGenerating(true);
    setCompanyVariant(variant);
    const next = buildCompanyQuestions(
      sessionOrigin.company,
      sessionOrigin.role,
      sessionOrigin.stage,
      { resume, variant }
    );
    timerRef.current = window.setTimeout(() => {
      setSession(next);
      setPracticedIds(new Set());
      setFocusTier(null); // Focus re-syncs to the fresh practice frontier
      setFocusIndex(0);
      setGeneration((g) => g + 1);
      setGenerating(false);
      toast.success(`${sessionOrigin.company} set reshuffled — ${next.length} questions`);
    }, COMPANY_GENERATE_DELAY_MS);
  }, [sessionOrigin, generating, companyVariant, resume]);

  /** Unique companies from the tracker — latest application defines stage/role. */
  const companySets = React.useMemo<CompanyEntry[]>(() => {
    const byKey = new Map<string, { entry: CompanyEntry; latest: number }>();
    for (const app of applications) {
      const key = app.company.trim().toLowerCase();
      if (!key) continue;
      const existing = byKey.get(key);
      if (existing) {
        existing.entry.count += 1;
        if (app.updatedAt > existing.latest) {
          existing.latest = app.updatedAt;
          existing.entry.company = app.company;
          existing.entry.role = app.role;
          existing.entry.stage = app.stage;
        }
      } else {
        byKey.set(key, {
          entry: { key, company: app.company, role: app.role, stage: app.stage, count: 1 },
          latest: app.updatedAt,
        });
      }
    }
    const all = [...byKey.values()].map((v) => v.entry);
    // Deterministic ordering: favorites first, each group alphabetical.
    const byName = (a: CompanyEntry, b: CompanyEntry) =>
      a.company.localeCompare(b.company, "en", { sensitivity: "base" }) ||
      a.key.localeCompare(b.key);
    const starred = all
      .filter((e) => favorites.includes(e.key))
      .sort(byName);
    const rest = all
      .filter((e) => !favorites.includes(e.key))
      .sort(byName);
    return [...starred, ...rest];
  }, [applications, favorites]);

  /** Chips currently visible — applies the All/Starred filter when set. */
  const visibleCompanySets = React.useMemo<CompanyEntry[]>(() => {
    if (favFilter !== "starred" || favorites.length === 0) return companySets;
    return companySets.filter((c) => favorites.includes(c.key));
  }, [companySets, favorites, favFilter]);

  const toggleCategory = React.useCallback((cat: QuestionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  /** Marks a card practiced — each unique card counts once. */
  const markPracticed = React.useCallback(
    (id: string) => {
      setPracticedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        if (session && next.size === session.length) {
          toast.success("Session complete — every question practiced. Nice work.");
        }
        return next;
      });
    },
    [session]
  );

  const handleNotesChange = React.useCallback((id: string, note: StarAnswer) => {
    setStarNotes((prev) => ({ ...prev, [id]: note }));
  }, []);

  const openFocus = (index: number) => {
    setFocusIndex(index);
    setFocusOpen(true);
  };

  const practicedCount = practicedIds.size;
  const totalCount = session?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((practicedCount / totalCount) * 100) : 0;
  const tailoredCount = session?.filter((q) => q.isTailored).length ?? 0;

  /** Ladder-ordered session: Easy → Medium → Hard, stable within each tier. */
  const orderedSession = React.useMemo(
    () => (session ? ladderSort(session) : null),
    [session]
  );

  /* ============================== Focus Mode (ladder-aware) ============================== */

  /** Tier of the practice frontier — first unpracticed, else the last question. */
  const frontierTier = React.useMemo(() => {
    if (!orderedSession || orderedSession.length === 0) return "easy" as Difficulty;
    const frontier = orderedSession.find((q) => !practicedIds.has(q.id));
    return (frontier ?? orderedSession[orderedSession.length - 1]).difficulty;
  }, [orderedSession, practicedIds]);

  /**
   * Per-tier practice stats driving the strip checks, the clearance flow and
   * the focus filter. Purely derived — no extra state to keep in sync.
   */
  const tierStats = React.useMemo(() => {
    const stats = new Map<
      Difficulty,
      { count: number; practiced: number; unpracticed: number }
    >();
    for (const tier of TIER_ORDER) {
      stats.set(tier, { count: 0, practiced: 0, unpracticed: 0 });
    }
    for (const q of orderedSession ?? []) {
      const stat = stats.get(q.difficulty);
      if (!stat) continue;
      stat.count += 1;
      if (practicedIds.has(q.id)) stat.practiced += 1;
      else stat.unpracticed += 1;
    }
    return stats;
  }, [orderedSession, practicedIds]);

  /**
   * The tier Focus Mode filters to. User-steerable: `focusTier` stays null
   * (and this stays the first tier with unpracticed cards, so the filter
   * auto-queues the ladder exactly as before) until the user explicitly
   * advances via the clearance CTA. Once steered it is pinned — showing the
   * chosen tier's unpracticed cards even if an earlier tier still has some —
   * until Focus is toggled off or the set regenerates.
   */
  const effectiveFocusTier = focusTier ?? frontierTier;

  /**
   * Cards shown in the grid, with their stable ladder index (card numbers do
   * not renumber while filtering). Focus ON = unpracticed cards of the focus
   * tier only; OFF = the full ladder, exactly as before Focus Mode existed.
   */
  const visibleEntries = React.useMemo(() => {
    if (!orderedSession) return [] as { q: PracticeQuestion; index: number }[];
    const all = orderedSession.map((q, index) => ({ q, index }));
    if (!focusOn) return all;
    return all.filter(
      ({ q }) => q.difficulty === effectiveFocusTier && !practicedIds.has(q.id)
    );
  }, [orderedSession, focusOn, effectiveFocusTier, practicedIds]);

  /** While Focus Mode is on, every practiced card is hidden from the grid. */
  const hiddenPracticedCount = focusOn ? practicedIds.size : 0;

  /**
   * Mid-ladder clearance (see findClearance): the announced tier plus the
   * next one with unpracticed cards, or null — the replay CTA covers the
   * everything-practiced case.
   */
  const clearance = findClearance(
    focusOn,
    focusTier,
    orderedSession,
    frontierTier,
    tierStats
  );

  /** Every question in the set practiced — gates the replay CTA. */
  const allCleared = totalCount > 0 && practicedCount === totalCount;

  /** Last tier that actually has cards — the replay target once all clear. */
  const replayTier = React.useMemo(() => {
    for (let i = TIER_ORDER.length - 1; i >= 0; i -= 1) {
      if ((tierStats.get(TIER_ORDER[i])?.count ?? 0) > 0) return TIER_ORDER[i];
    }
    return null;
  }, [tierStats]);

  const toggleFocus = React.useCallback(() => {
    if (focusOn) {
      setFocusOn(false);
    } else {
      // Toggling Focus off and back on resets the steer (focusTier → null):
      // the filter snaps back to auto-queueing the practice frontier and the
      // user steers again from the clearance CTA.
      setFocusTier(null);
      setFocusOn(true);
    }
  }, [focusOn]);

  /** Clearance CTA: pin the focus tier to the next one with unpracticed cards. */
  const advanceFocusTier = React.useCallback(() => {
    if (!clearance) return;
    const from = DIFFICULTY_META[clearance.announced].phase;
    const to = DIFFICULTY_META[clearance.target].phase;
    setFocusTier(clearance.target);
    toast.success(`${from} cleared — now focusing ${to}`);
  }, [clearance]);

  /** All tiers done: un-practice the hardest tier so it can be replayed. */
  const replayFinalTier = React.useCallback(() => {
    if (!replayTier || !orderedSession) return;
    const ids = orderedSession
      .filter((q) => q.difficulty === replayTier)
      .map((q) => q.id);
    setPracticedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setFocusTier(replayTier);
    toast.success(
      `${DIFFICULTY_META[replayTier].label} tier reset — replay the toughest questions`
    );
  }, [replayTier, orderedSession]);

  /**
   * Active strip segment: dialog card > practice frontier. The frontier is
   * the ladder marker and stays put even when the user steers Focus to a
   * different tier — the steered tier rides along as a small focus pip so
   * the strip keeps showing where the unpracticed work actually is.
   */
  const stripActiveTier: Difficulty =
    focusOpen && orderedSession && orderedSession[focusIndex]
      ? orderedSession[focusIndex].difficulty
      : frontierTier;

  /** Focus coach note under the phase strip (leading space joins the sentence). */
  const focusNote = !focusOn
    ? null
    : clearance
      ? ` ${DIFFICULTY_META[clearance.announced].phase} tier cleared — focus ${DIFFICULTY_META[clearance.target].phase} when ready.`
      : allCleared
        ? " All tiers cleared — replay the toughest tier when ready."
        : focusTier
          ? ` Focus pinned to ${DIFFICULTY_META[effectiveFocusTier].phase} — unpracticed ${DIFFICULTY_META[effectiveFocusTier].phase.toLowerCase()} questions only.`
          : ` Focus is on — unpracticed ${DIFFICULTY_META[effectiveFocusTier].phase.toLowerCase()} questions only.`;

  /** Clearance CTA visibility: a mid-ladder clearance, or everything done. */
  const clearanceVisible = focusOn && (clearance !== null || allCleared);
  /** CTA copy (advance branch needs clearance; replay branch uses totals). */
  const clearanceHeadline = clearance
    ? `All ${tierStats.get(clearance.announced)?.count ?? 0} ${
        DIFFICULTY_META[clearance.announced].phase
      } questions practiced.`
    : `All ${totalCount} questions practiced.`;
  const clearanceDetail = clearance
    ? `${DIFFICULTY_META[clearance.target].phase} is next — ${
        tierStats.get(clearance.target)?.unpracticed ?? 0
      } unpracticed queued.`
    : "Replay resets the toughest tier for another pass.";
  const clearanceCta = clearance
    ? `${DIFFICULTY_META[clearance.announced].phase} cleared — focus ${DIFFICULTY_META[clearance.target].phase}`
    : `All tiers cleared — replay ${DIFFICULTY_META[replayTier ?? "hard"].label}`;

  /** Grid item variants: stagger entrance + focus-filter exit animation. */
  const gridItemVariants = React.useMemo<Variants>(
    () => ({
      ...staggerItem,
      exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: reducedMotion ? 0 : 0.18, ease: "easeIn" },
      },
    }),
    [reducedMotion]
  );

  /* ============================== Not hydrated yet ============================== */

  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-busy="true">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[350px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ============================== Render ============================== */

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      {/* ============ Header ============ */}
      <ToolPageHeader
        icon={MessagesSquare}
        title="Interview Prep"
        description="AI-simulated interview training tailored to your resume. Practice with flashcards, study the STAR model answers, and walk in ready."
        actions={
          <>
            <ResumeSelect
              value={resume?.id ?? ""}
              onValueChange={setActive}
              ariaLabel="Resume to tailor questions from"
              className="w-full sm:w-60"
            />
            <DifficultySegmentedControl value={difficulty} onChange={setDifficulty} />
          </>
        }
      />

      {/* ============ Setup card ============ */}
      <motion.section variants={staggerItem} aria-label="Session setup">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base">
              Build your question set
            </CardTitle>
            <CardDescription>
              Pick categories — the generator mixes difficulties and prefers
              questions customized from your resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryChips
              selected={selectedCategories}
              onToggle={toggleCategory}
            />

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-violet-500" aria-hidden="true" />
              Sparkle-marked cards reference your most recent role, top skills, and
              projects.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {selectedCategories.length}/5
                </span>{" "}
                categories ·{" "}
                <span className="font-semibold text-foreground">
                  {DIFFICULTY_META[difficulty]?.label ?? "All"}
                </span>{" "}
                difficulty ·{" "}
                <span className="font-semibold text-foreground">
                  {QUESTIONS_PER_SET} questions
                </span>{" "}
                per set
              </p>
              <Button
                onClick={generate}
                disabled={generating || !resume || selectedCategories.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
                aria-label="Generate question set"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="size-4" aria-hidden="true" />
                )}
                {generating ? "Generating…" : "Generate question set"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ============ From your tracker ============ */}
      <motion.section variants={staggerItem} aria-labelledby="tracker-sets-heading">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <Building2 className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                    From your tracker
                  </p>
                  <CardTitle className="font-display text-base" id="tracker-sets-heading">
                    Company-specific question sets
                  </CardTitle>
                </div>
              </div>
              {favorites.length > 0 ? (
                <FavFilterToggle
                  value={favFilter}
                  onChange={setFavFilter}
                  starredCount={favorites.length}
                />
              ) : null}
            </div>
            <CardDescription className="mt-1">
              Sets built from the companies and roles you are actually pursuing — pick one to
              start practicing. Star the ones you care about to keep them on top.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companySets.length === 0 ? (
              <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
                  >
                    <Briefcase className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">No tracked applications yet</p>
                    <p className="text-xs text-muted-foreground">
                      Track your first application to unlock company sets.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/tracker">
                    Go to Job Tracker
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-2.5"
                role="group"
                aria-label="Companies from your tracker"
              >
                {visibleCompanySets.map((c) => {
                  const active =
                    sessionOrigin?.kind === "company" &&
                    sessionOrigin.company.trim().toLowerCase() === c.key;
                  const isFavorite = favorites.includes(c.key);
                  return (
                    <motion.div
                      key={c.key}
                      variants={staggerItem}
                      layout
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full border py-1 pl-1.5 pr-1 transition-all duration-200",
                          "hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10",
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/40"
                            : "border-border bg-background"
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`Practice the ${c.company} interview set`}
                          onClick={() => startCompanySession(c)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-2 text-left transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          )}
                        >
                          <CompanyAvatar company={c.company} />
                          <span className="flex flex-col leading-tight">
                            <span className="text-sm font-semibold">{c.company}</span>
                            <span className="text-[10.5px] text-muted-foreground">
                              {c.count} {c.count === 1 ? "application" : "applications"} · {c.role}
                            </span>
                          </span>
                          <StageBadge stage={c.stage} />
                        </button>
                        <StarToggle
                          active={isFavorite}
                          companyName={c.company}
                          onToggle={() => toggleFavorite(c.company)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ============ Generating skeleton ============ */}
      {generating ? (
        <motion.div
          variants={staggerItem}
          aria-busy="true"
          aria-label="Generating questions"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: QUESTIONS_PER_SET }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
          <p aria-live="polite" className="sr-only">
            Generating your question set…
          </p>
        </motion.div>
      ) : orderedSession && orderedSession.length > 0 ? (
        <>
          {/* ============ Company set header ============ */}
          {sessionOrigin?.kind === "company" ? (
            <motion.section
              key={`cset-${sessionOrigin.company}-${companyVariant}`}
              variants={staggerItem}
              initial="hidden"
              animate="show"
              aria-label={`${sessionOrigin.company} interview set`}
              className="rounded-2xl border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <CompanyAvatar company={sessionOrigin.company} className="size-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold">
                      {sessionOrigin.company} interview set
                    </h2>
                    <StageBadge stage={sessionOrigin.stage} />
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      {orderedSession.length} questions
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sessionOrigin.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <StarToggle
                    active={favorites.includes(favoriteKey(sessionOrigin.company))}
                    companyName={sessionOrigin.company}
                    onToggle={() => toggleFavorite(sessionOrigin.company)}
                    size="size-8"
                    iconSize="size-4"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reshuffleCompany}
                    disabled={generating}
                    title="Reshuffles the behavioral picks"
                    aria-label="Shuffle again — reshuffles the behavioral picks"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {generating ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Shuffle className="size-3.5" aria-hidden="true" />
                    )}
                    Shuffle again
                  </Button>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                <Compass className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Coach:</span> {STAGE_HINT[sessionOrigin.stage]}
                </span>
              </p>
            </motion.section>
          ) : null}

          {/* ============ Practice controls bar ============ */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-sm font-semibold tabular-nums">
                {practicedCount}/{totalCount} practiced
              </span>
              <div
                className="h-2 w-36 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Session progress"
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                />
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Flipping a card marks it practiced
                {tailoredCount > 0 ? ` · ${tailoredCount} tailored to you` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FocusToggle
                on={focusOn}
                onToggle={toggleFocus}
                disabled={generating}
              />
              {sessionOrigin?.kind !== "company" ? (
                <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
                  <Shuffle className="size-3.5" aria-hidden="true" />
                  Shuffle again
                </Button>
              ) : null}
              <Button
                ref={focusTriggerRef}
                variant="outline"
                size="sm"
                onClick={() => openFocus(0)}
                disabled={generating}
              >
                <Focus className="size-3.5" aria-hidden="true" />
                Focus Mode
              </Button>
            </div>
          </motion.div>

          {/* ============ Difficulty ladder phase strip ============ */}
          {orderedSession && orderedSession.length > 0 ? (
            <PhaseStrip
              questions={orderedSession}
              practicedIds={practicedIds}
              activeTier={stripActiveTier}
              focusActive={focusOn}
              focusTier={focusOn ? effectiveFocusTier : null}
              steeredTier={focusOn ? focusTier : null}
              focusNote={focusNote}
            />
          ) : null}

          {/* ===== Focus Mode: tier-clearance CTA (UI-local, never persisted) =====
              Fires mid-ladder: in auto mode it announces the just-cleared tier
              while the filter has already queued the next one; once steered it
              gates the emptied pinned tier until the user advances. Replay
              covers the everything-practiced case. */}
          {clearanceVisible ? (
            <motion.div
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 260, damping: 32 }
              }
              className="overflow-hidden"
              aria-live="polite"
              data-clearance="true"
              data-clearance-tier={clearance ? clearance.announced : replayTier ?? ""}
              data-clearance-steered={focusTier ? "true" : "false"}
            >
              <div className="flex flex-col gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-400/25 dark:bg-emerald-400/5">
                <p className="flex items-start gap-2.5 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="size-3" />
                  </span>
                  <span>
                    <span className="font-semibold">{clearanceHeadline}</span>{" "}
                    {clearanceDetail}
                  </span>
                </p>
                <Button
                  size="sm"
                  onClick={clearance ? advanceFocusTier : replayFinalTier}
                  data-clearance-cta="true"
                  data-clearance-target={clearance ? clearance.target : replayTier ?? ""}
                  className="w-full shrink-0 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
                >
                  {clearanceCta}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          ) : null}

          {/* ===== Focus Mode: quiet practiced-hidden row ===== */}
          {focusOn && hiddenPracticedCount > 0 ? (
            <div
              data-focus-hidden-line="true"
              data-hidden-count={hiddenPracticedCount}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
            >
              <EyeOff className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-semibold tabular-nums">
                  {hiddenPracticedCount}
                </span>{" "}
                practiced hidden
              </span>
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                ·
              </span>
              <button
                type="button"
                onClick={toggleFocus}
                data-show-all="true"
                className="rounded font-semibold text-zinc-700 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                show all
              </button>
            </div>
          ) : null}

          {/* ============ Flashcards grid ============ */}
          <motion.div
            key={generation}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 pt-1 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Question flashcards"
          >
            {/*
              AnimatePresence + layout: cards animate in and out as the
              ladder-aware Focus Mode filter changes the visible set. Exit and
              layout motion collapse to duration 0 under reduced motion.
            */}
            <AnimatePresence>
              {visibleEntries.map(({ q, index }) => (
                <motion.div
                  key={q.id}
                  variants={gridItemVariants}
                  layout={!reducedMotion}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  className="relative h-full"
                >
                  <Flashcard
                    q={q}
                    index={index}
                    practiced={practicedIds.has(q.id)}
                    onPracticed={markPracticed}
                    className="h-full"
                  />
                  {/** Tier badge — tiny uppercase pill straddling the card's top edge. */}
                  <span
                    data-difficulty={q.difficulty}
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute right-4 top-0 z-10 inline-flex -translate-y-1/2 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm",
                      DIFFICULTY_META[q.difficulty].badge
                    )}
                  >
                    {DIFFICULTY_META[q.difficulty].label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      ) : (
        /* ============ Empty state ============ */
        <motion.section
          variants={staggerItem}
          aria-label="No questions yet"
          className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-16 text-center"
        >
          <div className="relative" aria-hidden="true">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <GraduationCap className="size-8" />
            </div>
            <span className="absolute -right-3 -top-2 flex size-7 items-center justify-center rounded-full border bg-background text-amber-500 shadow-sm">
              <Brain className="size-3.5" />
            </span>
            <span className="absolute -bottom-2 -left-4 flex size-7 items-center justify-center rounded-full border bg-background text-violet-500 shadow-sm">
              <ListChecks className="size-3.5" />
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-semibold">
              Your question set appears here
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              Choose your categories above, then generate a set of{" "}
              {QUESTIONS_PER_SET} flashcards with STAR model answers tailored to
              your experience.
            </p>
            {resume ? (
              <p className="text-xs text-muted-foreground">
                Generating from{" "}
                <span className="font-medium text-foreground">{resume.title}</span>
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3 text-violet-500" aria-hidden="true" />
            No two sessions are the same
          </Badge>
        </motion.section>
      )}

      {/* ============ Tips panel ============ */}
      <TipsPanel />

      {/* ============ Focus mode ============ */}
      {orderedSession ? (
        <FocusMode
          open={focusOpen}
          onOpenChange={(next) => {
            setFocusOpen(next);
            if (!next) {
              /* Deferred so Radix's own cleanup (which drops focus to <body>)
                 runs first — then hand focus back to the trigger. */
              window.setTimeout(() => focusTriggerRef.current?.focus(), 0);
            }
          }}
          questions={orderedSession}
          index={focusIndex}
          onIndexChange={setFocusIndex}
          practicedIds={practicedIds}
          onPracticed={markPracticed}
          notes={starNotes}
          onNotesChange={handleNotesChange}
        />
      ) : null}
    </motion.div>
  );
}
