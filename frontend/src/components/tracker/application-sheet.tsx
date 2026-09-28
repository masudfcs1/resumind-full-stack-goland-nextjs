"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, ExternalLink, RefreshCw, Save, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  STAGE_META,
  useResumeStore,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_ORDER, companyInitials, tint } from "./stage-utils";

/* ------------------------------ field ----------------------------------- */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------ sheet body ------------------------------ */

function SheetBody({ app, onClose }: { app: JobApplication; onClose: () => void }) {
  const updateApplication = useResumeStore((s) => s.updateApplication);
  const moveApplication = useResumeStore((s) => s.moveApplication);
  const deleteApplication = useResumeStore((s) => s.deleteApplication);
  const resumes = useResumeStore((s) => s.resumes);

  const meta = STAGE_META[app.stage];

  // Local draft, keyed-remounted per app (see <SheetBody key={app.id}>), so
  // edits never clobber other applications and external updates stay visible.
  const [draft, setDraft] = React.useState({
    company: app.company,
    role: app.role,
    location: app.location,
    salary: app.salary,
    notes: app.notes,
  });

  const dirty =
    draft.company !== app.company ||
    draft.role !== app.role ||
    draft.location !== app.location ||
    draft.salary !== app.salary ||
    draft.notes !== app.notes;

  const set =
    (key: keyof typeof draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  /** Commits changed fields. Silent on blur (explicit Save button shows a toast). */
  const commit = (opts?: { silent?: boolean }) => {
    const patch: Partial<JobApplication> = {};
    const company = draft.company.trim();
    const role = draft.role.trim();
    if (company && company !== app.company) patch.company = company;
    if (role && role !== app.role) patch.role = role;
    if (draft.location.trim() !== app.location) patch.location = draft.location.trim();
    if (draft.salary.trim() !== app.salary) patch.salary = draft.salary.trim();
    if (draft.notes !== app.notes) patch.notes = draft.notes;

    if (Object.keys(patch).length === 0) {
      if (!opts?.silent) toast.info("No changes to save");
      return;
    }
    updateApplication(app.id, patch);
    if (!opts?.silent) toast.success("Changes saved");
  };

  const handleStageChange = (value: string) => {
    const stage = value as ApplicationStage;
    if (stage === app.stage) return;
    moveApplication(app.id, stage);
    if (stage === "offer") {
      toast.success("Offer received!", {
        icon: <Trophy className="size-4 text-emerald-500" aria-hidden />,
        description: `${app.company} — ${app.role}. Time to negotiate!`,
      });
    } else {
      toast(`Moved ${app.company} → ${STAGE_META[stage].label}`);
    }
  };

  const handleDelete = () => {
    deleteApplication(app.id);
    onClose();
    toast.success(`Deleted ${app.company} application`);
  };

  return (
    <>
      <SheetHeader className="border-b p-4 pr-14">
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ backgroundColor: tint(meta.color, "1f"), color: meta.color }}
          >
            {companyInitials(app.company)}
          </div>
          <div className="min-w-0 pt-0.5">
            <SheetTitle className="font-display text-base leading-snug">
              {app.role || "Untitled role"}
            </SheetTitle>
            <SheetDescription className="truncate">
              {app.company}
              {app.location ? ` · ${app.location}` : ""}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 scrollbar-thin">
        {/* Job posting link — non-navigating demo chip */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Job posting</p>
          <div className="mt-1.5">
            {app.url ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("External links are disabled in demo");
                }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`${app.url} — external links are disabled in demo`}
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{app.url}</span>
              </button>
            ) : (
              <p className="text-xs text-muted-foreground/70">No link added</p>
            )}
          </div>
        </div>

        {/* Stage + resume used */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stage" htmlFor="sheet-stage">
            <Select value={app.stage} onValueChange={handleStageChange}>
              <SelectTrigger id="sheet-stage" className="w-full" aria-label="Application stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ backgroundColor: STAGE_META[s].color }}
                      />
                      {STAGE_META[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Resume used" htmlFor="sheet-resume">
            <Select
              value={app.resumeId || "none"}
              onValueChange={(v) => updateApplication(app.id, { resumeId: v === "none" ? "" : v })}
            >
              <SelectTrigger id="sheet-resume" className="w-full" aria-label="Resume used">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No resume</SelectItem>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: r.accent }}
                      />
                      <span className="truncate">{r.title}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company" htmlFor="sheet-company">
            <Input
              id="sheet-company"
              value={draft.company}
              onChange={set("company")}
              onBlur={() => commit({ silent: true })}
            />
          </Field>
          <Field label="Role" htmlFor="sheet-role">
            <Input
              id="sheet-role"
              value={draft.role}
              onChange={set("role")}
              onBlur={() => commit({ silent: true })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location" htmlFor="sheet-location">
            <Input
              id="sheet-location"
              value={draft.location}
              placeholder="e.g. Remote"
              onChange={set("location")}
              onBlur={() => commit({ silent: true })}
            />
          </Field>
          <Field label="Salary" htmlFor="sheet-salary">
            <Input
              id="sheet-salary"
              value={draft.salary}
              placeholder="e.g. $150K – $200K"
              onChange={set("salary")}
              onBlur={() => commit({ silent: true })}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="sheet-notes">
          <Textarea
            id="sheet-notes"
            rows={4}
            value={draft.notes}
            placeholder="Interview prep, contacts, follow-ups…"
            onChange={set("notes")}
            onBlur={() => commit({ silent: true })}
          />
        </Field>

        {/* Timestamps */}
        <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            Added {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
          </p>
          <p className="flex items-center gap-1.5">
            <RefreshCw className="size-3.5 shrink-0" aria-hidden />
            Updated {formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <SheetFooter className="flex-row items-center gap-2 border-t p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
              aria-label="Delete application"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this application?</AlertDialogTitle>
              <AlertDialogDescription>
                {app.company} — {app.role} will be permanently removed from your tracker. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={() => commit()}
          disabled={!dirty}
          className="ml-auto flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 sm:flex-none"
        >
          <Save className="size-4" aria-hidden />
          Save changes
        </Button>
      </SheetFooter>
    </>
  );
}

/* ------------------------------- sheet ---------------------------------- */

export function ApplicationSheet({
  app,
  open,
  onOpenChange,
}: {
  app: JobApplication | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* key remount resets the draft when switching applications */}
        {app ? <SheetBody key={app.id} app={app} onClose={() => onOpenChange(false)} /> : null}
      </SheetContent>
    </Sheet>
  );
}
