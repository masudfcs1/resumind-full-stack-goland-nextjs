"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  Info,
  Lightbulb,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useResumeStore, type ScoreEntry } from "@/lib/resume-store";
import { atsAnalyze, sleep, type AtsResult } from "@/lib/mock-ai";
import {
  deltaAriaLabel,
  deltaInsight,
  deltaKind,
  formatDelta,
  lastScoreEntryFor,
  type DeltaKind,
} from "@/lib/ats-delta";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

import { AnimatedProgress, ScoreGauge } from "@/components/tools/score-gauge";
import {
  CategoryDeltaChips,
  normalizeBreakdownCategories,
} from "@/components/tools/category-delta-chips";
import { ResumeSelect } from "@/components/tools/resume-select";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { staggerContainer, staggerItem } from "@/components/tools/variants";

/* ============================== Sample JD ============================== */

const SAMPLE_JD = `Senior Frontend Engineer — Lumen Labs (Remote, full-time)

About the role
We are building a design-tools platform used by 40,000+ product teams, and we are looking for a Senior Frontend Engineer to own large parts of our web application. You will partner closely with product and design to ship polished, accessible, fast experiences.

What you will do
- Build responsive, accessible interfaces with React, TypeScript, and Next.js
- Grow and maintain our design system and component library (Storybook)
- Integrate REST and GraphQL APIs; obsess over Core Web Vitals and performance
- Write unit and integration tests with Jest and Testing Library; improve our CI/CD pipeline
- Mentor engineers, lead code reviews, and help run Agile rituals

What we look for
- 5+ years of frontend experience with React and modern JavaScript
- Strong CSS fundamentals; experience with Tailwind CSS and responsive design
- Comfortable with state management (Redux), data fetching, caching, and WebSockets
- Experience with accessibility (WCAG), SEO, and cross-browser support
- Bonus: Node.js, Docker, AWS, analytics, and design-systems experience`;

/* ============================== Guided demo flow ============================== */

/* Landing hero demo → /dashboard/ats?flow=demo&keywords=&impact=&clarity=
   Weights mirror hero-score-demo.tsx (0.4/0.35/0.25 composite). */
type DemoFlowValues = { keywords: number; impact: number; clarity: number };
const DEMO_WEIGHTS = { keywords: 0.4, impact: 0.35, clarity: 0.25 } as const;
const DEMO_DEFAULTS: DemoFlowValues = { keywords: 62, impact: 48, clarity: 70 };

/* Once dismissed, the flow banner stays dismissed for the whole browser
   session (even when the hero demo is used again) — sessionStorage, written
   only from event/effect code, never during render. */
const DEMO_FLOW_DISMISSED_KEY = "resumeforge.demoFlowDismissed";

function parseDemoFlowParams(params: URLSearchParams): DemoFlowValues {
  const num = (key: string, fallback: number) => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "") return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  return {
    keywords: num("keywords", DEMO_DEFAULTS.keywords),
    impact: num("impact", DEMO_DEFAULTS.impact),
    clarity: num("clarity", DEMO_DEFAULTS.clarity),
  };
}

/* ============================== Severity meta ============================== */

const SEVERITY_ORDER = ["critical", "warning", "info", "good"] as const;
type Severity = (typeof SEVERITY_ORDER)[number];

/* ============================== Delta chip meta ============================== */

const DELTA_CHIP_CLASS: Record<DeltaKind, string> = {
  up: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  down: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400",
  flat: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
};

function DeltaChipIcon({ kind }: { kind: DeltaKind }) {
  const Icon =
    kind === "up" ? TrendingUp : kind === "down" ? TrendingDown : Minus;
  return <Icon className="size-3.5" aria-hidden="true" />;
}

const SEVERITY_META: Record<
  Severity,
  { label: string; icon: LucideIcon; chipClass: string }
> = {
  critical: {
    label: "Critical fixes",
    icon: AlertTriangle,
    chipClass:
      "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  },
  warning: {
    label: "Warnings",
    icon: AlertTriangle,
    chipClass:
      "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  },
  info: {
    label: "Good to know",
    icon: Info,
    chipClass:
      "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
  },
  good: {
    label: "Strengths",
    icon: CheckCircle2,
    chipClass:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  },
};

/* ============================== Suspense fallback ============================== */

function AtsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <span className="sr-only">Loading ATS scanner…</span>
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="hidden items-center gap-3 sm:flex" aria-hidden="true">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-[68px] w-full rounded-xl" />
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
    </div>
  );
}

