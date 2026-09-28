"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, Info, Loader2, ScanSearch, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ResumeSelect } from "@/components/tools/resume-select";

export const JD_MIN_CHARS = 41; // keep in sync with mock-ai's "> 40" JD threshold

interface MatchInputProps {
  jd: string;
  onJdChange: (value: string) => void;
  analyzing: boolean;
  resumeId: string;
  onResumeChange: (id: string) => void;
  hasResume: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onSample: () => void;
}

/**
 * Input card: large JD textarea with character counter + short-JD hint,
 * a scanning shimmer while analyzing, and the resume/sample/analyze row.
 */
export function MatchInput({
  jd,
  onJdChange,
  analyzing,
  resumeId,
  onResumeChange,
  hasResume,
  canAnalyze,
  onAnalyze,
  onSample,
}: MatchInputProps) {
  const charCount = jd.length;
  const trimmed = jd.trim().length;
  const tooShort = trimmed > 0 && trimmed < JD_MIN_CHARS;
  const ready = trimmed >= JD_MIN_CHARS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <FileText
            className="size-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Job description
        </CardTitle>
        <CardDescription>
          Paste the posting you are targeting — every word the recruiter (and
          their bot) scans for is a chance to match.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            value={jd}
            onChange={(e) => onJdChange(e.target.value)}
            placeholder="Paste the full job description here — responsibilities, requirements, the works…"
            aria-label="Job description"
            aria-busy={analyzing}
            className="min-h-[140px] resize-y pb-8"
          />
          <p
            className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-muted-foreground/80"
            aria-live="off"
          >
            {charCount} {charCount === 1 ? "character" : "characters"}
          </p>
          {analyzing ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-emerald-500/30 bg-background/40"
            >
              <motion.div
                className="absolute inset-x-0 h-14 bg-gradient-to-b from-transparent via-emerald-400/35 to-transparent"
                initial={{ top: "-18%" }}
                animate={{ top: "112%" }}
                transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex min-h-5 flex-wrap items-center justify-between gap-2">
          {tooShort ? (
            <p
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
              role="status"
            >
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              Paste the full job description for an accurate match
            </p>
          ) : ready ? (
            <p
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
              role="status"
            >
              <ScanSearch className="size-3.5 shrink-0" aria-hidden="true" />
              Looking good — ready to analyze
            </p>
          ) : (
            <span />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
          <ResumeSelect
            value={resumeId}
            onValueChange={onResumeChange}
            ariaLabel="Resume to match"
            className="w-full sm:w-60"
          />
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={onSample}
              disabled={analyzing}
              className="text-muted-foreground"
              aria-label="Load a sample job description"
            >
              <Wand2 className="size-4" aria-hidden="true" />
              Load a sample job description
            </Button>
            <Button
              onClick={onAnalyze}
              disabled={!canAnalyze || analyzing || !hasResume}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
              aria-label="Analyze match"
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch className="size-4" aria-hidden="true" />
              )}
              {analyzing ? "Analyzing…" : "Analyze match"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
