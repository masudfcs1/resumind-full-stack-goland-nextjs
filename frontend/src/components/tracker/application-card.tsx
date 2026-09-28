"use client";

import { formatDistanceToNow } from "date-fns";
import { Banknote, StickyNote } from "lucide-react";
import { STAGE_META, type JobApplication, type ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { companyInitials, tint } from "./stage-utils";

interface ApplicationCardProps {
  app: JobApplication;
  resume?: ResumeData;
  /** Original node while its ghost is being dragged — dim + dashed. */
  dragging?: boolean;
  /** Rendered inside <DragOverlay> — lifted, tilted, glowing. */
  overlay?: boolean;
}

export function ApplicationCard({ app, resume, dragging = false, overlay = false }: ApplicationCardProps) {
  const meta = STAGE_META[app.stage];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 text-left shadow-sm",
        overlay
          ? "rotate-2 scale-[1.03] border-emerald-500/50 shadow-2xl shadow-emerald-500/25 ring-2 ring-emerald-500/40"
          : "transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md",
        dragging && "border-dashed opacity-40"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide"
          style={{ backgroundColor: tint(meta.color, "1f"), color: meta.color }}
        >
          {companyInitials(app.company)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug line-clamp-1">{app.role || "Untitled role"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {app.company || "Unknown company"}
            {app.location ? ` · ${app.location}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex min-h-5 flex-wrap items-center gap-1.5">
        {app.salary ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            <Banknote className="size-3" aria-hidden />
            {app.salary}
          </span>
        ) : null}

        {resume ? (
          <span className="inline-flex max-w-[150px] items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: resume.accent }}
            />
            <span className="truncate">{resume.title}</span>
          </span>
        ) : null}

        {app.notes ? (
          <span
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
            aria-label="Has notes"
          >
            <StickyNote className="size-3" aria-hidden />
          </span>
        ) : null}

        <span className="ml-auto shrink-0 pl-1 text-[10px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
