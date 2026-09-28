"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Plus } from "lucide-react";
import type { ResumeData } from "@/lib/resume-store";
import { useResumeStore } from "@/lib/resume-store";
import { atsAnalyze } from "@/lib/mock-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeActionsMenu, ResumeThumb } from "./resume-card";
import { ScoreRing } from "./mini-charts";

function RecentRow({ resume, index }: { resume: ResumeData; index: number }) {
  const router = useRouter();
  const setActive = useResumeStore((s) => s.setActive);
  const score = atsAnalyze(resume).score;

  const open = () => {
    setActive(resume.id);
    router.push("/dashboard/builder");
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted/60"
    >
      <button
        type="button"
        onClick={open}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${resume.title} in the Resume Studio`}
      >
        <ResumeThumb resume={resume} scale={0.076} className="shrink-0" />
        <span className="min-w-0 block">
          <span className="block truncate text-[13.5px] font-semibold tracking-tight">
            {resume.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
            {resume.personal.jobTitle || "No job title yet"} · Edited{" "}
            {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
          </span>
        </span>
      </button>
      <ScoreRing score={score} size={40} strokeWidth={4} className="hidden shrink-0 sm:block" />
      <ResumeActionsMenu resume={resume} />
    </motion.li>
  );
}

export function RecentResumesCard({ resumes }: { resumes: ResumeData[] }) {
  const recent = React.useMemo(
    () => [...resumes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [resumes]
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">Recent resumes</CardTitle>
        <Link
          href="/dashboard/resumes"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">No resumes yet.</p>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
            >
              <Link href="/dashboard/resumes">
                <Plus className="h-4 w-4" /> Create your first resume
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {recent.map((r, i) => (
              <RecentRow key={r.id} resume={r} index={i} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
