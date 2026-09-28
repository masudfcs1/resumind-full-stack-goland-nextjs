"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import { toast } from "sonner";

import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { staggerContainer, staggerItem } from "@/components/tools/variants";
import { atsAnalyze, sleep, type AtsResult } from "@/lib/mock-ai";
import { type ResumeData, uid, useResumeStore } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";

import {
  hashJd,
  jdBrief,
  loadMatchHistory,
  saveMatchHistory,
  upsertMatchHistory,
  type MatchHistoryEntry,
} from "./history";
import { MatchHistory } from "./match-history";
import { MatchInput } from "./match-input";
import { MatchResults } from "./match-results";
import { SAMPLE_JDS } from "./sample-jds";
import { keywordLabel } from "./suggest";

/* ============================== Empty state ============================== */

const STEPS = [
  {
    title: "Paste the job description",
    detail: "Responsibilities, requirements, the works.",
  },
  {
    title: "Pick a resume",
    detail: "Whichever version you would send their way.",
  },
  {
    title: "Hit Analyze match",
    detail: "Score, keywords, and fixes in seconds.",
  },
];

function MatchEmptyState() {
  return (
    <motion.section variants={staggerItem} aria-label="Start a match analysis">
      <div className="flex flex-col items-center rounded-xl border border-dashed p-8 text-center sm:p-10">
        <div
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <Crosshair className="size-7" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">
          See how well your resume answers the job post
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Three short steps between you and a verdict.
        </p>
        <ol className="mt-6 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-lg border bg-card p-4 text-left">
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 font-display text-xs font-bold text-emerald-700 dark:text-emerald-400"
              >
                {i + 1}
              </span>
              <p className="mt-2 text-sm font-medium leading-snug">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
}

/* ============================== MatchBoard ============================== */

interface Analysis {
  result: AtsResult;
  resume: ResumeData;
  resumeId: string;
  jdHash: string;
}

export function MatchBoard() {
  const router = useRouter();
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const updateResume = useResumeStore((s) => s.updateResume);

  const [jd, setJd] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [runId, setRunId] = React.useState(0);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [history, setHistory] = React.useState<MatchHistoryEntry[]>([]);
  const [sampleIdx, setSampleIdx] = React.useState(0);

  const resume = resumes.find((r) => r.id === activeResumeId) ?? resumes[0];

  // Load persisted history once mounted (hydration-safe).
  React.useEffect(() => {
    if (mounted) setHistory(loadMatchHistory());
  }, [mounted]);

  const trimmedJd = jd.trim();
  const canAnalyze = !!resume && trimmedJd.length > 40;

  const runAnalysis = React.useCallback(
    (target: ResumeData, text: string) => {
      const result = atsAnalyze(target, text);
      const jdHash = hashJd(text);
      setAnalysis({ result, resume: target, resumeId: target.id, jdHash });
      setRunId((n) => n + 1);
      return { result, jdHash };
    },
    []
  );

  const handleAnalyze = async () => {
    if (!resume || analyzing || !canAnalyze) return;
    const target = resume;
    const text = trimmedJd;
    setAnalyzing(true);
    try {
      await sleep(900); // simulated processing
      const { result, jdHash } = runAnalysis(target, text);
      const entry: MatchHistoryEntry = {
        id: `${target.id}-${jdHash}`,
        resumeId: target.id,
        resumeTitle: target.title,
        jdBrief: jdBrief(text),
        jd: text,
        score: result.score,
        at: Date.now(),
      };
      setHistory((prev) => {
        const next = upsertMatchHistory(prev, entry);
        saveMatchHistory(next);
        return next;
      });
      toast.success(`Match analyzed — ${result.score}/100`, {
        description: "Saved to your recent matches.",
      });
    } catch {
      toast.error("Something went wrong while analyzing. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRestore = (entry: MatchHistoryEntry) => {
    const target = resumes.find((r) => r.id === entry.resumeId);
    if (!target) {
      toast.error("That resume no longer exists.");
      return;
    }
    setActive(entry.resumeId);
    setJd(entry.jd);
    runAnalysis(target, entry.jd); // instant — no simulated sleep on restore
    toast.success("Recent match restored", {
      description: `${entry.resumeTitle} · score ${entry.score}/100`,
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveMatchHistory([]);
    toast.success("Recent matches cleared");
  };

  const handleSample = () => {
    const sample = SAMPLE_JDS[sampleIdx % SAMPLE_JDS.length];
    setSampleIdx((i) => i + 1);
    setJd(sample.text);
    toast.success("Sample job description loaded", {
      description: sample.label,
    });
  };

  const handleAddSkill = (keyword: string) => {
    if (!resume) return;
    const label = keywordLabel(keyword);
    const exists = resume.skills.some(
      (s) => s.name.toLowerCase() === keyword.toLowerCase()
    );
    if (exists) {
      toast.info(`${label} is already in your skills`);
      return;
    }
    const nextResume = {
      ...resume,
      skills: [...resume.skills, { id: uid(), name: label, level: 3 }],
    };
    updateResume(resume.id, { skills: nextResume.skills });
    // Re-analyze instantly (no sleep, no animation replay) so the score
    // reflects the added skill and the keyword flips to "matched".
    if (trimmedJd.length > 40) {
      const result = atsAnalyze(nextResume, trimmedJd);
      setAnalysis((prev) =>
        prev
          ? { ...prev, result, resume: nextResume }
          : prev
      );
    }
    toast.success(`${label} added to skills`, {
      description: "Match re-analyzed with the new skill.",
    });
  };

  const handleOpenStudio = () => {
    if (!analysis) return;
    setActive(analysis.resumeId);
    router.push("/dashboard/builder");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      <ToolPageHeader
        icon={Crosshair}
        title="Job Match Scanner"
        description="Paste a job description, pick a resume, and get an instant verdict — keyword coverage, tailoring suggestions, and a category breakdown."
      />

      <motion.section variants={staggerItem} aria-label="Match input">
        <MatchInput
          jd={jd}
          onJdChange={setJd}
          analyzing={analyzing}
          resumeId={resume?.id ?? ""}
          onResumeChange={setActive}
          hasResume={!!resume}
          canAnalyze={canAnalyze}
          onAnalyze={handleAnalyze}
          onSample={handleSample}
        />
      </motion.section>

      <MatchHistory
        entries={history}
        onRestore={handleRestore}
        onClear={handleClearHistory}
      />

      {analysis ? (
        <MatchResults
          key={`${analysis.resumeId}-${analysis.jdHash}-${runId}`}
          result={analysis.result}
          resume={analysis.resume}
          resumeTitle={analysis.resume.title}
          analyzing={analyzing}
          onAddSkill={handleAddSkill}
          onOpenStudio={handleOpenStudio}
        />
      ) : !analyzing ? (
        <MatchEmptyState />
      ) : null}
    </motion.div>
  );
}
