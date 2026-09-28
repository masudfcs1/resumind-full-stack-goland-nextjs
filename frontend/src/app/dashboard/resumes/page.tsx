"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Copy,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ACCENT_PRESETS,
  TEMPLATE_META,
  showDeleteUndoToast,
  takeUndoEntries,
  useActiveResume,
  useResumeStore,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-store";
import { atsAnalyze } from "@/lib/mock-ai";
import { healthRank, resumeHealth, type ResumeHealth } from "@/lib/resume-health";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeCard, ResumeListRow } from "@/components/dashboard/resume-card";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type SortKey = "recent" | "name" | "ats" | "health";
type ViewMode = "grid" | "list";
type ResumeTab = "active" | "archived";
type HealthCountBucket = "fresh" | "aging" | "stale" | "never";
type HealthFilterKey = "all" | "fresh" | "aging" | "stale";

/* Fallback health for a resume missing from the derived map (never scanned). */
const NEVER_HEALTH: ResumeHealth = { bucket: "stale", scanned: false, latest: null };

/* Filter chips reuse each bucket's soft tint so color-coding stays consistent
   with the pills and the summary strip; the active chip adds the emerald state. */
const HEALTH_CHIP_TINT: Record<HealthFilterKey, string> = {
  all: "border-zinc-500/25 bg-zinc-500/[0.07] text-zinc-600 hover:bg-zinc-500/15 dark:text-zinc-400",
  fresh:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
  aging:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400",
  stale:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400",
};
const HEALTH_CHIP_DOT: Record<HealthFilterKey, string> = {
  all: "bg-zinc-400 dark:bg-zinc-500",
  fresh: "bg-emerald-500",
  aging: "bg-amber-500",
  stale: "bg-rose-500",
};
const HEALTH_CHIP_LABEL: Record<HealthFilterKey, string> = {
  all: "All",
  fresh: "Fresh",
  aging: "Aging",
  stale: "Stale",
};
const HEALTH_CHIP_TITLE: Record<HealthFilterKey, string> = {
  all: "Show every resume",
  fresh: "Scanned within the last 24 hours",
  aging: "Last scanned 1–7 days ago",
  stale: "Last scanned over 7 days ago, or never scanned",
};

