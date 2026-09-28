"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  categoryDeltas,
  type CategoryDelta,
} from "@/components/tools/category-delta-chips";
import {
  deltaKind,
  formatDelta,
  type DeltaKind,
} from "@/lib/ats-delta";
import { useResumeStore, type ScoreEntry } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Notifications — derived from the store (score history + pipeline)   */
/* ------------------------------------------------------------------ */

type NotificationKind =
  | "score-up"
  | "score-down"
  | "interview"
  | "offer"
  | "rejected"
  | "resume";

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: number;
  href: string;
  /** Per-category deltas vs the previous scan — present only when BOTH
      the latest and previous history entries carry categorical scores. */
  categoryDeltas?: CategoryDelta[];
}

/* Chip tinting by delta sign — mirrors CATEGORY_CHIP_CLASS in
   category-delta-chips.tsx (the ATS panel's established language). */
const BELL_CHIP_CLASS: Record<DeltaKind, string> = {
  up: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  down: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400",
  flat: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
};

const BELL_MAX_CHIPS = 3;

const NOTIF_META: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; tint: string; label: string }
> = {
  "score-up": {
    icon: TrendingUp,
    tint: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    label: "Score up",
  },
  "score-down": {
    icon: TrendingDown,
    tint: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    label: "Score down",
  },
  interview: {
    icon: Users,
    tint: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    label: "Interview",
  },
  offer: {
    icon: Trophy,
    tint: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    label: "Offer",
  },
  rejected: {
    icon: XCircle,
    tint: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
    label: "Closed",
  },
  resume: {
    icon: FileText,
    tint: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    label: "Resume",
  },
};

/* ------------------------------------------------------------------ */
/* Per-item read state — { [notificationId]: readAtTimestamp }         */
/* Key is versioned (v2) so the old last-read timestamp never clashes  */
/* ------------------------------------------------------------------ */

type NotificationsReadMap = Record<string, number>;

const NOTIFS_READ_KEY = "resumeforge-notifs-read-v2";

function readNotifsReadMap(): NotificationsReadMap {
  try {
    const raw = localStorage.getItem(NOTIFS_READ_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const map: NotificationsReadMap = {};
    for (const [id, ts] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof ts === "number" && Number.isFinite(ts)) map[id] = ts;
    }
    return map;
  } catch {
    return {};
  }
}

