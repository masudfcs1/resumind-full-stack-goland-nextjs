"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { format, isValid as isValidDate } from "date-fns";
import {
  Bell,
  Briefcase,
  CheckCheck,
  Database,
  Download,
  Gauge,
  Heart,
  History,
  Info,
  Mail,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCENT_PRESETS, useActiveResume, useResumeStore } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { loadMatchHistory } from "@/components/match/history";
import { FAVORITES_STORAGE_KEY, readFavorites, writeFavorites } from "@/components/interview/favorites";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { fadeUp, fadeIn, staggerContainer } from "@/components/account/motion-presets";
import { downloadBlob } from "@/components/account/download";

/* ------------------------------ Local storage ----------------------------- */

const NOTIFICATION_KEY = "resumeforge-notifications";
const STORE_KEY = "resumeforge-store";
const MATCH_HISTORY_KEY = "resumeforge-match-history";
const NOTIFS_READ_KEY = "resumeforge-notifs-read-v2";
const STORAGE_QUOTA_KB = 5120; // ~5 MB localStorage budget used for the usage meter
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const DEFAULT_PREFS = { digest: true, ats: true, templates: false, product: false };
type Prefs = typeof DEFAULT_PREFS;

const NOTIFICATION_ROWS: Array<{ key: keyof Prefs; title: string; description: string }> = [
  { key: "digest", title: "Weekly job-match digest", description: "A Monday email with roles matched to your resumes." },
  { key: "ats", title: "ATS score reminders", description: "Nudge me when a resume hasn't been scanned in 7 days." },
  { key: "templates", title: "New template alerts", description: "Know the moment a fresh template lands in the gallery." },
  { key: "product", title: "Product updates", description: "Occasional notes about new features and improvements." },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, hint: "Bright & crisp" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, hint: "Match your OS" },
] as const;

const NAV_SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data & privacy", icon: Database },
  { id: "danger", label: "Danger zone", icon: ShieldAlert },
  { id: "about", label: "About", icon: Info },
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/* ------------------------------ Backup import ----------------------------- */

interface ParsedBackup {
  payload: Record<string, unknown>;
  resumeCount: number;
  /** Resumes carrying a truthy archived flag. Old exports (v1 and pre-archive v2)
      never have the key, so they read as 0 archived — presentation only, the
      payload schema is untouched. */
  archivedResumeCount: number;
  applicationCount: number | null; // null = absent, store will fall back to seed applications
  scoreHistoryCount: number | null; // null = absent, store will fall back to seed score history
  exportedAt: string | null;
  /** "v2" when the backup carries a 2.x version string or a meta object, "v1" otherwise. */
  formatVersion: "v1" | "v2";
  /** Interview favorites from meta.favorites.interview — null when absent or malformed (v1 backups, bare v2). */
  interviewFavorites: string[] | null;
}

function parseBackupText(text: string): { ok: true; data: ParsedBackup } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "That file isn't valid JSON. Export a fresh backup from Settings and try again." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "This doesn't look like a ResumeForge backup — expected a JSON object." };
  }
  const obj = parsed as Record<string, unknown>;
  const rawResumes = Array.isArray(obj.resumes) ? obj.resumes : null;
  if (obj.app !== "ResumeForge AI" && !rawResumes) {
    return { ok: false, reason: "This doesn't look like a ResumeForge backup — the \"app\" marker and resumes array are missing." };
  }
  if (!rawResumes || rawResumes.length === 0) {
    return { ok: false, reason: "The backup contains no resumes, so there is nothing to restore." };
  }
  for (let i = 0; i < rawResumes.length; i++) {
    const entry: unknown = rawResumes[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, reason: `Resume #${i + 1} in the backup is malformed (expected an object).` };
    }
    const rec = entry as Record<string, unknown>;
    const titleOk = typeof rec.title === "string";
    if (
      typeof rec.id !== "string" ||
      rec.id.trim() === "" ||
      !titleOk ||
      !rec.personal ||
      typeof rec.personal !== "object" ||
      Array.isArray(rec.personal)
    ) {
      const label = titleOk ? `"${rec.title}"` : `#${i + 1}`;
      return {
        ok: false,
        reason: `Resume ${label} is missing an id, a title or personal details — the backup looks corrupted.`,
      };
    }
  }
  /* Format detection (v1 vs v2): a 2.x version string or a meta object marks a v2 backup.
     Everything else — including versionless legacy exports — is treated as v1. */
  const rawMeta: unknown = obj.meta;
  const hasMeta = !!rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta);
  const versionIs2 = typeof obj.version === "string" && obj.version.trim().startsWith("2");
  const formatVersion: "v1" | "v2" = versionIs2 || hasMeta ? "v2" : "v1";

  /* v2 extras: meta.favorites.interview is an optional array of company keys.
     Normalized the same way readFavorites() stores them (trim/lowercase/dedupe). */
  let interviewFavorites: string[] | null = null;
  if (formatVersion === "v2" && hasMeta) {
    const favorites: unknown = (rawMeta as Record<string, unknown>).favorites;
    if (favorites && typeof favorites === "object" && !Array.isArray(favorites)) {
      const interview: unknown = (favorites as Record<string, unknown>).interview;
      if (Array.isArray(interview)) {
        interviewFavorites = interview
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim().toLowerCase())
          .filter((v) => v.length > 0)
          .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe, keep first
      }
    }
  }

  return {
    ok: true,
    data: {
      payload: obj,
      resumeCount: rawResumes.length,
      archivedResumeCount: rawResumes.reduce(
        (n, entry) =>
          n +
          (entry && typeof entry === "object" && !Array.isArray(entry) && !!(entry as Record<string, unknown>).archived
            ? 1
            : 0),
        0
      ),
      applicationCount: Array.isArray(obj.applications) ? obj.applications.length : null,
      scoreHistoryCount: Array.isArray(obj.scoreHistory) ? obj.scoreHistory.length : null,
      exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : null,
      formatVersion,
      interviewFavorites,
    },
  };
}