/* ============================== Page ============================== */

export default function AtsPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <React.Suspense fallback={<AtsSkeleton />}>
      <AtsScanner />
    </React.Suspense>
  );
}

function AtsScanner() {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumes = useResumeStore((s) => s.resumes);
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const logScore = useResumeStore((s) => s.logScore);

  const resume =
    resumes.find((r) => r.id === activeResumeId) ?? resumes[0];

  const [jd, setJd] = React.useState("");
  const [jdOpen, setJdOpen] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [result, setResult] = React.useState<AtsResult | null>(null);
  const [scanId, setScanId] = React.useState(0);
  /** Last history entry that existed BEFORE the live scan (the "old" side). */
  const [baseline, setBaseline] = React.useState<ScoreEntry | null>(null);

  /* --- Guided demo flow (?flow=demo from the landing hero demo) --- */

  const jdTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  /** Slider values carried over from the hero demo (null = no banner). Set
   *  post-mount from window.location, so SSR renders identical DOM. */
  const [demoFlow, setDemoFlow] = React.useState<DemoFlowValues | null>(null);

  const usedJobDescription = jd.trim().length > 40;

  /* --- Shareable ?resume=<id> param --- */

  const paramResumeId = searchParams.get("resume");

  // URL → store: a valid ?resume= preselects that resume (falls back to the
  // store's active resume, then the first resume, when missing/invalid).
  React.useEffect(() => {
    if (!mounted) return;
    // window.location fallback: on a fresh load the router's searchParams
    // (hook) settle a beat later than the address bar — without this, a
    // deep link would be missed entirely.
    const urlId =
      paramResumeId ?? new URLSearchParams(window.location.search).get("resume");
    if (!urlId) return;
    if (!resumes.some((r) => r.id === urlId)) return;
    if (urlId !== activeResumeId) setActive(urlId);
  }, [mounted, paramResumeId, activeResumeId, resumes, setActive]);

  // Store → URL: keep ?resume= in sync with the selection so any scan state is
  // shareable (replace — the back button stays clean). Also heals an invalid
  // or missing param to the resume actually shown.
  React.useEffect(() => {
    if (!mounted || !activeResumeId) return;
    const locParams = new URLSearchParams(window.location.search);
    // Router state not ready yet (hook still empty while the address bar
    // carries a ?resume=) — never "heal" a deep link before the hook has had
    // the chance to see it.
    if (searchParams.get("resume") === null && locParams.get("resume")) return;
    if (locParams.get("resume") === activeResumeId) return;
    locParams.set("resume", activeResumeId);
    router.replace(`/dashboard/ats?${locParams.toString()}`, { scroll: false });
  }, [mounted, activeResumeId, router, searchParams]);

  /* --- Guided demo flow: banner state, preselect, JD focus --- */

  // Runs once per arrival with ?flow=demo. Reads the address bar directly
  // (hydration-safe: effects run post-mount, SSR renders nothing extra).
  React.useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("flow") !== "demo") return;

    // Banner: only when not already dismissed this browser session.
    let dismissed = false;
    try {
      dismissed =
        window.sessionStorage.getItem(DEMO_FLOW_DISMISSED_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (!dismissed) setDemoFlow(parseDemoFlowParams(params));

    // Focus/scroll to the job-description textarea: open its collapsible,
    // then focus after Radix has mounted the content.
    setJdOpen(true);
    const timer = window.setTimeout(() => {
      const el = jdTextareaRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [mounted, setActive]);

  // Preselect (flow=demo): if the active pointer is empty or dangling (e.g.
  // the persisted resume was deleted), fall back to the first active
  // (non-archived) resume. Declared AFTER the ?resume= deep-link effect, so
  // an explicit valid ?resume= always wins. Re-checks on store changes, so
  // it also heals after the post-hydration rehydrate (skipHydration).
  React.useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("flow") !== "demo") return;
    if (resumes.some((r) => r.id === activeResumeId)) return;
    const first = resumes.find((r) => !r.archived) ?? resumes[0];
    if (first) setActive(first.id);
  }, [mounted, activeResumeId, resumes, setActive]);

  /* --- Scan state --- */

  const resumeId = resume?.id ?? "";

  // A finished scan always describes the currently selected resume: switching
  // resumes clears the previous result so the delta panel starts fresh.
  React.useEffect(() => {
    if (!mounted) return;
    setResult(null);
    setBaseline(null);
  }, [mounted, resumeId]);

  const handleAnalyze = async () => {
    if (!resume || scanning) return;
    const target = resume;
    setScanning(true);
    try {
      await sleep(1200);
      // Ignore stale completions if the user switched resumes mid-scan.
      if (useResumeStore.getState().activeResumeId !== target.id) return;
      const res = atsAnalyze(target, jd.trim() || undefined);
      // Capture the pre-scan "old" side before this scan is logged.
      setBaseline(
        lastScoreEntryFor(
          useResumeStore.getState().scoreHistory,
          target.id
        )
      );
      setResult(res);
      setScanId((n) => n + 1);
      // Per-category history (0–100 per breakdown label) powers the
      // category-level delta chips on the next "vs last scan" comparison.
      logScore(
        target.id,
        target.title,
        res.score,
        normalizeBreakdownCategories(res.breakdown)
      );
      toast.success(`Scan complete — ATS score ${res.score}/100`, {
        description: "Score logged to your dashboard history.",
      });
    } catch {
      toast.error("Something went wrong while scanning. Try again.");
    } finally {
      setScanning(false);
    }
  };

  /* --- vs last scan (delta) --- */

  // Before any scan: the resume's latest history entry, if one exists.
  const loadBaseline = React.useMemo(
    () =>
      mounted && resume && !result
        ? lastScoreEntryFor(scoreHistory, resume.id)
        : null,
    [mounted, resume, result, scoreHistory]
  );

  const panelEntry = result ? baseline : loadBaseline;
  const showDeltaPanel = Boolean(mounted && resume && panelEntry);
  const deltaDiff = result && panelEntry ? result.score - panelEntry.score : 0;
  const deltaKindValue = deltaKind(deltaDiff);

  // Current side of the per-category comparison (normalized 0–100 per label).
  const currentCategories = result
    ? normalizeBreakdownCategories(result.breakdown)
    : null;

  const dismissDemoFlow = () => {
    setDemoFlow(null);
    try {
      window.sessionStorage.setItem(DEMO_FLOW_DISMISSED_KEY, "1");
    } catch {
      // Private mode / storage disabled: dismissal just lives in state.
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      {/* Guided demo flow banner (?flow=demo from the landing hero demo) */}
      {demoFlow ? (
        <motion.section
          variants={staggerItem}
          aria-label="Continuing from the landing page quick estimate"
          data-demo-banner="visible"
        >
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              <ScanSearch className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Continuing from your quick estimate —{" "}
                <span
                  data-demo-flow-score
                  className="tabular-nums"
                >
                  {Math.round(
                    demoFlow.keywords * DEMO_WEIGHTS.keywords +
                      demoFlow.impact * DEMO_WEIGHTS.impact +
                      demoFlow.clarity * DEMO_WEIGHTS.clarity
                  )}
                </span>
                /100.
              </p>
              <p className="mt-0.5 text-sm leading-snug text-emerald-800/90 dark:text-emerald-300/90">
                A real scan analyzes your actual resume text against a job
                description.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissDemoFlow}
              aria-label="Dismiss the demo estimate banner"
              data-demo-banner-dismiss
              className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-700/70 transition-colors hover:bg-emerald-500/15 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-emerald-300/70 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-100"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </motion.section>
      ) : null}

      <ToolPageHeader
        icon={Target}
        title="ATS Score Scanner"
        description="Run your resume through our simulated applicant tracking system. Get an instant score, a category breakdown, and concrete fixes."
        actions={
          <>
            <ResumeSelect
              value={resume?.id ?? ""}
              onValueChange={setActive}
              ariaLabel="Resume to analyze"
              className="w-full sm:w-64"
            />
            <Button
              onClick={handleAnalyze}
              disabled={scanning || !resume || !mounted}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
              aria-label="Analyze resume with ATS scanner"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch className="size-4" aria-hidden="true" />
              )}
              {scanning ? "Scanning…" : "Analyze"}
            </Button>
          </>
        }
      />

      {/* Job description (optional) */}
      <motion.section variants={staggerItem} aria-label="Job description input">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <Collapsible open={jdOpen} onOpenChange={setJdOpen}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    aria-expanded={jdOpen}
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    Job description{" "}
                    <span className="font-normal">
                      {jd.trim() ? "(added)" : "(optional)"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        jdOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-emerald-500" aria-hidden="true" />
                  Matching against a real job description boosts accuracy
                </p>
              </div>
              <CollapsibleContent className="pt-4">
                <div className="space-y-2">
                  <Textarea
                    ref={jdTextareaRef}
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste the full job description here — responsibilities, requirements, the works…"
                    aria-label="Job description"
                    className="min-h-[140px] resize-y"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setJd(SAMPLE_JD)}
                      className="text-xs font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
                    >
                      Paste sample JD
                    </button>
                    {jd ? (
                      <button
                        type="button"
                        onClick={() => setJd("")}
                        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </motion.section>

      {/* vs last scan (delta panel) */}
      {showDeltaPanel && panelEntry ? (
        <motion.section
          key={result ? `delta-full-${scanId}` : "delta-load"}
          variants={staggerItem}
          aria-label="Comparison with last scan"
          aria-live="polite"
          data-delta={result ? deltaKindValue : "none"}
        >
          <div className="rounded-xl border p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <History className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">vs last scan</p>
                <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                  Last scan{" "}
                  {formatDistanceToNow(new Date(panelEntry.at), {
                    addSuffix: true,
                  })}
                  :{" "}
                  <span className="font-semibold text-foreground">
                    {panelEntry.score}
                  </span>
                  {result ? (
                    <>
                      {" \u2192 "}
                      Now:{" "}
                      <span className="font-semibold text-foreground">
                        {result.score}
                      </span>
                    </>
                  ) : (
                    <span className="font-normal">
                      {" \u00b7 "} run a scan to compare
                    </span>
                  )}
                </p>
              </div>
              {result ? (
                <span
                  data-delta={deltaKindValue}
                  data-delta-value={deltaDiff}
                  aria-label={deltaAriaLabel(deltaDiff)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1",
                    DELTA_CHIP_CLASS[deltaKindValue]
                  )}
                >
                  <DeltaChipIcon kind={deltaKindValue} />
                  {deltaKindValue === "flat" ? "No change" : formatDelta(deltaDiff)}
                </span>
              ) : null}
            </div>
            {/* Per-category deltas between the last two entries — only when
                both sides carry category history (older entries have none). */}
            {result && panelEntry.categories && currentCategories ? (
              <CategoryDeltaChips
                previous={panelEntry.categories}
                current={currentCategories}
              />
            ) : null}
            {result && deltaInsight(result.breakdown) ? (
              <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                <Sparkles
                  className="size-3.5 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                {deltaInsight(result.breakdown)}
              </p>
            ) : null}
          </div>
        </motion.section>
      ) : null}

      {/* Scanning animation */}
      {scanning ? (
        <motion.section
          variants={staggerItem}
          aria-busy="true"
          aria-label="Scanning resume"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <p className="flex items-center justify-center gap-2 text-sm font-medium" role="status">
                <Loader2 className="size-4 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Scanning resume
                <span className="animate-pulse" aria-hidden="true">…</span>
              </p>
              <div className="relative mx-auto mt-6 max-w-sm" aria-hidden="true">
                <div className="rounded-lg border bg-background p-5 shadow-sm">
                  <div className="mx-auto mb-4 h-3 w-28 rounded bg-muted" />
                  <div className="space-y-2">
                    {[92, 100, 78, 96, 64, 88, 72, 40].map((w, i) => (
                      <div
                        key={i}
                        className="h-2 rounded bg-muted"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-5 h-2 w-20 rounded bg-emerald-500/40" />
                </div>
                <motion.div
                  className="pointer-events-none absolute inset-x-0 h-14 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent"
                  initial={{ top: "-18%" }}
                  animate={{ top: "112%" }}
                  transition={{
                    duration: 1.05,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      ) : !result ? (
        /* Empty state before first scan */
        <motion.section variants={staggerItem} aria-label="Start a scan">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
            <div
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              <ScanSearch className="size-7" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">
              Run your first scan
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Pick a resume above and hit Analyze — optionally paste a job
              description first for keyword-level matching.
            </p>
          </div>
        </motion.section>
      ) : null}

      {/* Results */}
      {result ? (
        <motion.section
          key={scanId}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          aria-label="ATS scan results"
          aria-live="polite"
          className="space-y-6"
        >
          {/* Score + breakdown */}
          <div className="grid gap-6 lg:grid-cols-5">
            <motion.div variants={staggerItem} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="font-display">Your ATS score</CardTitle>
                  <CardDescription>
                    {usedJobDescription
                      ? "Matched against the pasted job description"
                      : "Matched against typical role keywords"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <ScoreGauge score={result.score} grade={result.grade} />
                  <Badge variant="secondary" className="gap-1.5">
                    <FileText className="size-3" aria-hidden="true" />
                    {result.wordCount} words scanned
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={scanning}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Scan again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="font-display">Score breakdown</CardTitle>
                  <CardDescription>
                    Where the points come from — and where they leak.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {result.breakdown.map((b, i) => {
                    const ratio = b.max > 0 ? b.score / b.max : 0;
                    const barClass =
                      ratio >= 0.75
                        ? undefined
                        : ratio >= 0.5
                          ? "bg-teal-500/80"
                          : "bg-amber-500/80";
                    return (
                      <div key={b.label}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-medium">{b.label}</span>
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {b.score}/{b.max}
                          </span>
                        </div>
                        <AnimatedProgress
                          value={b.score}
                          max={b.max}
                          delay={0.2 + i * 0.12}
                          className="mt-2"
                          barClassName={barClass}
                        />
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {b.hint}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Keywords + Issues */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={staggerItem}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="font-display">Keyword coverage</CardTitle>
                  <CardDescription>
                    Terms recruiters and bots scan for first.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <Check className="size-3.5" aria-hidden="true" />
                      Matched ({result.matchedKeywords.length})
                    </p>
                    <ul
                      className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 scrollbar-thin"
                      aria-label="Matched keywords"
                    >
                      {result.matchedKeywords.map((kw) => (
                        <li
                          key={kw}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          <Check className="size-3" aria-hidden="true" />
                          {kw}
                        </li>
                      ))}
                      {result.matchedKeywords.length === 0 ? (
                        <li className="text-xs text-muted-foreground">
                          None matched yet.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <Plus className="size-3.5" aria-hidden="true" />
                      Missing ({result.missingKeywords.length})
                    </p>
                    <ul
                      className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 scrollbar-thin"
                      aria-label="Missing keywords"
                    >
                      {result.missingKeywords.map((kw) => (
                        <li
                          key={kw}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                        >
                          <Plus className="size-3" aria-hidden="true" />
                          {kw}
                        </li>
                      ))}
                      {result.missingKeywords.length === 0 ? (
                        <li className="text-xs text-muted-foreground">
                          Nothing missing — great coverage.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="font-display">Findings</CardTitle>
                  <CardDescription>
                    Grouped by severity, highest impact first.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1 scrollbar-thin">
                    {SEVERITY_ORDER.map((sev) => {
                      const items = result.issues.filter((i) => i.severity === sev);
                      if (items.length === 0) return null;
                      const meta = SEVERITY_META[sev];
                      const MetaIcon = meta.icon;
                      return (
                        <div key={sev}>
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <MetaIcon className="size-3.5" aria-hidden="true" />
                            {meta.label} ({items.length})
                          </p>
                          <ul className="space-y-3">
                            {items.map((issue) => (
                              <li
                                key={issue.id}
                                className="flex gap-3 rounded-lg border p-3"
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
                                    meta.chipClass
                                  )}
                                >
                                  <MetaIcon className="size-3.5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-snug">
                                    {issue.title}
                                  </p>
                                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                    {issue.detail}
                                  </p>
                                  {issue.fix ? (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs italic text-amber-700 dark:text-amber-400">
                                      <Lightbulb
                                        className="mt-0.5 size-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      {issue.fix}
                                    </p>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CTA banner */}
          <motion.section
            variants={staggerItem}
            className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 sm:p-6"
          >
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 size-40 rounded-full bg-emerald-500/10 blur-2xl"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Ready to level up your score?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Work through the fixes above in Resume Studio, then rescan to
                  watch your score climb.
                </p>
              </div>
              <Button
                asChild
                className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
              >
                <Link href="/dashboard/builder">
                  Fix issues in Resume Studio
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </motion.section>
        </motion.section>
      ) : null}
    </motion.div>
  );
}
