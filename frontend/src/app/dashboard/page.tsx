"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Mail,
  Plus,
  Rocket,
  Target,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ResumeData } from "@/lib/resume-store";
import { useActiveResume, useResumeStore } from "@/lib/resume-store";
import { atsAnalyze } from "@/lib/mock-ai";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeBanner } from "@/components/dashboard/overview-welcome";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentResumesCard } from "@/components/dashboard/overview-recent";
import { WeeklyActivityCard } from "@/components/dashboard/overview-activity";
import { QuickActionsCard } from "@/components/dashboard/overview-quick-actions";
import { ChecklistCard, type ChecklistItem } from "@/components/dashboard/overview-checklist";
import { ProTipCard } from "@/components/dashboard/overview-tips";
import { ScoreTrendCard } from "@/components/dashboard/score-trend";

/* ------------------------------------------------------------------ */
/* Plan welcome banner (?plan=pro|lifetime deep links from the landing  */
/* pricing funnel)                                                      */
/* ------------------------------------------------------------------ */

type PlanWelcome = "pro" | "lifetime";

const PLAN_WELCOME_DISMISS_KEY = "rf-plan-welcome-dismissed";

const PLAN_WELCOME_COPY: Record<
  PlanWelcome,
  { message: string; quickLink: { label: string; href: string } }
> = {
  pro: {
    message: "Welcome, Pro member — your workspace is ready.",
    quickLink: { label: "Run your first ATS scan", href: "/dashboard/ats" },
  },
  lifetime: {
    message: "Welcome, Lifetime member — everything's unlocked, forever.",
    quickLink: { label: "Build a resume", href: "/dashboard/builder" },
  },
};

