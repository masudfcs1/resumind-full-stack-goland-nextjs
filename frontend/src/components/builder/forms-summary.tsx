"use client";

import * as React from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore, type ResumeData } from "@/lib/resume-store";
import { generateSummary, sleep } from "@/lib/mock-ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StepHeader } from "@/components/builder/builder-kit";

type Tone = "professional" | "confident" | "friendly";

const TONES: Array<{ value: Tone; label: string; blurb: string }> = [
  { value: "professional", label: "Professional", blurb: "Polished & neutral" },
  { value: "confident", label: "Confident", blurb: "Bold, achievement-first" },
  { value: "friendly", label: "Friendly", blurb: "Warm & human" },
];

const MAX_CHARS = 600;

export default function FormSummary({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const [tone, setTone] = React.useState<Tone>("professional");
  const [loading, setLoading] = React.useState(false);

  async function handleGenerate() {
    setLoading(true);
    await sleep(1000);
    const fresh = useResumeStore.getState().resumes.find((r) => r.id === resume.id);
    const text = generateSummary({
      jobTitle: fresh?.personal.jobTitle.trim() || "Professional",
      skills: fresh?.skills.map((s) => s.name) ?? [],
      tone,
    });
    updateResume(resume.id, { summary: text });
    setLoading(false);
    toast.success("Summary generated — tweak it to taste", {
      description: "Hit the button again for a different angle.",
    });
  }

  const over = resume.summary.length > MAX_CHARS;

  return (
    <section aria-label="Professional summary step">
      <StepHeader
        icon={Sparkles}
        title="Professional summary"
        description="A 2–3 sentence hook that sits at the top of your resume."
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-medium text-foreground/80">Tone of voice</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger aria-label="Summary tone" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-baseline gap-2">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-[11px] text-muted-foreground">{t.blurb}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Uses your role + skills to draft a tailored hook.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="summary-text" className="text-[12.5px] font-medium text-foreground/80">
              Summary
            </Label>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                over ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              )}
            >
              {resume.summary.length} / {MAX_CHARS} characters
            </span>
          </div>
          <Textarea
            id="summary-text"
            rows={4}
            value={resume.summary}
            disabled={loading}
            placeholder="Senior Frontend Engineer with 7+ years of experience architecting high-performance web applications…"
            onChange={(e) => updateResume(resume.id, { summary: e.target.value })}
            className="min-h-[110px] resize-y leading-relaxed"
          />
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="lg"
            disabled={loading}
            onClick={handleGenerate}
            className="h-11 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Wand2 className="h-4 w-4" aria-hidden />
            )}
            {loading ? "Writing your summary…" : resume.summary ? "✨ Regenerate with AI" : "✨ Generate with AI"}
          </Button>
          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground" aria-live="polite">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              Drafting {tone} copy…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