function writeNotifsReadMap(map: NotificationsReadMap) {
  try {
    localStorage.setItem(NOTIFS_READ_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — read state simply won't persist */
  }
}

function buildNotifications(
  scoreHistory: ScoreEntry[],
  applications: ReturnType<typeof useResumeStore.getState>["applications"],
  resumes: ReturnType<typeof useResumeStore.getState>["resumes"]
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  /* Latest ATS scan per resume, with delta vs the previous scan */
  const byResume = new Map<string, ScoreEntry[]>();
  for (const e of scoreHistory) {
    const list = byResume.get(e.resumeId) ?? [];
    list.push(e);
    byResume.set(e.resumeId, list);
  }
  for (const list of byResume.values()) {
    const sorted = [...list].sort((a, b) => a.at - b.at);
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const delta = prev ? latest.score - prev.score : 0;
    // Per-category detail line, only when both scans of this resume are
    // categorical (older entries predate per-category logging → no chips).
    const catDeltas =
      prev?.categories && latest.categories
        ? categoryDeltas(prev.categories, latest.categories)
        : [];
    items.push({
      id: `score-${latest.id}`,
      kind: delta > 0 ? "score-up" : delta < 0 ? "score-down" : "resume",
      title: `ATS scan — ${latest.score}/100`,
      body:
        delta === 0
          ? `${latest.resumeTitle} · no change since your last scan.`
          : `${latest.resumeTitle} ${delta > 0 ? "improved" : "dropped"} ${Math.abs(delta)} pts since your last scan.`,
      at: latest.at,
      href: "/dashboard/ats",
      categoryDeltas: catDeltas.length > 0 ? catDeltas : undefined,
    });
  }

  /* Pipeline events updated in the last 7 days */
  for (const app of applications) {
    if (now - app.updatedAt > day * 7) continue;
    if (app.stage === "offer") {
      items.push({
        id: `app-${app.id}`,
        kind: "offer",
        title: `Offer from ${app.company}`,
        body: `${app.role} — time to celebrate (and negotiate).`,
        at: app.updatedAt,
        href: "/dashboard/tracker",
      });
    } else if (app.stage === "interview") {
      items.push({
        id: `app-${app.id}`,
        kind: "interview",
        title: `Interview at ${app.company}`,
        body: `${app.role} — drill the question bank before the call.`,
        at: app.updatedAt,
        href: "/dashboard/interview",
      });
    } else if (app.stage === "rejected") {
      items.push({
        id: `app-${app.id}`,
        kind: "rejected",
        title: `${app.company} passed on ${app.role}`,
        body: "Closed — keep the pipeline moving, momentum matters.",
        at: app.updatedAt,
        href: "/dashboard/tracker",
      });
    }
  }

  /* Resume edits from the last 3 days */
  for (const r of resumes) {
    if (now - r.updatedAt > day * 3) continue;
    items.push({
      id: `resume-${r.id}-${r.updatedAt}`,
      kind: "resume",
      title: "Resume saved",
      body: `${r.title} — all changes are stored safely.`,
      at: r.updatedAt,
      href: "/dashboard/builder",
    });
  }

  return items.sort((a, b) => b.at - a.at).slice(0, 8);
}

/* Time grouping — Today / Yesterday / Earlier, empty groups skipped */
function groupByDay(items: NotificationItem[]): Array<{
  label: string;
  items: NotificationItem[];
}> {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];
  for (const item of items) {
    const d = new Date(item.at);
    if (isToday(d)) today.push(item);
    else if (isYesterday(d)) yesterday.push(item);
    else earlier.push(item);
  }
  return [
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterday },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);
}

