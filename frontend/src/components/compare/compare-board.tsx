"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowUpRight, GitCompareArrows, Info, Link2 } from "lucide-react";
import { toast } from "sonner";

import { ResumeColumn } from "@/components/compare/compare-columns";
import {
  BreakdownDiff,
  IssuesPanel,
  KeywordEdge,
  VerdictBanner,
} from "@/components/compare/compare-diff";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import {
  EASE,
  staggerContainer,
  staggerItem,
} from "@/components/tools/variants";
import { Button, buttonVariants } from "@/components/ui/button";
import { atsAnalyze } from "@/lib/mock-ai";
import { resumeHealth } from "@/lib/resume-health";
import { useResumeStore } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

/* ============================== Footer CTA button ============================== */

function OpenInStudioButton({
  sideLabel,
  accent,
  resumeId,
  onOpen,
}: {
  sideLabel: string;
  accent: string;
  resumeId: string;
  onOpen: (id: string) => void;
}) {
  return (
    <Button asChild variant="outline" className="bg-background/60 backdrop-blur">
      <Link href="/dashboard/builder" onClick={() => onOpen(resumeId)}>
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
        Open {sideLabel} in Resume Studio
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}

/* ============================== CompareBoard ============================== */

/**
 * Full comparison experience: header with swap action, two resume columns,
 * verdict banner, breakdown diff, issues tabs, keyword edge, and footer CTAs.
 * Only rendered after hydration (the page gates it) with >= 2 resumes present.
 */
export function CompareBoard() {
  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const scoreHistory = useResumeStore((s) => s.scoreHistory);

  // Defaults: A = active resume, B = the next different resume.
  const [idA, setIdA] = React.useState(
    () => activeResumeId || resumes[0]?.id || ""
  );
  const [idB, setIdB] = React.useState(
    () => resumes.find((r) => r.id !== idA)?.id ?? idA
  );

  // Shareable links: on mount, hydrate the pair from ?a=&b= if both ids are
  // valid, existing and different. Client-only (this board mounts post-hydration,
  // and window.location is only ever read inside this effect, never at render).
  // Invalid/missing/identical ids fall back to the defaults above, silently.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    const b = params.get("b");
    if (!a || !b || a === b) return;
    const current = useResumeStore.getState().resumes;
    if (current.some((r) => r.id === a) && current.some((r) => r.id === b)) {
      setIdA(a);
      setIdB(b);
    }
  }, []);

  // Keep the URL in sync with the current pair (replace — the back button
  // stays clean). Runs after the hydration pass above, so the final URL always
  // reflects the resumes actually shown.
  React.useEffect(() => {
    if (!idA || !idB) return;
    const params = new URLSearchParams({ a: idA, b: idB });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }, [idA, idB]);

  // Resolve with graceful fallbacks if a selected resume disappears.
  const rawA = resumes.find((r) => r.id === idA);
  const rawB = resumes.find((r) => r.id === idB);
  const resumeA = rawA ?? resumes.find((r) => r.id !== rawB?.id) ?? resumes[0];
  const resumeB = rawB ?? resumes.find((r) => r.id !== resumeA?.id) ?? resumes[0];

  const resultA = React.useMemo(
    () => (resumeA ? atsAnalyze(resumeA) : undefined),
    [resumeA]
  );
  const resultB = React.useMemo(
    () => (resumeB ? atsAnalyze(resumeB) : undefined),
    [resumeB]
  );

  // Last-scan health per side (same signal the columns render as freshness pills).
  const healthA = React.useMemo(
    () => (resumeA ? resumeHealth(scoreHistory, resumeA.id) : undefined),
    [scoreHistory, resumeA]
  );
  const healthB = React.useMemo(
    () => (resumeB ? resumeHealth(scoreHistory, resumeB.id) : undefined),
    [scoreHistory, resumeB]
  );

  const keywordGroups = React.useMemo(() => {
    if (!resultA || !resultB) return { both: [] as string[], onlyA: [] as string[], onlyB: [] as string[] };
    const setB = new Set(resultB.matchedKeywords);
    const setA = new Set(resultA.matchedKeywords);
    return {
      both: resultA.matchedKeywords.filter((k) => setB.has(k)),
      onlyA: resultA.matchedKeywords.filter((k) => !setB.has(k)),
      onlyB: resultB.matchedKeywords.filter((k) => !setA.has(k)),
    };
  }, [resultA, resultB]);

  // Defensive: the page only renders this component with >= 2 resumes.
  if (!resumeA || !resumeB || !resultA || !resultB) return null;

  const delta = resultA.score - resultB.score;
  const sideA = { resume: resumeA, result: resultA };
  const sideB = { resume: resumeB, result: resultB };

  // One-line hint, only when freshness is lopsided: one side scanned recently,
  // the other gone stale (never-scanned counts as stale). Side-agnostic — it
  // names the resumes themselves, so it stays truthful after a swap.
  const freshnessNote = healthA && healthB
    ? healthA.bucket === "fresh" && healthB.bucket === "stale"
      ? `Freshness note: “${resumeA.title}” was scanned recently — “${resumeB.title}” may be due for a re-scan.`
      : healthB.bucket === "fresh" && healthA.bucket === "stale"
        ? `Freshness note: “${resumeB.title}” was scanned recently — “${resumeA.title}” may be due for a re-scan.`
        : null
    : null;

  const handleSwap = () => {
    setIdA(resumeB.id);
    setIdB(resumeA.id);
    toast.success("Sides swapped", {
      description: `“${resumeB.title}” is now Resume A.`,
    });
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (permissions / insecure context) — fall back
      // to a temporary textarea + execCommand, a common legacy path.
      const helper = document.createElement("textarea");
      helper.value = url;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing else to try — the success toast still confirms intent.
      }
      document.body.removeChild(helper);
    }
    toast.success("Comparison link copied", {
      description: "Anyone opening this link sees the same head-to-head.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + share/swap actions */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <ToolPageHeader
          icon={GitCompareArrows}
          title="Resume Comparison"
          description="Put two versions head-to-head: live previews, ATS scores, a category-by-category diff, and the keyword edge between them."
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopyLink}
                className="text-muted-foreground"
                aria-label="Copy link to this comparison"
              >
                <Link2 className="size-4" aria-hidden="true" />
                Copy link
              </Button>
              <motion.button
                type="button"
                onClick={handleSwap}
                whileTap={{ rotate: 180 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "text-muted-foreground"
                )}
                aria-label="Swap sides A and B"
                title="Swap sides"
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
              </motion.button>
            </>
          }
        />
      </motion.div>

      {/* Columns A + B */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid items-start gap-6 lg:grid-cols-2"
      >
        <motion.div variants={staggerItem}>
          <ResumeColumn
            side="a"
            resume={resumeA}
            result={resultA}
            isWinner={delta > 0}
            slideFrom={28}
            onSelect={setIdA}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <ResumeColumn
            side="b"
            resume={resumeB}
            result={resultB}
            isWinner={delta < 0}
            slideFrom={-28}
            onSelect={setIdB}
          />
        </motion.div>
      </motion.div>

      {/* Verdict */}
      <motion.section
        variants={staggerItem}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        aria-label="Comparison verdict"
      >
        <VerdictBanner a={sideA} b={sideB} />
        {freshnessNote ? (
          <motion.p
            key={freshnessNote}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: 0.2 }}
            data-freshness-note="true"
            className="mt-2 flex items-start gap-1.5 px-1 text-xs text-muted-foreground"
          >
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{freshnessNote}</span>
          </motion.p>
        ) : null}
      </motion.section>

      {/* Breakdown diff */}
      <motion.section
        variants={staggerItem}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        aria-label="Score breakdown diff"
      >
        <BreakdownDiff a={sideA} b={sideB} />
      </motion.section>

      {/* Issues + keyword edge */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid items-start gap-6 xl:grid-cols-2"
        aria-label="Issues and keyword edge"
      >
        <motion.div variants={staggerItem}>
          <IssuesPanel a={sideA} b={sideB} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KeywordEdge
            both={keywordGroups.both}
            onlyA={keywordGroups.onlyA}
            onlyB={keywordGroups.onlyB}
            accentA={resumeA.accent}
            accentB={resumeB.accent}
            titleA={resumeA.title}
            titleB={resumeB.title}
          />
        </motion.div>
      </motion.section>

      {/* Footer strip */}
      <motion.section
        variants={staggerItem}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 sm:p-6"
        aria-label="Open resumes in the builder"
      >
        <div
          aria-hidden="true"
          className="absolute -left-10 -bottom-10 size-40 rounded-full bg-teal-500/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Happy with the verdict?
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Open either resume in the Studio, apply the fixes above, then run
              this comparison again to see the gap close.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:shrink-0">
            <OpenInStudioButton
              sideLabel="A"
              accent={resumeA.accent}
              resumeId={resumeA.id}
              onOpen={setActive}
            />
            <OpenInStudioButton
              sideLabel="B"
              accent={resumeB.accent}
              resumeId={resumeB.id}
              onOpen={setActive}
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
