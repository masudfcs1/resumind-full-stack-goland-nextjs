"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { uid, useResumeStore, type ResumeData, type SkillItem } from "@/lib/resume-store";
import { suggestSkills, sleep } from "@/lib/mock-ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyHint, StepHeader } from "@/components/builder/builder-kit";

function LevelDots({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-[3px]", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn("h-1.5 w-1.5 rounded-full", n <= level ? "bg-emerald-500" : "bg-muted-foreground/25")}
        />
      ))}
    </span>
  );
}

function SkillChip({
  skill,
  index,
  onPatch,
  onRemove,
}: {
  skill: SkillItem;
  index: number;
  onPatch: (index: number, patch: Partial<SkillItem>) => void;
  onRemove: (index: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Edit level of ${skill.name}`}
          className="flex items-center gap-2 rounded-full border bg-background py-1.5 pl-3 pr-2.5 text-xs font-medium shadow-xs transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5"
        >
          <span className="max-w-[160px] truncate">{skill.name}</span>
          <LevelDots level={skill.level} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 rounded-xl p-3">
        <p className="mb-2 truncate text-[13px] font-semibold">{skill.name}</p>
        <div className="mb-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Set level ${n} of 5`}
              aria-pressed={skill.level === n}
              onClick={() => onPatch(index, { level: n })}
              className={cn(
                "h-6 flex-1 rounded-md transition-all hover:scale-105",
                n <= skill.level ? "bg-emerald-500" : "bg-muted hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            Level {skill.level} / 5
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              onRemove(index);
              setOpen(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FormSkills({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const items = resume.skills;
  const commit = (next: SkillItem[]) => updateResume(resume.id, { skills: next });

  const [draft, setDraft] = React.useState("");
  const [suggesting, setSuggesting] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);

  function addSkill(name: string, level = 4) {
    const clean = name.trim();
    if (!clean) return;
    const fresh = useResumeStore.getState().resumes.find((r) => r.id === resume.id);
    if (fresh?.skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      toast.error("That skill is already on your resume");
      return;
    }
    commit([...(fresh?.skills ?? items), { id: uid(), name: clean, level }]);
  }

  async function suggest() {
    const fresh = useResumeStore.getState().resumes.find((r) => r.id === resume.id);
    const jobTitle = fresh?.personal.jobTitle.trim();
    if (!jobTitle) {
      toast.error("Add your target role first", {
        description: "The AI suggests skills based on your job title in the Personal step.",
      });
      return;
    }
    setSuggesting(true);
    await sleep(800);
    const existing = new Set((fresh?.skills ?? []).map((s) => s.name.toLowerCase()));
    const list = suggestSkills(jobTitle).filter((s) => !existing.has(s.toLowerCase()));
    setSuggestions(list);
    setSuggesting(false);
    if (list.length === 0) {
      toast.info("You already have every skill I'd suggest — nice!");
    }
  }

  function addSuggestion(name: string) {
    addSkill(name, 4);
    setSuggestions((prev) => (prev ? prev.filter((s) => s !== name) : prev));
    toast.success(`${name} added at level 4`);
  }

  return (
    <section aria-label="Skills step">
      <StepHeader
        icon={Wrench}
        title="Skills"
        description="Click a chip to tune its level — the dots show up on your resume."
      />

      <div className="space-y-5">
        {items.length === 0 && suggestions === null ? (
          <EmptyHint
            icon={Wrench}
            title="No skills yet"
            body="Add skills manually below, or let the AI suggest a tailored set for your target role."
          />
        ) : (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Your skills">
            {items.map((skill, index) => (
              <div key={skill.id} role="listitem">
                <SkillChip
                  skill={skill}
                  index={index}
                  onPatch={(i, patch) =>
                    commit(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
                  }
                  onRemove={(i) => commit(items.filter((_, idx) => idx !== i))}
                />
              </div>
            ))}
          </div>
        )}

        {/* AI suggestions */}
        {(suggesting || (suggestions && suggestions.length > 0)) && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Suggested for{" "}
              {resume.personal.jobTitle.trim() || "your role"}
            </p>
            {suggesting ? (
              <div className="flex flex-wrap gap-2" aria-live="polite" aria-label="Loading suggestions">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-7 w-20 animate-pulse rounded-full bg-emerald-500/15"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {suggestions?.map((s) => (
                    <motion.button
                      key={s}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => addSuggestion(s)}
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                    >
                      + {s}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            disabled={suggesting}
            onClick={suggest}
            className="h-10 w-full gap-2 border-emerald-500/30 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 sm:w-auto"
          >
            {suggesting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden />
            )}
            ✨ Suggest skills for my role
          </Button>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addSkill(draft);
              setDraft("");
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a skill manually (e.g. GraphQL)"
              aria-label="Add a skill manually"
              autoComplete="off"
              className="h-10 flex-1"
            />
            <Button type="submit" variant="outline" className="h-10 shrink-0 gap-1.5" disabled={!draft.trim()}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
