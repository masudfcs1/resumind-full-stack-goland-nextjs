"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  FlipHorizontal,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  DIFFICULTY_META,
  type Difficulty,
  type PracticeQuestion,
} from "./question-bank";

/* ============================== Difficulty dots ============================== */

/** 1–3 colored dots (emerald / amber / rose) encoding difficulty. */
export function DifficultyDots({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${meta.label} difficulty`}
      title={`${meta.label} difficulty`}
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full transition-colors",
            n <= meta.level ? meta.dot : "bg-muted-foreground/20"
          )}
        />
      ))}
    </span>
  );
}

/* ============================== STAR row ============================== */

const STAR_CHIPS = {
  situation: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  task: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  action: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  result: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
} as const;

function StarRow({
  letter,
  label,
  text,
  tone,
}: {
  letter: string;
  label: string;
  text: string;
  tone: keyof typeof STAR_CHIPS;
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
          STAR_CHIPS[tone]
        )}
      >
        {letter}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/* ============================== Flashcard ============================== */

export interface FlashcardProps {
  q: PracticeQuestion;
  /** 1-based question number shown on the card. */
  index?: number;
  /** Grid cards are compact; focus cards are larger. */
  size?: "grid" | "focus";
  practiced?: boolean;
  /** Controlled flip state (used by Focus Mode keyboard handling). */
  flipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** Fires once when the card is flipped to its answer. */
  onPracticed?: (id: string) => void;
  className?: string;
}

/**
 * 3D flip flashcard: question on the front, STAR model answer + tips on the
 * back. Click / Enter / Space toggles. Supports controlled or uncontrolled
 * flip state.
 */
export function Flashcard({
  q,
  index = 0,
  size = "grid",
  practiced = false,
  flipped: flippedProp,
  onFlippedChange,
  onPracticed,
  className,
}: FlashcardProps) {
  const [internalFlipped, setInternalFlipped] = React.useState(false);
  const isControlled = flippedProp !== undefined;
  const flipped = isControlled ? flippedProp : internalFlipped;

  const toggle = React.useCallback(() => {
    const next = !flipped;
    if (isControlled) onFlippedChange?.(next);
    else setInternalFlipped(next);
    if (next) onPracticed?.(q.id);
  }, [flipped, isControlled, onFlippedChange, onPracticed, q.id]);

  const meta = CATEGORY_META[q.category];
  const CategoryIcon = meta.icon;
  const isFocus = size === "focus";

  return (
    <div className={cn("h-full [perspective:1600px]", className)}>
      <motion.div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`Question ${index + 1}${
          practiced ? " (practiced)" : ""
        }: ${q.text}. Activate to flip and reveal the model answer.`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }
        }}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className={cn(
          "relative h-full cursor-pointer rounded-2xl outline-none transition-shadow [transform-style:preserve-3d]",
          "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:shadow-xl hover:shadow-emerald-500/10",
          isFocus ? "min-h-[400px]" : "min-h-[350px]"
        )}
      >
        {/* ============ Front — the question ============ */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col rounded-2xl border bg-card p-5 text-left shadow-sm [backface-visibility:hidden]",
            practiced && "border-emerald-500/40 ring-1 ring-emerald-500/25"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="font-display text-lg font-semibold text-muted-foreground/40"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {practiced ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check className="size-3" aria-hidden="true" />
                  Practiced
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {q.isTailored ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Tailored
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  meta.tint
                )}
              >
                <CategoryIcon className="size-3" aria-hidden="true" />
                {meta.label}
              </span>
            </div>
          </div>

          <p
            className={cn(
              "mt-5 flex-1 font-medium leading-snug",
              isFocus ? "text-xl sm:text-2xl" : "text-[15px] sm:text-base"
            )}
          >
            {q.text}
          </p>

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <DifficultyDots difficulty={q.difficulty} />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {flipped ? (
                <>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  flip back
                </>
              ) : (
                <>
                  <FlipHorizontal className="size-3.5" aria-hidden="true" />
                  flips to reveal answer
                </>
              )}
            </span>
          </div>
        </div>

        {/* ============ Back — STAR framework + tips ============ */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-card shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <Lightbulb className="size-4" aria-hidden="true" />
              Model answer framework
            </span>
            <DifficultyDots difficulty={q.difficulty} />
          </div>

          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
            <div className="space-y-3.5">
              <StarRow letter="S" label="Situation" tone="situation" text={q.resolvedStar.situation} />
              <StarRow letter="T" label="Task" tone="task" text={q.resolvedStar.task} />
              <StarRow letter="A" label="Action" tone="action" text={q.resolvedStar.action} />
              <StarRow letter="R" label="Result" tone="result" text={q.resolvedStar.result} />
            </div>

            <div className="border-t pt-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
                Quick tips
              </p>
              <ul className="space-y-1.5">
                {q.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emerald-500/70"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t px-5 py-2.5 text-xs text-muted-foreground">
            Answer in your own words — click to flip back
          </div>
        </div>
      </motion.div>
    </div>
  );
}
