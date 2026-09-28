"use client";

import { MatchBoard } from "@/components/match/match-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/lib/use-mounted";

/* ============================== Skeleton ============================== */

function MatchSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <span className="sr-only">Loading Job Match Scanner…</span>
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>
      <div className="rounded-xl border p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="mt-4 h-[140px] w-full" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 rounded-xl border p-4 sm:p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full max-w-[220px]" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-4/5" />
            <Skeleton className="h-2 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== Page ============================== */

/**
 * Job Match Scanner — paste a job description, pick a resume, get an instant
 * match verdict with keyword coverage and tailoring suggestions.
 */
export default function MatchPage() {
  const mounted = useMounted();

  return mounted ? <MatchBoard /> : <MatchSkeleton />;
}
