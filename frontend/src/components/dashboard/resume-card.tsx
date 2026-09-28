"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { ResumeData } from "@/lib/resume-store";
import {
  TEMPLATE_META,
  showDeleteUndoToast,
  takeUndoEntries,
  useResumeStore,
} from "@/lib/resume-store";
import { atsAnalyze } from "@/lib/mock-ai";
import { resumeHealth, type ResumeHealth } from "@/lib/resume-health";
import { cn } from "@/lib/utils";
import ResumePreview from "@/components/resume/resume-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "./mini-charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Archive, ArchiveRestore, Copy, MoreHorizontal, PenLine, RefreshCw, Target, Trash2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* ResumeThumb — scaled live A4 preview inside a fixed box             */
/* ------------------------------------------------------------------ */

export function ResumeThumb({
  resume,
  scale = 0.22,
  className,
}: {
  resume: ResumeData;
  scale?: number;
  className?: string;
}) {
  const w = Math.round(794 * scale);
  const h = Math.round(1123 * scale);
  return (
    <div
      aria-hidden="true"
      className={cn("overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5", className)}
      style={{ width: w, height: h }}
    >
      <div
        className="pointer-events-none select-none"
        style={{ width: 794, height: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ResumeActionsMenu — Edit / Duplicate / ATS Scan / Archive / Delete   */
/* ------------------------------------------------------------------ */

export function ResumeActionsMenu({ resume }: { resume: ResumeData }) {
  const router = useRouter();
  const setActive = useResumeStore((s) => s.setActive);
  const duplicateResume = useResumeStore((s) => s.duplicateResume);
  const deleteResume = useResumeStore((s) => s.deleteResume);
  const archiveResume = useResumeStore((s) => s.archiveResume);
  const unarchiveResume = useResumeStore((s) => s.unarchiveResume);
  const logScore = useResumeStore((s) => s.logScore);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const archived = !!resume.archived;

  const openBuilder = () => {
    setActive(resume.id);
    router.push("/dashboard/builder");
  };
  const openAts = () => {
    setActive(resume.id);
    router.push("/dashboard/ats");
  };
  const duplicate = () => {
    const newId = duplicateResume(resume.id);
    if (newId) {
      toast.success("Duplicated", {
        description: `“${resume.title} (Copy)” was added to your resumes.`,
      });
    }
  };
  /* One-click re-scan: recompute the ATS score, log it as the new latest scan
     entry and refresh the health pill (via the store subscription). */
  const rescan = () => {
    const score = atsAnalyze(resume).score;
    logScore(resume.id, resume.title, score);
    toast.success("Score logged", {
      description: `ATS ${score} — health refreshed.`,
    });
  };
  /* Soft-hide / restore. The resume keeps its place in the store either way —
     only the visibility on the resumes page changes. */
  const toggleArchive = () => {
    if (archived) {
      unarchiveResume(resume.id);
      toast.success("Resume unarchived", {
        description: `“${resume.title}” is back in your active resumes.`,
      });
    } else {
      archiveResume(resume.id);
      toast.success("Resume archived", {
        description: `“${resume.title}” moved to the Archived tab.`,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Actions for ${resume.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={openBuilder}>
            <PenLine className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>
            <Copy className="h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openAts}>
            <Target className="h-4 w-4" /> ATS Scan
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={rescan}>
            <RefreshCw className="h-4 w-4" /> Re-scan now
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleArchive}>
            {archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{resume.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes this resume and all of its content. You&apos;ll have a few
              seconds to undo afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                deleteResume(resume.id);
                /* deleteResume captured the snapshot before removal — surface
                   the standard toast with the 7s Undo action. */
                showDeleteUndoToast(takeUndoEntries());
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* SelectCheckbox — bulk-selection checkbox (grid overlay / row start) */
/* ------------------------------------------------------------------ */

function SelectCheckbox({
  resume,
  selected,
  onToggle,
  className,
}: {
  resume: ResumeData;
  selected: boolean;
  onToggle: (id: string) => void;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn("pointer-events-auto block", className)}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Select ${resume.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(resume.id);
        }}
        className={cn(
          "flex size-5 items-center justify-center rounded-md border shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          selected
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 bg-background/90 backdrop-blur hover:border-emerald-500/70 dark:border-zinc-600"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function atsScoreOf(resume: ResumeData): number {
  return atsAnalyze(resume).score;
}

function editedLabel(resume: ResumeData): string {
  return formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true });
}

/* ------------------------------------------------------------------ */
/* Resume health — scan-recency pill (fresh / aging / stale)           */
/* ------------------------------------------------------------------ */

/** Subscribes to the store's score history and derives scan recency for one resume. */
function useResumeHealth(resumeId: string): ResumeHealth {
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  return React.useMemo(() => resumeHealth(scoreHistory, resumeId), [scoreHistory, resumeId]);
}

/* Health pill — scan-recency badge AND a deep-link button: clicking it sets
   the resume active and opens /dashboard/ats with that resume preselected.
   It is a real <button> (keyboard operable) that stops propagation so it
   never triggers the full-card navigation overlay or the list-row onClick. */
function HealthPill({ resume, health }: { resume: ResumeData; health: ResumeHealth }) {
  const router = useRouter();
  const setActive = useResumeStore((s) => s.setActive);
  const { bucket, scanned, latest } = health;
  const when = latest ? formatDistanceToNow(new Date(latest.at), { addSuffix: true }) : null;
  const label = when ? `scanned ${when}` : "never scanned";
  const bucketLabel = !scanned && bucket === "stale" ? "never scanned" : bucket;

  const openAts = () => {
    setActive(resume.id);
    router.push("/dashboard/ats");
  };

  return (
    <button
      type="button"
      data-resume-id={resume.id}
      data-resume-health={bucket}
      data-scanned={scanned ? "true" : "false"}
      aria-label={`Open ATS scan for ${resume.title} — ${bucketLabel}`}
      title={
        when
          ? `Open ATS scan — last scan ${when}, score ${latest?.score ?? "—"}`
          : "Open ATS scan — this resume has never been scanned"
      }
      onClick={(e) => {
        e.stopPropagation();
        openAts();
      }}
      className={cn(
        "pointer-events-auto inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium leading-[15px] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        bucket === "fresh" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:ring-1 hover:ring-emerald-500/50 dark:border-emerald-500/30 dark:text-emerald-400",
        bucket === "aging" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:ring-1 hover:ring-amber-500/50 dark:border-amber-500/30 dark:text-amber-400",
        bucket === "stale" &&
          scanned &&
          "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:ring-1 hover:ring-rose-500/50 dark:border-rose-500/30 dark:text-rose-400",
        bucket === "stale" &&
          !scanned &&
          "border-zinc-500/25 bg-zinc-500/10 text-zinc-600 hover:ring-1 hover:ring-zinc-500/50 dark:border-zinc-500/40 dark:text-zinc-400"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full transition-colors duration-300",
          bucket === "fresh" && "bg-emerald-500",
          bucket === "aging" && "bg-amber-500",
          bucket === "stale" && scanned && "bg-rose-500",
          bucket === "stale" && !scanned && "bg-zinc-400 dark:bg-zinc-500"
        )}
      />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ResumeCard — grid card for /dashboard/resumes                       */
/* ------------------------------------------------------------------ */

export function ResumeCard({
  resume,
  isActive,
  index = 0,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  resume: ResumeData;
  isActive: boolean;
  index?: number;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const setActive = useResumeStore((s) => s.setActive);
  const score = atsScoreOf(resume);
  const health = useResumeHealth(resume.id);
  const archived = !!resume.archived;

  const openBuilder = () => {
    setActive(resume.id);
    router.push("/dashboard/builder");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: archived ? 0.8 : 1, y: 0 }}
      whileHover={archived ? { y: -4, opacity: 1 } : { y: -4 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
      data-resume-archived={archived ? "true" : "false"}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-emerald-500/10",
        isActive && "border-transparent ring-2 ring-emerald-500",
        selectionMode &&
          (selected
            ? "border-emerald-500/70 bg-emerald-500/[0.03] ring-2 ring-emerald-500/70"
            : "hover:border-emerald-500/40")
      )}
    >
      {/* Preview */}
      <div className="relative h-[250px] overflow-hidden border-b bg-muted/40">
        <div className="flex h-full items-start justify-center pt-2">
          <ResumeThumb resume={resume} scale={0.22} className="shadow-md" />
        </div>
        {(isActive || archived) && (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5">
            {isActive && (
              <Badge className="border-transparent bg-emerald-500 text-white shadow-sm">
                Active
              </Badge>
            )}
            {archived && (
              <Badge
                variant="secondary"
                className="gap-1 border-transparent bg-zinc-500/15 text-zinc-600 shadow-sm dark:text-zinc-300"
              >
                <Archive className="h-3 w-3" aria-hidden="true" />
                Archived
              </Badge>
            )}
          </div>
        )}
        <AnimatePresence>
          {selectionMode && onToggleSelect ? (
            <SelectCheckbox
              resume={resume}
              selected={selected}
              onToggle={onToggleSelect}
              className="absolute right-3 top-3 z-30"
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Full-card click target */}
      <button
        type="button"
        onClick={selectionMode && onToggleSelect ? () => onToggleSelect(resume.id) : openBuilder}
        className="absolute inset-0 z-10 cursor-pointer"
        aria-label={
          selectionMode && onToggleSelect
            ? `Toggle selection for ${resume.title}`
            : `Open ${resume.title} in the Resume Studio`
        }
        aria-pressed={selectionMode && onToggleSelect ? selected : undefined}
      />

      {/* Body */}
      <div className="relative z-20 pointer-events-none flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-semibold tracking-tight">{resume.title}</h3>
        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
          {resume.personal.jobTitle || resume.personal.fullName || "No name yet"}
        </p>

        <div className="mt-3 flex items-center gap-2.5 border-t pt-3">
          <ScoreRing score={score} size={38} strokeWidth={4} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
                {TEMPLATE_META[resume.template].name}
              </Badge>
              <HealthPill resume={resume} health={health} />
              <span className="text-[10.5px] text-muted-foreground">ATS {score}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Edited {editedLabel(resume)}
            </p>
          </div>
          <div className="pointer-events-auto">
            <ResumeActionsMenu resume={resume} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* ResumeListRow — compact row for /dashboard/resumes (list view)      */
/* ------------------------------------------------------------------ */

export function ResumeListRow({
  resume,
  isActive,
  index = 0,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  resume: ResumeData;
  isActive: boolean;
  index?: number;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const setActive = useResumeStore((s) => s.setActive);
  const score = atsScoreOf(resume);
  const health = useResumeHealth(resume.id);
  const archived = !!resume.archived;

  const openBuilder = () => {
    setActive(resume.id);
    router.push("/dashboard/builder");
  };
  const activate = () => {
    if (selectionMode && onToggleSelect) onToggleSelect(resume.id);
    else openBuilder();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: archived ? 0.8 : 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.35), ease: "easeOut" }}
      onClick={activate}
      role="button"
      tabIndex={0}
      data-resume-archived={archived ? "true" : "false"}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      aria-label={
        selectionMode && onToggleSelect
          ? `Toggle selection for ${resume.title}`
          : `Open ${resume.title} in the Resume Studio`
      }
      aria-pressed={selectionMode && onToggleSelect ? selected : undefined}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md hover:shadow-emerald-500/10",
        isActive && "border-emerald-500/60 bg-emerald-500/[0.04]",
        selectionMode &&
          (selected
            ? "border-emerald-500/70 bg-emerald-500/[0.03] ring-2 ring-emerald-500/70"
            : "hover:border-emerald-500/40")
      )}
    >
      <AnimatePresence>
        {selectionMode && onToggleSelect ? (
          <SelectCheckbox
            resume={resume}
            selected={selected}
            onToggle={onToggleSelect}
            className="shrink-0"
          />
        ) : null}
      </AnimatePresence>

      <ResumeThumb resume={resume} scale={0.062} className="hidden shrink-0 sm:block" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold tracking-tight">{resume.title}</h3>
          {isActive && (
            <Badge className="shrink-0 border-transparent bg-emerald-500 text-white">Active</Badge>
          )}
          {archived && (
            <Badge
              variant="secondary"
              className="shrink-0 gap-1 border-transparent bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
            >
              <Archive className="h-3 w-3" aria-hidden="true" />
              Archived
            </Badge>
          )}
          {/* stopPropagation wrapper mirrors the actions-menu pattern so the
              pill click never triggers the row's openBuilder onClick */}
          <span className="inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
            <HealthPill resume={resume} health={health} />
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {resume.personal.jobTitle || resume.personal.fullName || "No name yet"} ·{" "}
          {TEMPLATE_META[resume.template].name}
        </p>
      </div>

      <div className="hidden w-24 shrink-0 text-right text-[12px] text-muted-foreground md:block">
        Edited {editedLabel(resume)}
      </div>

      <ScoreRing score={score} size={38} strokeWidth={4} className="shrink-0" />

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <ResumeActionsMenu resume={resume} />
      </div>
    </motion.div>
  );
}