function formatBackupDate(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (!isValidDate(date)) return "Not recorded";
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

/* --------------------------- Stored tool data ----------------------------- */

/** Number of saved match analyses (reader lives in components/match/history.ts). */
function countMatchHistoryEntries(): number {
  return loadMatchHistory().length;
}

/** Number of notification ids marked as read in the bell's read map. */
function countReadNotificationIds(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(NOTIFS_READ_KEY);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return 0;
    return Object.keys(parsed as Record<string, unknown>).length;
  } catch {
    return 0;
  }
}

interface ToolDataRowProps {
  icon: LucideIcon;
  /** Tinted icon-square classes, e.g. "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400". */
  tintClass: string;
  name: string;
  description: string;
  /** localStorage key shown as a mono chip on its own line. */
  storageKey: string;
  count: number;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Rose-tinted confirm button — reserved for workspace-level purges of
      store-backed domains. localStorage-only cleanups keep the default tint. */
  destructive?: boolean;
}

function ToolDataRow({
  icon: Icon,
  tintClass,
  name,
  description,
  storageKey,
  count,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  onConfirm,
  destructive = false,
}: ToolDataRowProps) {
  const empty = count <= 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tintClass)}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            key
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{storageKey}</code>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "whitespace-nowrap text-xs tabular-nums",
            empty ? "italic text-muted-foreground/60" : "text-muted-foreground"
          )}
        >
          {empty ? "0 items · empty" : `${count} item${count === 1 ? "" : "s"}`}
        </span>
        {empty ? (
          /* Disabled buttons don't fire pointer events in every browser, so
             the tooltip trigger is a wrapper span and the button defers hit
             testing to it (pointer-events-none). */
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button variant="outline" size="sm" disabled aria-label={`Clear ${name}`} className="pointer-events-none">
                  Clear
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Nothing to clear</TooltipContent>
          </Tooltip>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" aria-label={`Clear ${name}`}>
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirm}
                  className={
                    destructive
                      ? "bg-rose-600 text-white hover:bg-rose-600/90 focus-visible:ring-rose-500/40 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500/90"
                      : undefined
                  }
                >
                  {confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const activeResume = useActiveResume();
  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const applications = useResumeStore((s) => s.applications);
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  const updateResume = useResumeStore((s) => s.updateResume);
  const resetAll = useResumeStore((s) => s.resetAll);
  const importData = useResumeStore((s) => s.importData);
  const coverLetterCount = useResumeStore((s) => s.coverLetterCount);
  /* Per-tool purge actions (Settings → Data & privacy) — each clears exactly
     one store slice and never touches resumes. */
  const clearScoreHistory = useResumeStore((s) => s.clearScoreHistory);
  const clearApplications = useResumeStore((s) => s.clearApplications);
  const clearCoverLetters = useResumeStore((s) => s.clearCoverLetters);

  /* -------- Profile (local state only) -------- */
  const [profile, setProfile] = React.useState({ name: "Alexander Chen", email: "alex.chen@email.com", role: "Senior Frontend Engineer" });

  const handleSaveProfile = () => {
    toast.success("Profile updated", { description: "Saved locally in your browser (demo)." });
  };

  /* -------- Notifications (local + localStorage) -------- */
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULT_PREFS);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIFICATION_KEY);
      if (raw) setPrefs((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<Prefs>) }));
    } catch {
      /* ignore corrupted prefs */
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [prefs]);

  /* -------- Stored tool data (per-tool localStorage managers) -------- */
  const [toolDataCounts, setToolDataCounts] = React.useState({ matchHistory: 0, readState: 0, favorites: 0 });

  const refreshToolDataCounts = React.useCallback(() => {
    setToolDataCounts({
      matchHistory: countMatchHistoryEntries(),
      readState: countReadNotificationIds(),
      favorites: readFavorites().length,
    });
  }, []);

  React.useEffect(() => {
    refreshToolDataCounts();
  }, [refreshToolDataCounts]);

  /** Preference toggles that differ from DEFAULT_PREFS — the "App preferences" row count. */
  const prefsCustomCount = React.useMemo(
    () =>
      (Object.keys(DEFAULT_PREFS) as Array<keyof Prefs>).filter((k) => prefs[k] !== DEFAULT_PREFS[k])
        .length,
    [prefs]
  );

  const handleClearMatchHistory = () => {
    try {
      window.localStorage.removeItem(MATCH_HISTORY_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
    refreshToolDataCounts();
    toast.success("Match history cleared", { description: "Recent match analyses were removed from this browser." });
  };

  const handleClearReadState = () => {
    try {
      window.localStorage.removeItem(NOTIFS_READ_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
    refreshToolDataCounts();
    toast.success("Read state reset — all notifications appear unread again.");
  };

  const handleClearPrefs = () => {
    /* setPrefs triggers the existing write-back effect, so localStorage re-syncs to defaults too. */
    setPrefs(DEFAULT_PREFS);
    toast.success("Preferences reset", { description: "Notification preferences are back to their defaults." });
  };

  const handleClearFavorites = () => {
    const n = readFavorites().length;
    writeFavorites([]);
    refreshToolDataCounts();
    toast.success("Interview favorites cleared", {
      description: `${n} starred ${n === 1 ? "company" : "companies"} removed from this browser.`,
    });
  };

  /* -------- Workspace purges (store-backed, resumes always untouched) --------
     Counts are read from the store snapshot the handler closes over — handlers
     are recreated every render, so the number in the toast always matches the
     state at click time. The storage meter refreshes automatically: the
     underlying slices are in its useMemo dependency list. */

  const handleClearScoreHistory = () => {
    const n = scoreHistory.length;
    clearScoreHistory();
    toast.success("Score history cleared", {
      description: `${n} scan ${n === 1 ? "entry" : "entries"} removed from this browser. Resumes were not affected.`,
    });
  };

  const handleClearApplications = () => {
    const n = applications.length;
    clearApplications();
    toast.success("Applications cleared", {
      description: `${n} tracked ${n === 1 ? "application" : "applications"} removed from this browser. Resumes were not affected.`,
    });
  };

  const handleClearCoverLetters = () => {
    const n = coverLetterCount;
    clearCoverLetters();
    toast.success("Cover letters cleared", {
      description: `Generated cover-letter count reset from ${n} to 0. Resumes were not affected.`,
    });
  };

  /* -------- Data & privacy -------- */
  const storageKb = React.useMemo(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      const source =
        raw ??
        JSON.stringify({ resumes, activeResumeId, coverLetterCount, applications, scoreHistory });
      return new TextEncoder().encode(source).length / 1024;
    } catch {
      return 0;
    }
  }, [resumes, activeResumeId, coverLetterCount, applications, scoreHistory]);

  const storagePct = Math.min(100, (storageKb / STORAGE_QUOTA_KB) * 100);
  const storagePctLabel = storageKb <= 0 ? "0" : storagePct < 1 ? "<1" : String(Math.round(storagePct));

  /* -------- Backup export (v2 meta review dialog → download) --------
     The snapshot is captured at open-time (event handler, never during render)
     so the dialog rows show exactly what the payload will contain. */
  interface ExportSnapshot {
    resumeCount: number;
    activeResumeCount: number;
    archivedResumeCount: number;
    coverLetterCount: number;
    applicationCount: number;
    scoreEntryCount: number;
    favoritesCount: number;
  }
  const [exportSnapshot, setExportSnapshot] = React.useState<ExportSnapshot | null>(null);
  /* Programmatic dialogs have no DialogTrigger, so Radix has no trigger to restore
     focus to — onCloseAutoFocus handlers below return focus explicitly. */
  const exportTriggerRef = React.useRef<HTMLButtonElement>(null);

  const handleOpenExport = () => {
    const archived = resumes.reduce((n, r) => n + (r.archived ? 1 : 0), 0);
    let favoritesCount = 0;
    try {
      favoritesCount = readFavorites().length;
    } catch {
      favoritesCount = 0; // storage unavailable — the export itself degrades gracefully too
    }
    setExportSnapshot({
      resumeCount: resumes.length,
      activeResumeCount: resumes.length - archived,
      archivedResumeCount: archived,
      coverLetterCount,
      applicationCount: applications.length,
      scoreEntryCount: scoreHistory.length,
      favoritesCount,
    });
  };

  const handleConfirmExport = () => {
    try {
      const exportedAt = new Date().toISOString();
      /* Backup format v2 — same v1 body (resumes / activeResumeId / coverLetterCount / exportedAt)
         plus an informational meta block. The store's importData ignores meta, so v2 exports
         still import into older builds and v1 backups keep importing here. The archived counts
         are additive informational fields only — the resume entries themselves are unchanged. */
      const archived = resumes.reduce((n, r) => n + (r.archived ? 1 : 0), 0);
      const payload = {
        app: "ResumeForge AI",
        version: "2.0.0",
        exportedAt, // kept top-level for v1 compatibility
        activeResumeId: activeResumeId,
        coverLetterCount,
        resumes,
        meta: {
          exportedAt,
          resumeCount: resumes.length,
          activeResumeCount: resumes.length - archived,
          archivedResumeCount: archived,
          applicationCount: applications.length,
          scoreEntryCount: scoreHistory.length,
          favorites: {
            interview: readFavorites(),
          },
        },
      };
      downloadBlob(JSON.stringify(payload, null, 2), "resumeforge-backup.json", "application/json;charset=utf-8");
      toast.success("Backup downloaded", { description: "resumeforge-backup.json — your full workspace as JSON." });
    } catch {
      toast.error("Export failed", { description: "Couldn't build the backup file." });
    } finally {
      setExportSnapshot(null);
    }
  };

  /* -------- Backup import (round-trip restore) -------- */
  const [pendingImport, setPendingImport] = React.useState<ParsedBackup | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropzoneRef = React.useRef<HTMLDivElement>(null);

  const handleFileChosen = React.useCallback(async (file: File) => {
    if (file.size > MAX_BACKUP_BYTES) {
      toast.error("Import failed", { description: "That file is larger than 10 MB — a ResumeForge backup is a small JSON file." });
      return;
    }
    let text = "";
    try {
      text = await file.text();
    } catch {
      toast.error("Import failed", { description: "Couldn't read the file from disk. Try re-selecting it." });
      return;
    }
    const result = parseBackupText(text);
    if (!result.ok) {
      toast.error("Import failed", { description: result.reason });
      return;
    }
    setPendingImport(result.data);
  }, []);

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    const count = importData(pendingImport.payload);
    if (count < 0) {
      toast.error("Import failed", { description: "The backup contents didn't pass validation in the store." });
      return;
    }
    /* v2 backups carry interview favorites in meta — the store ignores meta on purpose,
       so restore them to localStorage here (best effort, never blocks the import). */
    let favoritesRestored: number | null = null;
    if (pendingImport.formatVersion === "v2" && pendingImport.interviewFavorites !== null) {
      if (writeFavorites(pendingImport.interviewFavorites)) {
        favoritesRestored = pendingImport.interviewFavorites.length;
      }
    }
    const favoritesNote = favoritesRestored !== null ? ` Interview favorites restored (${favoritesRestored}).` : "";
    /* Graceful localStorage-quota handling: verify the workspace actually persisted. */
    let persistedCount: number | null = null;
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const persisted = JSON.parse(raw) as { state?: { resumes?: unknown } };
        const state = persisted?.state;
        persistedCount = state && Array.isArray(state.resumes) ? state.resumes.length : null;
      }
    } catch {
      persistedCount = null;
    }
    if (persistedCount === count) {
      toast.success("Workspace restored", {
        description: `${count} resume${count === 1 ? "" : "s"} imported from backup.${favoritesNote}`,
      });
    } else {
      toast.warning("Restored for this session", {
        description: `Your browser couldn't save the imported workspace (storage may be full). ${count} resume${count === 1 ? "" : "s"} are active — export a fresh backup now.${favoritesNote}`,
      });
    }
    setPendingImport(null);
  };

  const handleResetAll = () => {
    resetAll();
    toast.success("Workspace reset", { description: "The 3 sample resumes were restored." });
  };

  /* -------- Hydration gate: the persisted store (and localStorage meters) are client-only -------- */
  if (!mounted) {
    return (
      <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Loading settings">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-44" />
          </div>
        </div>
        <div className="mt-8 xl:grid xl:grid-cols-[190px_minmax(0,1fr)] xl:gap-10">
          <Skeleton className="hidden h-72 w-[190px] rounded-lg xl:block" />
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={Settings2}
        eyebrow="Account Tools"
        title="Settings"
        description="Tune your profile, theme, notifications and data — everything is stored locally in your browser."
      />

      <div className="mt-8 xl:grid xl:grid-cols-[190px_minmax(0,1fr)] xl:gap-10">
        {/* Sticky side nav (xl+) */}
        <nav className="hidden xl:block" aria-label="Settings sections">
          <div className="sticky top-24 flex flex-col gap-0.5">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </nav>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-3xl space-y-6"
        >
          {/* ------------------------------ Profile ------------------------------ */}
          <motion.section id="profile" variants={fadeUp} className="scroll-mt-24" aria-labelledby="profile-title">
            <Card>
              <CardHeader>
                <CardTitle id="profile-title" className="text-base">
                  Profile
                </CardTitle>
                <CardDescription>How you appear inside ResumeForge. Stored locally — this demo has no server.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="font-display flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-md shadow-emerald-500/25"
                    aria-hidden="true"
                  >
                    {initialsOf(profile.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{profile.name || "Your name"}</p>
                    <p className="text-sm text-muted-foreground">{profile.role || "Role"}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="profile-name">Full name</Label>
                    <Input
                      id="profile-name"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      autoComplete="email"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="profile-role">Role</Label>
                    <Input
                      id="profile-role"
                      value={profile.role}
                      onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. Senior Product Designer"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
                  >
                    <Save aria-hidden="true" />
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* ---------------------------- Appearance ----------------------------- */}
          <motion.section id="appearance" variants={fadeUp} className="scroll-mt-24" aria-labelledby="appearance-title">
            <Card>
              <CardHeader>
                <CardTitle id="appearance-title" className="text-base">
                  Appearance
                </CardTitle>
                <CardDescription>Pick how ResumeForge looks, and the default accent for new highlights.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Theme radio cards */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Theme</span>
                  <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon, hint }) => {
                      const selected = mounted && theme === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setTheme(value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            selected
                              ? "border-emerald-500/60 bg-emerald-500/[0.07] ring-1 ring-emerald-500/40"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <Icon
                            className={cn("size-5", selected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">{label}</span>
                          <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default accent */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Default accent</span>
                  <div className="flex flex-wrap items-center gap-2.5" role="radiogroup" aria-label="Default accent color">
                    {ACCENT_PRESETS.map((preset) => {
                      const selected = activeResume?.accent.toLowerCase() === preset.value.toLowerCase();
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`${preset.name} accent`}
                          title={`${preset.name} — ${preset.value}`}
                          disabled={!activeResume}
                          onClick={() => {
                            if (!activeResume) return;
                            updateResume(activeResumeId, { accent: preset.value });
                            toast.success(`${preset.name} accent applied`, { description: `Active resume: ${activeResume.title}` });
                          }}
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40",
                            selected && "scale-110"
                          )}
                          style={{ backgroundColor: preset.value }}
                        >
                          {selected ? <span className="size-2 rounded-full bg-white shadow" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applies to your active resume{activeResume ? ` — ${activeResume.title}` : ""}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* ---------------------------- Notifications --------------------------- */}
          <motion.section id="notifications" variants={fadeUp} className="scroll-mt-24" aria-labelledby="notifications-title">
            <Card>
              <CardHeader>
                <CardTitle id="notifications-title" className="text-base">
                  Notifications
                </CardTitle>
                <CardDescription>Saved automatically to this browser.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {NOTIFICATION_ROWS.map(({ key, title, description }) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="min-w-0">
                      <Label htmlFor={`pref-${key}`} className="text-sm font-medium">
                        {title}
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      id={`pref-${key}`}
                      checked={prefs[key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                      aria-label={title}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>

          {/* ---------------------------- Data & privacy -------------------------- */}
          <motion.section id="data" variants={fadeUp} className="flex flex-col gap-6 scroll-mt-24" aria-labelledby="data-title">
            <Card>
              <CardHeader>
                <CardTitle id="data-title" className="text-base">
                  Data &amp; privacy
                </CardTitle>
                <CardDescription>
                  Everything lives in your browser&rsquo;s localStorage — nothing leaves your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Database className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">LocalStorage usage</p>
                      <p className="text-xs text-muted-foreground">
                        ~{storageKb.toFixed(1)} KB · {resumes.length} resume{resumes.length === 1 ? "" : "s"} · key{" "}
                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{STORE_KEY}</code>
                      </p>
                      {/* Storage-usage meter (4px track, emerald gradient fill) */}
                      <div
                        className="mt-2 flex items-center gap-3"
                        role="progressbar"
                        aria-label="LocalStorage usage relative to a roughly 5 MB quota"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(storagePct)}
                        aria-valuetext={`${storagePctLabel}% of ~5 MB used (${storageKb.toFixed(1)} KB)`}
                      >
                        <div className="h-1 w-full max-w-56 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500 dark:from-emerald-400 dark:to-teal-400"
                            style={{ width: `${storagePct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {storagePctLabel}% of ~5 MB
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button ref={exportTriggerRef} variant="outline" onClick={handleOpenExport} aria-label="Export all data as JSON backup">
                    <Download aria-hidden="true" />
                    Export data
                  </Button>
                </div>

                {/* Backup format versioning note (sits under the Export data button) */}
                <p className="-mt-2.5 flex items-start justify-end gap-1.5 px-1 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  <span>Backup format v2 — includes counts + favorites. v1 backups still import perfectly.</span>
                </p>

                {/* Import backup (round-trip restore) */}
                <motion.div variants={fadeIn} className="rounded-lg border p-4" aria-labelledby="import-title">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Upload className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p id="import-title" className="text-sm font-medium">
                        Import backup
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Restore a <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">resumeforge-backup.json</code> you exported
                        earlier.
                      </p>
                    </div>
                  </div>

                  <Label htmlFor="import-backup-input" className="sr-only">
                    ResumeForge backup file (JSON)
                  </Label>
                  <input
                    ref={fileInputRef}
                    id="import-backup-input"
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    aria-label="ResumeForge backup file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = ""; // allow re-selecting the same file
                      if (file) void handleFileChosen(file);
                    }}
                  />

                  <div
                    ref={dropzoneRef}
                    role="button"
                    tabIndex={0}
                    aria-label="Import backup: drop resumeforge-backup.json here, or press Enter to browse for the file"
                    aria-describedby="import-hint"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleFileChosen(file);
                    }}
                    className={cn(
                      "relative mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-8 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      dragOver
                        ? "bg-emerald-500/[0.08] text-emerald-600 dark:bg-emerald-400/[0.08] dark:text-emerald-400"
                        : "text-emerald-500/50 hover:bg-emerald-500/[0.03] hover:text-emerald-500/90 dark:text-emerald-400/40 dark:hover:text-emerald-400/70"
                    )}
                  >
                    {/* Animated dashed border (CSS stroke-dashoffset loop) */}
                    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
                      <rect
                        x="1"
                        y="1"
                        rx="10"
                        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="10 8"
                        className="dash-dance"
                      />
                    </svg>
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-full transition-colors",
                        dragOver ? "bg-emerald-500/20 dark:bg-emerald-400/20" : "bg-emerald-500/10 dark:bg-emerald-400/10"
                      )}
                    >
                      <Upload className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Drop your <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">resumeforge-backup.json</code> here or{" "}
                      <span className="underline decoration-emerald-500/60 decoration-dashed underline-offset-4">browse</span>
                    </p>
                    <p id="import-hint" className="text-xs text-muted-foreground">
                      Restores resumes, applications, score history and counters. The file is read locally — nothing is uploaded.
                    </p>
                  </div>
                </motion.div>

                <p className="text-xs text-muted-foreground">
                  Export produces <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">resumeforge-backup.json</code> — a full snapshot
                  of your resumes, settings and counters. Importing the same file restores it exactly.
                </p>
              </CardContent>
            </Card>

            {/* Stored tool data — granular per-tool cleanup without touching the workspace */}
            <Card aria-labelledby="tool-data-title">
              <CardHeader>
                <CardTitle id="tool-data-title" className="text-base">
                  Stored tool data
                </CardTitle>
                <CardDescription>Granular cleanup — keep your resumes, clear the extras.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ToolDataRow
                  icon={History}
                  tintClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  name="Job Match history"
                  description="Recent analyses from the Job Match Scanner."
                  storageKey={MATCH_HISTORY_KEY}
                  count={toolDataCounts.matchHistory}
                  confirmTitle="Clear match history?"
                  confirmDescription="This removes all recent match analyses stored in this browser. Your resumes and ATS scores are not affected."
                  confirmLabel="Clear history"
                  onConfirm={handleClearMatchHistory}
                />
                <ToolDataRow
                  icon={CheckCheck}
                  tintClass="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                  name="Notification read-state"
                  description="Ids of notifications you already read."
                  storageKey={NOTIFS_READ_KEY}
                  count={toolDataCounts.readState}
                  confirmTitle="Reset read state?"
                  confirmDescription="Every notification will appear unread again the next time you open the bell."
                  confirmLabel="Reset read state"
                  onConfirm={handleClearReadState}
                />
                <ToolDataRow
                  icon={SlidersHorizontal}
                  tintClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  name="App preferences"
                  description="Notification toggles that differ from the defaults."
                  storageKey={NOTIFICATION_KEY}
                  count={prefsCustomCount}
                  confirmTitle="Reset preferences?"
                  confirmDescription="Notification toggles return to their defaults: weekly digest and ATS reminders on, template alerts and product updates off."
                  confirmLabel="Reset to defaults"
                  onConfirm={handleClearPrefs}
                />
                <ToolDataRow
                  icon={Star}
                  tintClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  name="Interview favorites"
                  description="Starred companies pinned in Interview Prep."
                  storageKey={FAVORITES_STORAGE_KEY}
                  count={toolDataCounts.favorites}
                  confirmTitle="Clear interview favorites?"
                  confirmDescription={`This permanently removes ${toolDataCounts.favorites} starred ${
                    toolDataCounts.favorites === 1 ? "company" : "companies"
                  } from this browser. Export a backup first if you might need them — v2 backups include favorites.`}
                  confirmLabel="Clear favorites"
                  onConfirm={handleClearFavorites}
                />
              </CardContent>
            </Card>

            {/* Workspace data — per-tool purge of the persisted store slices.
                Interview practice state (practiced ids, STAR notes, the current
                session) is deliberately component-local on the interview page —
                per-visit by design, nothing persisted to purge here. */}
            <Card aria-labelledby="workspace-data-title">
              <CardHeader>
                <CardTitle id="workspace-data-title" className="text-base">
                  Workspace data
                </CardTitle>
                <CardDescription>Clear one domain at a time — your resumes always stay.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ToolDataRow
                  icon={Gauge}
                  tintClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  name="Score history"
                  description="ATS scan log behind resume health, freshness and Compare deltas."
                  storageKey={STORE_KEY}
                  count={scoreHistory.length}
                  confirmTitle="Clear score history?"
                  confirmDescription={`This permanently removes ${scoreHistory.length} scan ${
                    scoreHistory.length === 1 ? "entry" : "entries"
                  } from this browser. Export a backup first if you might need them. Resumes are not affected — health freshness simply resets to “never scanned”.`}
                  confirmLabel="Clear history"
                  destructive
                  onConfirm={handleClearScoreHistory}
                />
                <ToolDataRow
                  icon={Briefcase}
                  tintClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  name="Job applications"
                  description="Tracked roles from the Job Tracker board, with stages and notes."
                  storageKey={STORE_KEY}
                  count={applications.length}
                  confirmTitle="Clear job applications?"
                  confirmDescription={`This permanently removes ${applications.length} tracked ${
                    applications.length === 1 ? "application" : "applications"
                  } from this browser. Export a backup first if you might need them. Resumes are not affected.`}
                  confirmLabel="Clear applications"
                  destructive
                  onConfirm={handleClearApplications}
                />
                <ToolDataRow
                  icon={Mail}
                  tintClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  name="Cover letters"
                  description="Count of letters generated with the AI cover letter writer."
                  storageKey={STORE_KEY}
                  count={coverLetterCount}
                  confirmTitle="Clear cover letters?"
                  confirmDescription={`This permanently removes ${coverLetterCount} generated ${
                    coverLetterCount === 1 ? "letter" : "letters"
                  } from this browser — the saved count resets to 0. Export a backup first if you might need them. Resumes are not affected.`}
                  confirmLabel="Clear counter"
                  destructive
                  onConfirm={handleClearCoverLetters}
                />
              </CardContent>
            </Card>
          </motion.section>

          {/* ----------------------------- Danger zone ---------------------------- */}
          <motion.section id="danger" variants={fadeUp} className="scroll-mt-24" aria-labelledby="danger-title">
            <Card className="border-rose-500/40 bg-rose-500/[0.03] dark:border-rose-500/30">
              <CardHeader>
                <CardTitle id="danger-title" className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="size-4" aria-hidden="true" />
                  Danger zone
                </CardTitle>
                <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
                  Irreversible actions — please be certain.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Reset all data</p>
                  <p className="text-xs text-muted-foreground">
                    This restores the 3 sample resumes and clears your changes.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                      aria-label="Reset all data"
                    >
                      <Trash2 aria-hidden="true" />
                      Reset all data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This restores the 3 sample resumes and clears your changes. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetAll}
                        className="bg-rose-600 text-white hover:bg-rose-600/90 focus-visible:ring-rose-500/40"
                      >
                        Yes, reset everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.section>

          {/* -------------------------------- About ------------------------------- */}
          <motion.section id="about" variants={fadeUp} className="scroll-mt-24" aria-labelledby="about-title">
            <Card>
              <CardHeader>
                <CardTitle id="about-title" className="text-base">
                  About
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display flex items-center gap-2 text-sm font-semibold">
                      ResumeForge AI
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        v1.0.0
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">Frontend-only demo · your data never leaves this browser</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Features">
                  {[
                    "6 resume templates",
                    "AI bullet writer",
                    "ATS scanner",
                    "Grammar check",
                    "Cover letters",
                    "LinkedIn import",
                    "Portfolio generator",
                  ].map((feature) => (
                    <span key={feature} className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 border-t pt-4 text-xs text-muted-foreground">
                  Built with Next.js 16 · Tailwind 4 · shadcn/ui · framer-motion
                  <Heart className="size-3.5 fill-rose-500 text-rose-500" aria-label="love" />
                </p>
              </CardContent>
            </Card>
          </motion.section>
        </motion.div>
      </div>

      {/* ------------------------- Export confirmation ------------------------- */}
      <Dialog open={exportSnapshot !== null} onOpenChange={(open) => { if (!open) setExportSnapshot(null); }}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            exportTriggerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Export your workspace?
            </DialogTitle>
            <DialogDescription>
              A full JSON snapshot of your workspace will download as resumeforge-backup.json.
            </DialogDescription>
          </DialogHeader>
          {exportSnapshot ? (
            <div className="flex flex-col gap-2" role="list" aria-label="Backup contents">
              <div role="listitem">
                <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Backup format</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    v2
                  </Badge>
                </div>
              </div>
              <div role="listitem">
                <SummaryRow
                  label="Resumes"
                  value={`${exportSnapshot.activeResumeCount} active · ${exportSnapshot.archivedResumeCount} archived`}
                />
              </div>
              <div role="listitem">
                <SummaryRow label="Cover letters" value={String(exportSnapshot.coverLetterCount)} />
              </div>
              <div role="listitem">
                <SummaryRow label="Job applications" value={String(exportSnapshot.applicationCount)} />
              </div>
              <div role="listitem">
                <SummaryRow label="Score history" value={`${exportSnapshot.scoreEntryCount} entries`} />
              </div>
              <div role="listitem">
                <SummaryRow label="Interview favorites" value={String(exportSnapshot.favoritesCount)} />
              </div>
            </div>
          ) : null}
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>The file is generated in your browser — nothing is uploaded. Archived resumes are included in the snapshot.</span>
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setExportSnapshot(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
            >
              <Download aria-hidden="true" />
              Download backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------- Import confirmation ------------------------- */}
      <Dialog open={pendingImport !== null} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            dropzoneRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Restore this backup?
            </DialogTitle>
            <DialogDescription>Review the contents before they replace your current workspace.</DialogDescription>
          </DialogHeader>
          {pendingImport ? (
            <div className="flex flex-col gap-2" role="list" aria-label="Backup contents">
              <div role="listitem">
                <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Backup format</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {pendingImport.formatVersion}
                  </Badge>
                </div>
              </div>
              <div role="listitem">
                <SummaryRow
                  label="Resumes"
                  value={`${pendingImport.resumeCount - pendingImport.archivedResumeCount} active · ${pendingImport.archivedResumeCount} archived`}
                />
              </div>
              <div role="listitem">
                <SummaryRow
                  label="Job applications"
                  value={
                    pendingImport.applicationCount !== null
                      ? String(pendingImport.applicationCount)
                      : "Resets to the 3 sample entries"
                  }
                />
              </div>
              <div role="listitem">
                <SummaryRow
                  label="Score history"
                  value={
                    pendingImport.scoreHistoryCount !== null
                      ? `${pendingImport.scoreHistoryCount} entries`
                      : "Resets to the 8 sample entries"
                  }
                />
              </div>
              {pendingImport.formatVersion === "v2" && pendingImport.interviewFavorites !== null ? (
                <div role="listitem">
                  <SummaryRow label="Interview favorites" value={String(pendingImport.interviewFavorites.length)} />
                </div>
              ) : null}
              <div role="listitem">
                <SummaryRow label="Exported" value={formatBackupDate(pendingImport.exportedAt)} />
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/[0.06] p-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-400/[0.06] dark:text-amber-400">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              This replaces your current workspace — all resumes, applications and score history will be overwritten. Export a fresh
              backup first if you might need it.
            </span>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
            >
              <Upload aria-hidden="true" />
              Restore workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