export function NotificationBell() {
  const mounted = useMounted();
  const router = useRouter();
  const scoreHistory = useResumeStore((s) => s.scoreHistory);
  const applications = useResumeStore((s) => s.applications);
  const resumes = useResumeStore((s) => s.resumes);

  const [open, setOpen] = React.useState(false);
  const [readMap, setReadMap] = React.useState<NotificationsReadMap>({});

  const items = React.useMemo(
    () => buildNotifications(scoreHistory, applications, resumes),
    [scoreHistory, applications, resumes]
  );
  const groups = React.useMemo(() => groupByDay(items), [items]);

  /* Load persisted per-item read state after hydration (SSR-safe) */
  React.useEffect(() => {
    setReadMap(readNotifsReadMap());
  }, []);

  const markRead = React.useCallback(
    (id: string) => {
      setReadMap((prev) => {
        if (prev[id]) return prev;
        const next = { ...prev, [id]: Date.now() };
        writeNotifsReadMap(next);
        return next;
      });
    },
    []
  );

  const markAllRead = () => {
    const ts = Date.now();
    setReadMap((prev) => {
      const next: NotificationsReadMap = { ...prev };
      for (const item of items) next[item.id] = ts;
      writeNotifsReadMap(next);
      return next;
    });
  };

  /* Row click: mark this item read, close the dropdown, navigate */
  const openItem = (item: NotificationItem) => {
    markRead(item.id);
    setOpen(false);
    router.push(item.href);
  };

  const unreadCount = items.filter((i) => !readMap[i.id]).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-9 w-9 focus-visible:ring-emerald-500/60",
                open && "bg-muted"
              )}
              aria-label={
                mounted && unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <Bell className="h-4.5 w-4.5" />
              {mounted && unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-1 text-[9px] font-bold text-white ring-2 ring-background"
                  aria-hidden
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-[340px] overflow-hidden p-0">
        {/* Header — count chip + mark-all-read (per-item reads happen on rows) */}
        <div className="flex items-center justify-between border-b px-3.5 py-3">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold">Notifications</p>
            {mounted && unreadCount > 0 && (
              <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={mounted && unreadCount === 0}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </button>
        </div>
        <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Bell className="size-4 text-muted-foreground" />
              </span>
              <p className="text-[12.5px] font-medium">You&apos;re all caught up</p>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                Scan a resume or move an application to see updates here.
              </p>
            </div>
          ) : (
            groups.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "border-t")}>
                <p className="px-3.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((item) => {
                    const meta = NOTIF_META[item.kind];
                    const Icon = meta.icon;
                    const unread = !readMap[item.id];
                    return (
                      <li
                        key={item.id}
                        className="group/row relative border-b last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => openItem(item)}
                          className={cn(
                            "relative flex w-full gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500/60",
                            unread &&
                              "bg-emerald-500/[0.04] dark:bg-emerald-400/[0.05]"
                          )}
                        >
                          {unread && (
                            <span
                              className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-emerald-500"
                              aria-hidden
                            />
                          )}
                          <span
                            className={cn(
                              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                              meta.tint
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-[12.5px] font-semibold text-foreground">
                                {item.title}
                              </span>
                              {unread && (
                                <span
                                  className="size-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse transition-opacity group-hover/row:opacity-0"
                                  aria-label="Unread"
                                />
                              )}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-muted-foreground">
                              {item.body}
                            </span>
                            {item.categoryDeltas ? (
                              <span
                                data-bell-category-deltas="true"
                                aria-label="Per-category changes since the last scan"
                                className="mt-1.5 flex flex-wrap items-center gap-1"
                              >
                                {item.categoryDeltas
                                  .slice(0, BELL_MAX_CHIPS)
                                  .map((d) => (
                                    <span
                                      key={d.label}
                                      data-bell-category-chip={d.label}
                                      data-delta-value={d.delta}
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                                        BELL_CHIP_CLASS[deltaKind(d.delta)]
                                      )}
                                    >
                                      <span className="max-w-[72px] truncate">
                                        {d.label}
                                      </span>
                                      <span className="font-bold tabular-nums">
                                        {formatDelta(d.delta)}
                                      </span>
                                    </span>
                                  ))}
                                {item.categoryDeltas.length > BELL_MAX_CHIPS && (
                                  <span
                                    data-bell-category-more
                                    className="inline-flex items-center rounded-full bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:text-zinc-300"
                                  >
                                    +{item.categoryDeltas.length - BELL_MAX_CHIPS} more
                                  </span>
                                )}
                              </span>
                            ) : null}
                            <span className="mt-1 block text-[10.5px] font-medium text-muted-foreground/70">
                              {formatDistanceToNow(new Date(item.at), {
                                addSuffix: true,
                              })}
                            </span>
                          </span>
                        </button>
                        {unread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(item.id);
                            }}
                            /* Keep focus inside the menu layer so Radix does not
                               close the dropdown when this button unmounts */
                            onMouseDown={(e) => e.preventDefault()}
                            aria-label="Mark as read"
                            title="Mark as read"
                            className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-md border bg-background/95 text-muted-foreground opacity-0 shadow-sm transition-all [@media(hover:none)]:opacity-100 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover group-hover/row:opacity-100 dark:bg-background/90 dark:hover:text-emerald-400"
                          >
                            <Check className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="grid grid-cols-2 border-t bg-muted/30">
          <Link
            href="/dashboard/ats"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 text-center text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60"
          >
            ATS scanner
          </Link>
          <Link
            href="/dashboard/tracker"
            onClick={() => setOpen(false)}
            className="border-l px-3 py-2.5 text-center text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60"
          >
            Job tracker
          </Link>
          <Link
            href="/dashboard/compare"
            onClick={() => setOpen(false)}
            className="border-t px-3 py-2.5 text-center text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60"
          >
            Compare
          </Link>
          <Link
            href="/dashboard/interview"
            onClick={() => setOpen(false)}
            className="border-t border-l px-3 py-2.5 text-center text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60"
          >
            Interview prep
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