function HealthChip({
  filterKey,
  count,
  active,
  onToggle,
}: {
  filterKey: HealthFilterKey;
  count: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-health-chip={filterKey}
      data-chip-count={count}
      aria-pressed={active}
      title={HEALTH_CHIP_TITLE[filterKey]}
      onClick={onToggle}
      className={cn(
        "inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "border-emerald-500/70 bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-400"
          : HEALTH_CHIP_TINT[filterKey]
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", HEALTH_CHIP_DOT[filterKey])} aria-hidden="true" />
      {HEALTH_CHIP_LABEL[filterKey]}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}

const TEMPLATE_IDS: TemplateId[] = ["modern", "classic", "minimal", "creative", "executive", "technical"];

/* Active / Archived view switch — two pill tabs in the same visual language
   as the health chips (aria-pressed toggle buttons). Counts are per-view and
   query-agnostic so they always agree with the list lengths. */
function ViewPill({
  tabKey,
  count,
  current,
  onSelect,
}: {
  tabKey: ResumeTab;
  count: number;
  current: ResumeTab;
  onSelect: (tab: ResumeTab) => void;
}) {
  const pressed = current === tabKey;
  return (
    <button
      type="button"
      data-view-pill={tabKey}
      data-pill-count={count}
      aria-pressed={pressed}
      title={
        tabKey === "active"
          ? "Show resumes in your active workspace"
          : "Show archived resumes — hidden from the active list, not deleted"
      }
      onClick={() => onSelect(tabKey)}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-[12px] font-medium leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        pressed
          ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/50 dark:text-emerald-400"
          : "text-zinc-500 hover:bg-zinc-500/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-500/10 dark:hover:text-zinc-200"
      )}
    >
      {tabKey === "active" ? "Active" : "Archived"}
      <span className="tabular-nums opacity-70">({count})</span>
    </button>
  );
}

/* Health summary stat — colored dot + tabular count, dot separator travels
   with its item (after:) so wrapped lines never start with a stray “·”. */
const HEALTH_DOT: Record<HealthCountBucket, string> = {
  fresh: "bg-emerald-500",
  aging: "bg-amber-500",
  stale: "bg-rose-500",
  never: "bg-zinc-400 dark:bg-zinc-500",
};
const HEALTH_LABEL: Record<HealthCountBucket, string> = {
  fresh: "fresh",
  aging: "aging",
  stale: "stale",
  never: "never scanned",
};

function HealthStat({ bucket, count }: { bucket: HealthCountBucket; count: number }) {
  return (
    <span
      data-health-count={bucket}
      className="inline-flex items-center gap-1.5 after:pl-2.5 after:text-muted-foreground/50 after:content-['·'] last:after:hidden"
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", HEALTH_DOT[bucket])} aria-hidden="true" />
      <span>
        {count} {HEALTH_LABEL[bucket]}
      </span>
    </span>
  );
}

/* Mini colored thumbnail used in the template radio-cards */
function GlyphLine({ w, light = false }: { w: number; light?: boolean }) {
  return (
    <span
      className={cn(
        "block h-[3px] shrink-0 rounded-full",
        light ? "bg-white/75" : "bg-neutral-400/70 dark:bg-neutral-500/70"
      )}
      style={{ width: `${w}%` }}
    />
  );
}

function TemplateGlyph({
  template,
  accent,
  className,
}: {
  template: TemplateId;
  accent: string;
  className?: string;
}) {
  const base =
    "h-16 w-full overflow-hidden rounded-md border border-black/5 bg-neutral-50 dark:border-white/10 dark:bg-neutral-900";

  switch (template) {
    case "modern":
      return (
        <div className={cn(base, "flex gap-1.5", className)}>
          <div className="flex w-1/3 flex-col gap-1 p-1.5" style={{ backgroundColor: accent }}>
            <GlyphLine w={85} light />
            <GlyphLine w={65} light />
            <GlyphLine w={75} light />
            <GlyphLine w={55} light />
          </div>
          <div className="flex-1 space-y-1 pt-1.5 pr-1.5">
            <GlyphLine w={70} />
            <GlyphLine w={90} />
            <GlyphLine w={85} />
            <GlyphLine w={60} />
            <GlyphLine w={78} />
          </div>
        </div>
      );
    case "classic":
      return (
        <div className={cn(base, "flex flex-col items-center gap-1", className)}>
          <span className="mt-2 h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: accent }} />
          <GlyphLine w={45} />
          <span className="my-0.5 h-px w-2/3" style={{ backgroundColor: accent }} />
          <GlyphLine w={80} />
          <GlyphLine w={65} />
        </div>
      );
    case "minimal":
      return (
        <div className={cn(base, "flex flex-col justify-center gap-1.5 px-3", className)}>
          <GlyphLine w={38} />
          <GlyphLine w={86} />
          <GlyphLine w={72} />
          <GlyphLine w={52} />
        </div>
      );
    case "creative":
      return (
        <div className={cn(base, "space-y-1.5", className)}>
          <div className="-mx-px -mt-px flex h-4 items-center px-1.5" style={{ backgroundColor: accent }}>
            <GlyphLine w={42} light />
          </div>
          <div className="flex justify-between gap-1 px-1">
            {[26, 20, 24, 16].map((w, i) => (
              <span
                key={i}
                className="h-2 rounded-full"
                style={{ width: `${w}%`, backgroundColor: `${accent}40` }}
              />
            ))}
          </div>
          <div className="space-y-1 px-1 pb-1">
            <GlyphLine w={88} />
            <GlyphLine w={66} />
          </div>
        </div>
      );
    case "executive":
      return (
        <div className={cn(base, "space-y-1.5", className)}>
          <div className="-mx-px -mt-px flex h-6 flex-col justify-center gap-1 bg-neutral-800 px-1.5 dark:bg-neutral-700">
            <GlyphLine w={46} light />
            <GlyphLine w={30} light />
          </div>
          <div className="flex gap-2 px-1.5 pb-1">
            <div className="flex-1 space-y-1">
              <GlyphLine w={92} />
              <GlyphLine w={78} />
            </div>
            <div className="flex-1 space-y-1">
              <GlyphLine w={92} />
              <GlyphLine w={70} />
            </div>
          </div>
        </div>
      );
    case "technical":
      return (
        <div className={cn(base, "grid grid-cols-2 gap-x-2 gap-y-1 p-2", className)}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GlyphLine key={i} w={((i * 17) % 38) + 56} />
          ))}
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/* New Resume dialog                                                   */
/* ------------------------------------------------------------------ */

function NewResumeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createResume = useResumeStore((s) => s.createResume);
  const [title, setTitle] = React.useState("");
  const [template, setTemplate] = React.useState<TemplateId>("modern");
  const [accent, setAccent] = React.useState(ACCENT_PRESETS[0].value);

  const handleCreate = () => {
    createResume(title.trim() || "Untitled Resume", template, accent);
    onOpenChange(false);
    setTitle("");
    toast.success("Resume created", { description: "Opening it in the Resume Studio…" });
    router.push("/dashboard/builder");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Create a new resume</DialogTitle>
          <DialogDescription>
            Pick a starting template and accent color — you can change both anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-resume-title">Resume title</Label>
            <Input
              id="new-resume-title"
              placeholder="e.g. Senior Frontend Engineer — Google"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Template">
              {TEMPLATE_IDS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={template === t}
                  onClick={() => setTemplate(t)}
                  className={cn(
                    "rounded-lg border bg-card p-2 text-left transition-all hover:border-emerald-500/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    template === t &&
                      "border-emerald-500 bg-emerald-500/[0.04] ring-2 ring-emerald-500/25"
                  )}
                >
                  <TemplateGlyph template={t} accent={accent} />
                  <p className="mt-1.5 text-[12px] font-medium">{TEMPLATE_META[t].name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  aria-label={`${preset.name} accent`}
                  aria-pressed={accent === preset.value}
                  onClick={() => setAccent(preset.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10",
                    accent === preset.value &&
                      "scale-110 ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Create resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function ResumesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading resumes">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-52" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MyResumesPage() {
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const active = useActiveResume();
  const duplicateResume = useResumeStore((s) => s.duplicateResume);
  const deleteResume = useResumeStore((s) => s.deleteResume);
  const bulkSetArchived = useResumeStore((s) => s.bulkSetArchived);
  const logScore = useResumeStore((s) => s.logScore);
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  /* Reduced-motion users get a fade-only bulk-toolbar entrance (same
     `?? false` convention as shell.tsx — null until measured, so the first
     client render always matches SSR). */
  const reduceMotion = useReducedMotion() ?? false;

  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [tab, setTab] = React.useState<ResumeTab>("active");
  const [healthFilter, setHealthFilter] = React.useState<HealthFilterKey>("all");
  const [scanningStale, setScanningStale] = React.useState(false);
  const [view, setView] = React.useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const scoreMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resumes) map.set(r.id, atsAnalyze(r).score);
    return map;
  }, [resumes]);

  /* View split. !!r.archived (never a truthy check on the key itself) so old
     persisted state without the optional flag behaves as NOT archived. */
  const activeResumes = React.useMemo(() => resumes.filter((r) => !r.archived), [resumes]);
  const archivedResumes = React.useMemo(() => resumes.filter((r) => !!r.archived), [resumes]);

  /* Health per resume, derived once and shared by the strip, the filter chips,
     the filtering pipeline and the "Health first" sort. */
  const healthById = React.useMemo(() => {
    const now = Date.now();
    const map = new Map<string, ResumeHealth>();
    for (const r of resumes) map.set(r.id, resumeHealth(scoreHistory, r.id, now));
    return map;
  }, [resumes, scoreHistory]);

  /* Health summary: scan RECENCY per resume (fresh < 24h, aging 1–7d,
     stale > 7d) with never-scanned counted separately.
     ACTIVE VIEW ONLY — archived resumes are excluded from the health strip,
     the filter chips and the bulk stale re-scan by design: the health
     workflow is about keeping the resumes you actually use fresh. */
  const healthCounts = React.useMemo(() => {
    let fresh = 0;
    let aging = 0;
    let stale = 0;
    let never = 0;
    for (const r of activeResumes) {
      const h = healthById.get(r.id) ?? NEVER_HEALTH;
      if (h.bucket === "fresh") fresh += 1;
      else if (h.bucket === "aging") aging += 1;
      else if (h.scanned) stale += 1;
      else never += 1;
    }
    return { fresh, aging, stale, never };
  }, [activeResumes, healthById]);

  /* Bucket-true stale count: scanned-stale PLUS never-scanned (both are the
     "stale" bucket), so chips, filter and bulk scan always agree. */
  const staleScanCount = healthCounts.stale + healthCounts.never;

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    /* The list always renders the CURRENT tab's resumes; health chips drive
       the active view only, so the archived list is query+sort only. */
    const source = tab === "active" ? activeResumes : archivedResumes;
    const filtered = source.filter((r) => {
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.personal.fullName.toLowerCase().includes(q) ||
        r.personal.jobTitle.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (tab !== "active" || healthFilter === "all") return true;
      /* "stale" matches the whole stale bucket (old scans + never scanned). */
      return (healthById.get(r.id) ?? NEVER_HEALTH).bucket === healthFilter;
    });
    const scoreOf = (id: string) => scoreMap.get(id) ?? 0;
    switch (sort) {
      case "name":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case "ats":
        return [...filtered].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));
      case "health":
        /* fresh → aging → stale → never, then most recently edited first. */
        return [...filtered].sort((a, b) => {
          const rankA = healthRank(healthById.get(a.id) ?? NEVER_HEALTH);
          const rankB = healthRank(healthById.get(b.id) ?? NEVER_HEALTH);
          return rankA !== rankB ? rankA - rankB : b.updatedAt - a.updatedAt;
        });
      default:
        return [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }, [tab, activeResumes, archivedResumes, query, healthFilter, sort, scoreMap, healthById]);

  /* One-click refresh of every stale-bucket resume (old + never scanned):
     recomputes each ATS score, logs it and resets all freshness timers. The
     600ms delay is intentional UX latency so the spinner state is perceivable.
     Targets the ACTIVE view only — archived resumes leave the health workflow. */
  const handleScanStale = () => {
    if (scanningStale) return;
    const now = Date.now();
    const targets = activeResumes.filter((r) => (healthById.get(r.id) ?? NEVER_HEALTH).bucket === "stale");
    if (targets.length === 0) return;
    setScanningStale(true);
    window.setTimeout(() => {
      for (const r of targets) logScore(r.id, r.title, atsAnalyze(r).score);
      setScanningStale(false);
      toast.success(`Scanned ${targets.length} stale ${targets.length === 1 ? "resume" : "resumes"}`, {
        description: "All freshness timers reset.",
      });
    }, 600);
  };

  /* Keep the selection honest when resumes disappear (per-card deletes, resets) */
  React.useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(resumes.map((r) => r.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [resumes]);

  const exitSelectMode = React.useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  /* Switching tabs also exits selection mode: a selection made in one view
     must never be bulk-operated on while looking at the other one. */
  const switchTab = React.useCallback(
    (next: ResumeTab) => {
      setTab(next);
      exitSelectMode();
    },
    [exitSelectMode]
  );

  const toggleSelect = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ESC exits selection mode — but never while an AlertDialog (bulk delete or
     per-card delete) is open. The listener runs in the CAPTURE phase so it sees
     the dialog before Radix's document-level handler closes it: Radix calls
     onOpenChange(false) synchronously during the Escape dispatch (React 19
     flush), so a bubble-phase DOM/state check would already observe the dialog
     as gone and wrongly exit selection mode. */
  React.useEffect(() => {
    if (!selectMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector("[role=alertdialog]")) return;
      exitSelectMode();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selectMode, exitSelectMode]);

  const handleBulkDuplicate = () => {
    let ok = 0;
    for (const id of selected) {
      if (duplicateResume(id)) ok += 1;
    }
    if (ok > 0) {
      toast.success(`Duplicated ${ok} ${ok === 1 ? "resume" : "resumes"}`, {
        description: "Copies were added to the top of your list.",
      });
    }
    /* Selection mode stays ON and the same set stays selected so users can continue. */
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (ids.length > 0) {
      for (const id of ids) deleteResume(id);
      /* deleteResume captured every snapshot (with original positions) before
         removal — one toast with a single 7s Undo restores the whole batch. */
      showDeleteUndoToast(takeUndoEntries());
    }
    setConfirmDelete(false);
    setSelected(new Set());
    setSelectMode(false);
  };

  /* Bulk archive / unarchive from the floating toolbar — context-aware on the
     current tab (Active → archive, Archived → unarchive). Mirrors the bulk
     delete flow: one toast for the whole batch with a 7s Undo that flips the
     flags back, then selection mode exits entirely. bulkSetArchived is
     idempotent (only resumes whose flag actually changes are touched), so an
     Undo can never double-apply. */
  const handleBulkArchive = (archived: boolean) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const n = ids.length;
    bulkSetArchived(ids, archived);
    toast.success(
      archived
        ? n === 1
          ? "Archived 1 resume"
          : `Archived ${n} resumes`
        : n === 1
          ? "Restored 1 resume from archive"
          : `Restored ${n} resumes from archive`,
      {
        description: archived
          ? "Tucked away in the Archived tab."
          : "Back in your active resumes.",
        duration: 7000,
        action: {
          label: "Undo",
          onClick: () => {
            bulkSetArchived(ids, !archived);
            toast.success(
              archived
                ? n === 1
                  ? "Restored 1 resume"
                  : `Restored ${n} resumes`
                : n === 1
                  ? "Archived 1 resume"
                  : `Archived ${n} resumes`,
              {
                description: archived
                  ? "Back in your active resumes."
                  : "Moved to the Archived tab.",
              }
            );
          },
        },
      }
    );
    /* Same exit semantics as bulk delete: the batch is done, nothing stays
       selected — the archived ids would vanish from this tab's list anyway. */
    setSelected(new Set());
    setSelectMode(false);
  };

  if (!mounted) {
    return <ResumesSkeleton />;
  }

  const hasAny = resumes.length > 0;
  const selectedCount = selected.size;
  const allVisibleSelected =
    visible.length > 0 && visible.every((r) => selected.has(r.id));
  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((r) => r.id)));
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header row */}
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            My Resumes
            <Badge
              variant="secondary"
              className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              {resumes.length}
            </Badge>
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Manage, duplicate and track every version of your resume.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resumes…"
              aria-label="Search resumes"
              className="h-9 rounded-lg pl-8"
            />
          </div>

          {/* Active / Archived view switch */}
          <div
            className="flex items-center rounded-full border p-0.5"
            role="group"
            aria-label="Active or archived resumes"
            data-view-pills="true"
          >
            <ViewPill tabKey="active" count={activeResumes.length} current={tab} onSelect={switchTab} />
            <ViewPill tabKey="archived" count={archivedResumes.length} current={tab} onSelect={switchTab} />
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[164px] rounded-lg" aria-label="Sort resumes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently edited</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="ats">ATS score</SelectItem>
              <SelectItem value="health">Health first</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="flex items-center rounded-lg border p-0.5"
            role="group"
            aria-label="View mode"
          >
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {selectMode && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg"
              onClick={toggleSelectAll}
            >
              {allVisibleSelected ? "Deselect all" : "Select all"}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            aria-pressed={selectMode}
            className="h-9 gap-1.5 rounded-lg"
          >
            {selectMode ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
            )}
            {selectMode ? "Cancel" : "Select"}
          </Button>

          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New Resume
          </Button>
        </div>
      </header>

      {/* Active resume hint */}
      {active && (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          Active resume: <span className="font-medium text-foreground">{active.title}</span>
        </p>
      )}

      {/* Resume health summary — scan recency across the ACTIVE workspace.
          Reflects the active view only: archived resumes are excluded from
          every count here (and the strip hides entirely while the Archived
          tab is shown, together with the bulk stale re-scan). */}
      {tab === "active" && activeResumes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border bg-card/60 px-3 py-2 text-[12px] tabular-nums text-muted-foreground"
          data-health-strip="true"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            Resume health
          </span>
          <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />
          <HealthStat bucket="fresh" count={healthCounts.fresh} />
          <HealthStat bucket="aging" count={healthCounts.aging} />
          <HealthStat bucket="stale" count={healthCounts.stale} />
          {healthCounts.never > 0 && <HealthStat bucket="never" count={healthCounts.never} />}

          {/* Bulk action: re-scan every stale-bucket resume (old + never scanned) */}
          {staleScanCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={scanningStale}
              onClick={handleScanStale}
              data-scan-stale="true"
              title={`Re-scan ${staleScanCount} stale or never-scanned ${staleScanCount === 1 ? "resume" : "resumes"} now`}
              className="ml-auto h-6 gap-1.5 rounded-full border-emerald-500/40 bg-emerald-500/[0.07] px-2.5 text-[11.5px] font-medium leading-none text-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.28)] hover:border-emerald-500/60 hover:bg-emerald-500/15 hover:text-emerald-800 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:hover:text-emerald-300"
            >
              {scanningStale ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
              )}
              {scanningStale ? "Scanning…" : `Scan ${staleScanCount} stale`}
            </Button>
          )}
        </motion.div>
      )}

      {/* Health filter chips — combine with the search query (AND semantics).
          Active view only (they filter the active list; hidden on Archived). */}
      {tab === "active" && activeResumes.length > 0 && (
        <div
          className="mt-2 flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter resumes by health"
          data-health-chips="true"
        >
          <span className="mr-0.5 text-[11px] font-medium text-muted-foreground">Health:</span>
          <HealthChip
            filterKey="all"
            count={activeResumes.length}
            active={healthFilter === "all"}
            onToggle={() => setHealthFilter("all")}
          />
          <HealthChip
            filterKey="fresh"
            count={healthCounts.fresh}
            active={healthFilter === "fresh"}
            onToggle={() => setHealthFilter(healthFilter === "fresh" ? "all" : "fresh")}
          />
          <HealthChip
            filterKey="aging"
            count={healthCounts.aging}
            active={healthFilter === "aging"}
            onToggle={() => setHealthFilter(healthFilter === "aging" ? "all" : "aging")}
          />
          <HealthChip
            filterKey="stale"
            count={staleScanCount}
            active={healthFilter === "stale"}
            onToggle={() => setHealthFilter(healthFilter === "stale" ? "all" : "stale")}
          />
        </div>
      )}

      {/* Content */}
      {!hasAny ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-10 text-center">
          <h3 className="font-display text-lg font-bold tracking-tight">No resumes yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first resume to unlock the builder, ATS scanner and cover letters.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New Resume
          </Button>
        </div>
      ) : tab === "archived" && archivedResumes.length === 0 ? (
        <div
          className="mt-6 flex flex-col items-center gap-1.5 rounded-xl border border-dashed p-8 text-center"
          data-archived-empty="true"
        >
          <Archive className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">Nothing archived yet</p>
          <p className="max-w-xs text-xs text-muted-foreground/70">
            Archive a resume from its actions menu to tuck it away without deleting it.
          </p>
        </div>
      ) : tab === "active" && activeResumes.length === 0 ? (
        <div
          className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-10 text-center"
          data-all-archived="true"
        >
          <Archive className="h-7 w-7 text-emerald-500/70" aria-hidden="true" />
          <h3 className="font-display text-lg font-bold tracking-tight">All resumes are archived</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Everything is tucked away in your archive — nothing was deleted.
          </p>
          <Button variant="outline" size="sm" onClick={() => switchTab("archived")}>
            View archived
          </Button>
        </div>
      ) : visible.length === 0 && tab === "active" && healthFilter !== "all" ? (
        <div
          className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
          data-health-empty={healthFilter}
        >
          <Activity className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? `No ${HEALTH_CHIP_LABEL[healthFilter].toLowerCase()} resumes match “${query.trim()}” right now.`
              : `No ${HEALTH_CHIP_LABEL[healthFilter].toLowerCase()} resumes right now.`}
          </p>
          <Button variant="outline" size="sm" onClick={() => setHealthFilter("all")}>
            Clear filter
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No resumes match “{query}”. Try a different search.
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : view === "grid" ? (
        <div
          className={cn(
            "mt-6 grid min-h-[200px] max-h-[calc(100vh-250px)] gap-5 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2 xl:grid-cols-3",
            selectMode ? "pb-36" : "pb-4"
          )}
          role="list"
          aria-label={tab === "active" ? "Resumes grid" : "Archived resumes grid"}
        >
          {visible.map((r: ResumeData, i: number) => (
            <ResumeCard
              key={r.id}
              resume={r}
              isActive={r.id === activeResumeId}
              index={i}
              selectionMode={selectMode}
              selected={selected.has(r.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "mt-6 min-h-[200px] max-h-[calc(100vh-250px)] space-y-3 overflow-y-auto pr-1 scrollbar-thin",
            selectMode ? "pb-36" : "pb-4"
          )}
          role="list"
          aria-label={tab === "active" ? "Resumes list" : "Archived resumes list"}
        >
          {visible.map((r: ResumeData, i: number) => (
            <ResumeListRow
              key={r.id}
              resume={r}
              isActive={r.id === activeResumeId}
              index={i}
              selectionMode={selectMode}
              selected={selected.has(r.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      <NewResumeDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Floating bulk action bar (multi-select mode) */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            key="bulk-bar"
            /* Reduced-motion users get a fade-only entrance (no y travel). */
            initial={reduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.2, ease: "easeOut" }
                : { type: "spring", stiffness: 400, damping: 32 }
            }
            className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
          >
            <div
              role="toolbar"
              aria-label="Bulk actions"
              className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border bg-background/95 px-4 py-2.5 shadow-xl backdrop-blur"
            >
              {/* Selection count chip */}
              <span
                data-selected-count={selectedCount}
                aria-live="polite"
                className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 text-[12px] font-semibold leading-none tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              >
                {selectedCount} selected
              </span>

              <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />

              {/* Select-all-in-view / clear — icon-only to keep the pill compact
                  on small screens (the header keeps a labeled twin). */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                disabled={visible.length === 0}
                onClick={toggleSelectAll}
                aria-label={allVisibleSelected ? "Clear selection" : "Select all in view"}
                title={allVisibleSelected ? "Clear selection" : "Select all in view"}
                data-select-all={allVisibleSelected ? "clear" : "all"}
              >
                {allVisibleSelected ? (
                  <Square className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CheckSquare className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>

              {/* Context-aware bulk archive / unarchive (per current tab) */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full border-emerald-500/40 text-emerald-700 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-800 focus-visible:ring-emerald-500/60 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                disabled={selectedCount === 0}
                onClick={() => handleBulkArchive(tab === "active")}
                aria-label={
                  tab === "active"
                    ? `Archive ${selectedCount} selected ${selectedCount === 1 ? "resume" : "resumes"}`
                    : `Unarchive ${selectedCount} selected ${selectedCount === 1 ? "resume" : "resumes"}`
                }
                title={
                  tab === "active"
                    ? "Move the selected resumes to the Archived tab"
                    : "Move the selected resumes back to Active"
                }
                data-bulk-archive-action={tab === "active" ? "archive" : "unarchive"}
              >
                {tab === "active" ? (
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden whitespace-nowrap sm:inline">
                  {tab === "active" ? "Archive" : "Unarchive"} (
                  <span className="tabular-nums">{selectedCount}</span>)
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full"
                disabled={selectedCount === 0}
                onClick={handleBulkDuplicate}
                aria-label="Duplicate selected resumes"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Duplicate</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0}
                onClick={() => setConfirmDelete(true)}
                className="h-8 gap-1.5 rounded-full border-rose-500/40 text-rose-600 hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                aria-label="Delete selected resumes"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Delete</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={exitSelectMode}
                aria-label="Exit selection mode"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? "resume" : "resumes"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes {selectedCount === 1 ? "it" : "them"} and all of their content. You
              will have a few seconds to undo afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
