"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ListChecks,
  MessageSquareQuote,
  RotateCcw,
  Volume1,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { staggerItem } from "@/components/tools/variants";

/* ============================== Checklist ============================== */

const CHECKLIST_KEY = "resumeforge-interview-checklist";

const CHECKLIST_ITEMS = [
  { id: "research", label: "Research the company (product, news, team)" },
  { id: "questions", label: "Prepare 2 questions to ask them" },
  { id: "portfolio", label: "Portfolio / work samples ready to show" },
  { id: "setup", label: "Test camera, mic & interview link" },
  { id: "stories", label: "Rehearse 3 STAR stories out loud" },
] as const;

type CheckState = Record<string, boolean>;

function useInterviewChecklist() {
  const [checks, setChecks] = React.useState<CheckState>({});
  const loaded = React.useRef(false);

  // Load once on mount.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecks(JSON.parse(raw) as CheckState);
    } catch {
      /* corrupted storage — start fresh */
    }
    loaded.current = true;
  }, []);

  // Persist on every change after hydration.
  React.useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checks));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [checks]);

  return [checks, setChecks] as const;
}

/* ============================== Do say / Don't say ============================== */

const DO_SAY = [
  "Led, shipped, delivered",
  "Quantified — numbers win",
  "\u201cI drove\u201d, \u201cI owned\u201d",
  "Impact and outcome first",
  "\u201cHere is what I learned\u201d",
];

const DONT_SAY = [
  "\u201cWe\u201d for everything — be specific",
  "Filler apologies: \u201csorry, I\u2019m nervous\u201d",
  "\u201cUm\u201d, \u201clike\u201d, \u201csort of\u201d",
  "Blaming past teams or managers",
  "Jargon without context",
];

/* ============================== Tips panel ============================== */

/**
 * Right-column / bottom support panel: interview-day checklist persisted to
 * localStorage, plus a "Do say / Don't say" phrase table.
 */
export function TipsPanel({ className }: { className?: string }) {
  const [checks, setChecks] = useInterviewChecklist();
  const doneCount = CHECKLIST_ITEMS.filter((item) => checks[item.id]).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <motion.section
      variants={staggerItem}
      aria-label="Interview tips"
      className={cn("grid gap-6 lg:grid-cols-2", className)}
    >
      {/* -------- Interview day checklist -------- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ListChecks className="size-4" aria-hidden="true" />
            </span>
            Interview day checklist
          </CardTitle>
          <CardDescription>
            Saved to this browser — tick items as you get ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Checklist progress"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {doneCount}/{CHECKLIST_ITEMS.length}
            </span>
          </div>

          <ul className="space-y-1">
            {CHECKLIST_ITEMS.map((item) => {
              const done = Boolean(checks[item.id]);
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60">
                    <Checkbox
                      checked={done}
                      onCheckedChange={(v) =>
                        setChecks((c) => ({ ...c, [item.id]: v === true }))
                      }
                      aria-label={item.label}
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        done && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() =>
                setChecks(Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.id, false])))
              }
              disabled={doneCount === 0}
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* -------- Do say / Don't say -------- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <MessageSquareQuote className="size-4" aria-hidden="true" />
            </span>
            Do say / Don&apos;t say
          </CardTitle>
          <CardDescription>
            Small wording swaps that make answers sound senior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Do say
              </p>
              <ul className="mt-3 space-y-2">
                {DO_SAY.map((phrase) => (
                  <li key={phrase} className="flex items-start gap-2 text-sm">
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <XCircle className="size-3.5" aria-hidden="true" />
                Don&apos;t say
              </p>
              <ul className="mt-3 space-y-2">
                {DONT_SAY.map((phrase) => (
                  <li key={phrase} className="flex items-start gap-2 text-sm">
                    <X
                      className="mt-0.5 size-3.5 shrink-0 text-rose-600 dark:text-rose-400"
                      aria-hidden="true"
                    />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Volume1 className="size-3.5" aria-hidden="true" />
            Record yourself once — filler words are easier to hear than to notice.
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
}
