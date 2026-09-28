"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Keyboard,
  NotebookPen,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Flashcard } from "./flashcard";
import type { PracticeQuestion, StarAnswer } from "./question-bank";

const EMPTY_NOTE: StarAnswer = { situation: "", task: "", action: "", result: "" };

const STAR_FIELDS = [
  { key: "situation", letter: "S", label: "Situation", chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", placeholder: "Where and when — set the scene in one sentence…" },
  { key: "task", letter: "T", label: "Task", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300", placeholder: "What were you responsible for? What was the goal?" },
  { key: "action", letter: "A", label: "Action", chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300", placeholder: "What did YOU do? Steps, decisions, trade-offs…" },
  { key: "result", letter: "R", label: "Result", chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300", placeholder: "Outcome with a number — and what you learned…" },
] as const;

export interface FocusModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: PracticeQuestion[];
  index: number;
  onIndexChange: (index: number) => void;
  practicedIds: ReadonlySet<string>;
  onPracticed: (id: string) => void;
  notes: Record<string, StarAnswer>;
  onNotesChange: (id: string, note: StarAnswer) => void;
}

/**
 * One-card-at-a-time practice dialog: large flip card, prev/next navigation
 * with keyboard support (←/→ navigate, Space flips, Esc closes via Dialog),
 * progress dots, and a per-question STAR notes builder with copy-to-clipboard.
 */
export function FocusMode({
  open,
  onOpenChange,
  questions,
  index,
  onIndexChange,
  practicedIds,
  onPracticed,
  notes,
  onNotesChange,
}: FocusModeProps) {
  const total = questions.length;
  const q = questions[index];
  const [flipped, setFlipped] = React.useState(false);

  // Reset the flip whenever the active question changes.
  React.useEffect(() => {
    setFlipped(false);
  }, [index]);

  const goPrev = React.useCallback(() => {
    onIndexChange(index > 0 ? index - 1 : index);
  }, [index, onIndexChange]);

  const goNext = React.useCallback(() => {
    onIndexChange(index < total - 1 ? index + 1 : index);
  }, [index, onIndexChange, total]);

  // Global keyboard shortcuts (ignored while typing in the STAR notes).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => {
          if (!f && q) onPracticed(q.id);
          return !f;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext, q, onPracticed]);

  const note = (q && notes[q.id]) || EMPTY_NOTE;

  const copyNotes = async () => {
    if (!q) return;
    const n = notes[q.id] ?? EMPTY_NOTE;
    const text = [
      `Q: ${q.text}`,
      `SITUATION: ${n.situation.trim() || "—"}`,
      `TASK: ${n.task.trim() || "—"}`,
      `ACTION: ${n.action.trim() || "—"}`,
      `RESULT: ${n.result.trim() || "—"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("STAR notes copied to clipboard");
    } catch {
      toast.error("Could not access the clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-thin max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            Focus Mode
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {total > 0 ? `Question ${index + 1} of ${total}` : "No questions"}
            </span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Keyboard className="size-3.5" aria-hidden="true" />
            One card at a time — Arrow keys navigate, Space flips, Esc closes.
          </DialogDescription>
        </DialogHeader>

        {q ? (
          <>
            <p aria-live="polite" className="sr-only">
              Question {index + 1} of {total}
            </p>

            <Flashcard
              q={q}
              index={index}
              size="focus"
              flipped={flipped}
              onFlippedChange={(next) => {
                setFlipped(next);
                if (next) onPracticed(q.id);
              }}
              onPracticed={onPracticed}
              practiced={practicedIds.has(q.id)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous question"
                disabled={index === 0}
                onClick={goPrev}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {questions.map((qq, i) => (
                  <button
                    key={qq.id}
                    type="button"
                    aria-label={`Go to question ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => onIndexChange(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200",
                      i === index
                        ? "w-6 bg-emerald-500"
                        : practicedIds.has(qq.id)
                          ? "w-2 bg-emerald-500/50 hover:bg-emerald-500/70"
                          : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/45"
                    )}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next question"
                disabled={index >= total - 1}
                onClick={goNext}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <Separator />

            {/* STAR notes builder */}
            <section aria-label="STAR notes">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <NotebookPen
                    className="size-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  STAR notes — draft your answer
                </h3>
                <Button variant="outline" size="sm" onClick={copyNotes}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copy notes
                </Button>
              </div>
              <div className="space-y-2.5">
                {STAR_FIELDS.map((field) => (
                  <div key={field.key} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                        field.chip
                      )}
                    >
                      {field.letter}
                    </span>
                    <div className="flex-1">
                      <label
                        htmlFor={`star-${q.id}-${field.key}`}
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {field.label}
                      </label>
                      <Textarea
                        id={`star-${q.id}-${field.key}`}
                        rows={2}
                        className="resize-none"
                        value={note[field.key]}
                        placeholder={field.placeholder}
                        aria-label={`${field.label} notes`}
                        onChange={(e) =>
                          onNotesChange(q.id, { ...note, [field.key]: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Notes are kept per question for this session — paste them into your
                notes app after practicing.
              </p>
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