function PlanWelcomeBanner({
  plan,
  onDismiss,
}: {
  plan: PlanWelcome;
  onDismiss: () => void;
}) {
  const copy = PLAN_WELCOME_COPY[plan];
  return (
    <section
      aria-label={plan === "pro" ? "Pro plan welcome" : "Lifetime plan welcome"}
      data-plan-banner={plan}
      className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      >
        <CheckCircle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          {copy.message}
        </p>
        <div className="mt-3">
          <Link
            href={copy.quickLink.href}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.quickLink.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss the plan welcome banner"
        data-plan-banner-dismiss
        className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-emerald-700/70 transition-colors hover:bg-emerald-500/15 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-emerald-300/70 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-100"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function profileStrength(resume: ResumeData): number {
  const checks: boolean[] = [
    Boolean(resume.personal.fullName),
    Boolean(resume.personal.jobTitle),
    Boolean(resume.personal.email),
    Boolean(resume.personal.phone),
    Boolean(resume.personal.location),
    Boolean(resume.summary.trim()),
    resume.experience.length > 0,
    resume.education.length > 0,
    resume.skills.length >= 3,
    resume.projects.length > 0,
    resume.certifications.length > 0,
    resume.languages.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* Fixed plausible sparkline series */
const SPARK_RESUMES = [1, 2, 2, 3, 3, 4, 5];
const SPARK_ATS = [58, 62, 66, 71, 74, 79, 84];
const SPARK_COVERS = [0, 0, 1, 1, 2, 2, 2];
const SPARK_STRENGTH = [40, 48, 55, 60, 68, 75, 82];

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-[168px] rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-xl" />
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[240px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[170px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyStateCard({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-label="Create your first resume"
      className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-10 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
        <Rocket className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight">
          Create your first resume
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Start from a template and let the AI help you write summaries, bullets and cover letters
          in minutes.
        </p>
      </div>
      <Button
        onClick={onCreate}
        className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> New resume
      </Button>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardOverviewPage() {
  const mounted = useMounted();
  const router = useRouter();
  const resumes = useResumeStore((s) => s.resumes);
  const coverLetterCount = useResumeStore((s) => s.coverLetterCount);
  const createResume = useResumeStore((s) => s.createResume);
  const active = useActiveResume();

  const bestAts = React.useMemo(() => {
    if (resumes.length === 0) return 0;
    return Math.max(...resumes.map((r) => atsAnalyze(r).score));
  }, [resumes]);

  // Plan deep link (?plan=pro|lifetime from the landing pricing funnel).
  // Read in an effect so SSR and the first client render agree (hydration-safe);
  // unknown plan params are ignored silently.
  const [planWelcome, setPlanWelcome] = React.useState<PlanWelcome | null>(null);
  const [planBannerDismissed, setPlanBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("plan");
    if (raw !== "pro" && raw !== "lifetime") return;
    setPlanWelcome(raw);
    try {
      if (window.sessionStorage.getItem(`${PLAN_WELCOME_DISMISS_KEY}-${raw}`) === "1") {
        setPlanBannerDismissed(true);
      }
    } catch {
      // Private mode / storage disabled: banner simply shows again this session.
    }
  }, []);

  const dismissPlanBanner = () => {
    setPlanBannerDismissed(true);
    if (!planWelcome) return;
    try {
      window.sessionStorage.setItem(`${PLAN_WELCOME_DISMISS_KEY}-${planWelcome}`, "1");
    } catch {
      // Storage unavailable: dismissal lives in state for this view only.
    }
  };

  if (!mounted) {
    return <OverviewSkeleton />;
  }

  const hour = new Date().getHours();
  const firstName = active?.personal.fullName.trim().split(/\s+/)[0] || "there";
  const strength = active ? profileStrength(active) : 0;
  const isEmpty = resumes.length === 0;

  const checklist: ChecklistItem[] = [
    {
      label: "Add a professional summary",
      done: Boolean(active?.summary.trim()),
      icon: FileText,
    },
    {
      label: "List 3+ skills",
      done: (active?.skills.length ?? 0) >= 3,
      icon: UserCheck,
    },
    {
      label: "Run an ATS scan",
      done: false,
      href: "/dashboard/ats",
      icon: Target,
    },
    {
      label: "Export your PDF",
      done: false,
      href: "/dashboard/builder",
      icon: Rocket,
    },
  ];

  const handleCreate = () => {
    createResume();
    toast.success("Resume created", { description: "Opening the Resume Studio…" });
    router.push("/dashboard/builder");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {planWelcome && !planBannerDismissed && (
        <PlanWelcomeBanner plan={planWelcome} onDismiss={dismissPlanBanner} />
      )}

      <WelcomeBanner
        greeting={greetingForHour(hour)}
        name={firstName}
        subtitle="Your job search is looking great — keep the momentum."
        streak={5}
      />

      {/* Stats */}
      <section aria-label="Key stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Resumes"
          value={resumes.length}
          delta="+2 this week"
          spark={SPARK_RESUMES}
          tone="emerald"
          delay={0}
        />
        <StatCard
          icon={Target}
          label="Best ATS score"
          value={bestAts > 0 ? bestAts : "—"}
          delta={bestAts > 0 ? "+6 pts" : undefined}
          deltaTone={bestAts > 0 ? "up" : "flat"}
          spark={SPARK_ATS}
          tone="teal"
          delay={0.06}
        />
        <StatCard
          icon={Mail}
          label="Cover letters"
          value={coverLetterCount}
          delta="+1 new"
          spark={SPARK_COVERS}
          tone="amber"
          delay={0.12}
        />
        <StatCard
          icon={UserCheck}
          label="Profile strength"
          value={`${strength}%`}
          delta="+12%"
          spark={SPARK_STRENGTH}
          tone="violet"
          delay={0.18}
        />
      </section>

      {isEmpty && <EmptyStateCard onCreate={handleCreate} />}

      {/* Main grid */}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <RecentResumesCard resumes={resumes} />
          <WeeklyActivityCard />
        </div>

        <div className="space-y-6">
          <ScoreTrendCard />
          <QuickActionsCard />
          <ChecklistCard items={checklist} />
          <ProTipCard />
        </div>
      </div>
    </div>
  );
}
