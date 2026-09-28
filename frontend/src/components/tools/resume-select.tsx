"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResumeStore } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

interface ResumeSelectProps {
  value: string;
  onValueChange: (id: string) => void;
  /** Accessible name for the trigger button. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Resume picker shared by the tool pages. Hydration-gated: renders a
 * skeleton until mounted so persisted store state never mismatches SSR.
 */
export function ResumeSelect({
  value,
  onValueChange,
  ariaLabel = "Select resume",
  className,
}: ResumeSelectProps) {
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn("h-9 w-full animate-pulse rounded-md bg-muted sm:w-60", className)}
      />
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full sm:w-60", className)}
      >
        <FileText
          className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        <SelectValue placeholder={resumes.length ? "Choose a resume" : "No resumes yet"} />
      </SelectTrigger>
      <SelectContent>
        {resumes.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No resumes yet — create one in Resume Studio.
          </div>
        ) : (
          resumes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
