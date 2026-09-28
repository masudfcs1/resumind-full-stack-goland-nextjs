"use client";

import * as React from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Flash "Saving…" for 400ms after every store update, then "All changes saved". */
function useSaveIndicator(updatedAt: number | undefined): boolean {
  const [saving, setSaving] = React.useState(false);
  const initial = React.useRef(true);

  React.useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    if (updatedAt === undefined) return;
    setSaving(true);
    const t = window.setTimeout(() => setSaving(false), 400);
    return () => window.clearTimeout(t);
  }, [updatedAt]);

  return saving;
}

function SaveIndicator({ saving }: { saving: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-1" role="status" aria-live="polite">
      {saving ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-amber-500" aria-hidden />
      ) : (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <span
        className={cn(
          "text-[11px] font-medium",
          saving ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}
      >
        {saving ? "Saving…" : "All changes saved"}
      </span>
    </div>
  );
}

export function ResumeBar({ onCreated }: { onCreated?: () => void }) {
  const resumes = useResumeStore((s) => s.resumes);
  const activeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const createResume = useResumeStore((s) => s.createResume);
  const active = resumes.find((r) => r.id === activeId);
  const saving = useSaveIndicator(active?.updatedAt);

  function handleNew() {
    createResume();
    onCreated?.();
    toast.success("New resume created", {
      description: "Start with your personal details — everything autosaves.",
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b p-3">
      <div className="flex items-center gap-2">
        <Select value={activeId} onValueChange={setActive}>
          <SelectTrigger
            aria-label="Select resume to edit"
            className="min-w-0 flex-1 gap-1.5 font-medium"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
            <SelectValue placeholder="Select resume" />
          </SelectTrigger>
          <SelectContent align="start">
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id} className="max-w-[280px]">
                <span className="truncate">{r.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 shrink-0"
          aria-label="Create new resume"
          onClick={handleNew}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <SaveIndicator saving={saving} />
    </div>
  );
}
