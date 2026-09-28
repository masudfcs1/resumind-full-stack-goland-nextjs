"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, History, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { staggerItem } from "@/components/tools/variants";
import type { MatchHistoryEntry } from "./history";
import { cn } from "@/lib/utils";

/** Dot + text color tone for a history score, mirroring the grade bands. */
function toneForScore(score: number): { dot: string; text: string } {
  if (score >= 85)
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  if (score >= 70)
    return { dot: "bg-teal-500", text: "text-teal-700 dark:text-teal-400" };
  if (score >= 50)
    return { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" };
  return { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400" };
}

interface MatchHistoryProps {
  entries: MatchHistoryEntry[];
  onRestore: (entry: MatchHistoryEntry) => void;
  onClear: () => void;
}

/**
 * Recent matches: the last 5 analyses, newest first. Clicking a row
 * restores that JD + resume and re-runs the analysis instantly.
 */
export function MatchHistory({ entries, onRestore, onClear }: MatchHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <motion.section variants={staggerItem} aria-label="Recent matches">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <History
                className="size-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Recent matches
            </CardTitle>
            <CardDescription>
              Your last {entries.length} analysis{entries.length === 1 ? "" : "s"}{" "}
              — click one to restore it.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Clear recent matches"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {entries.map((entry) => {
              const tone = toneForScore(entry.score);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onRestore(entry)}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Restore match analysis for ${entry.jdBrief} — score ${entry.score} of 100`}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 shrink-0 rounded-full", tone.dot)}
                    />
                    <span
                      className={cn(
                        "w-7 shrink-0 text-sm font-bold tabular-nums",
                        tone.text
                      )}
                    >
                      {entry.score}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {entry.jdBrief}
                    </span>
                    <Badge
                      variant="outline"
                      className="hidden max-w-[160px] shrink-0 truncate font-normal text-muted-foreground sm:inline-flex"
                    >
                      {entry.resumeTitle}
                    </Badge>
                    <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground md:inline">
                      {formatDistanceToNow(entry.at, { addSuffix: true })}
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.section>
  );
}
