"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Kanban, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore, type JobApplication } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsStrip } from "@/components/tracker/metrics";
import { KanbanBoard } from "@/components/tracker/kanban-board";
import { ApplicationSheet } from "@/components/tracker/application-sheet";
import { AddApplicationDialog } from "@/components/tracker/add-dialog";
import { exportApplicationsCsv } from "@/components/tracker/export-csv";
import { staggerItem } from "@/components/tracker/motion-presets";
import { STAGE_ORDER } from "@/components/tracker/stage-utils";

/* ------------------------------- chips ----------------------------------- */

function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "emerald";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
        tone === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted/60 text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ skeleton --------------------------------- */

function TrackerSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-6" aria-busy="true" aria-label="Loading tracker">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        {STAGE_ORDER.map((s) => (
          <div key={s} className="min-w-0 flex-1 space-y-2 rounded-2xl border p-3 lg:min-w-[260px]">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- page ----------------------------------- */

export default function TrackerPage() {
  const mounted = useMounted();
  const applications = useResumeStore((s) => s.applications);
  const resumes = useResumeStore((s) => s.resumes);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const resumeTitleById = React.useMemo(
    () => new Map(resumes.map((r) => [r.id, r.title])),
    [resumes]
  );

  const handleExportCsv = React.useCallback(() => {
    if (applications.length === 0) {
      toast.warning("Nothing to export yet — add an application first.");
      return;
    }
    const count = exportApplicationsCsv(applications, resumeTitleById);
    toast.success(`Exported ${count} ${count === 1 ? "application" : "applications"} to CSV`);
  }, [applications, resumeTitleById]);

  const selectedApp: JobApplication | undefined = selectedId
    ? applications.find((a) => a.id === selectedId)
    : undefined;

  // Close the sheet if the selected application was deleted elsewhere
  React.useEffect(() => {
    if (selectedId && !selectedApp) setSelectedId(null);
  }, [selectedId, selectedApp]);

  if (!mounted) return <TrackerSkeleton />;

  const active = applications.filter(
    (a) => a.stage === "saved" || a.stage === "applied" || a.stage === "interview"
  ).length;
  const offers = applications.filter((a) => a.stage === "offer").length;

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* Header */}
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
      >
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
            >
              <Kanban className="size-5" />
            </span>
            Job Application Tracker
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Your pipeline from saved to signed. Drag cards between stages — or open a card for
            full details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Total {applications.length}</Chip>
          <Chip>{active} in pipeline</Chip>
          <Chip tone="emerald">
            {offers} {offers === 1 ? "offer" : "offers"}
          </Chip>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="gap-1.5 border-border/80 bg-background/60 hover:bg-muted"
            aria-label="Export applications as CSV"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="size-4" aria-hidden />
            Add application
          </Button>
        </div>
      </motion.div>

      {/* Metrics */}
      <MetricsStrip applications={applications} />

      {/* Board */}
      <KanbanBoard
        applications={applications}
        resumes={resumes}
        onOpen={setSelectedId}
        onQuickAdd={() => setAddOpen(true)}
      />

      {/* Detail sheet + add dialog */}
      <ApplicationSheet
        app={selectedApp}
        open={Boolean(selectedApp)}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      />
      <AddApplicationDialog open={addOpen} onOpenChange={setAddOpen} />
    </section>
  );
}
