"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import {
  ACCENT_PRESETS,
  TEMPLATE_META,
  useResumeStore,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, StepHeader } from "@/components/builder/builder-kit";

/* ============================== Abstract template thumbnails ============================== */

function TemplateThumb({ id, accent }: { id: TemplateId; accent: string }) {
  const bar = "h-1 rounded-full bg-zinc-300 dark:bg-zinc-600";
  const faint = "h-1 rounded-full bg-zinc-200 dark:bg-zinc-700/80";

  return (
    <div className="h-24 w-full overflow-hidden rounded-lg border bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {id === "modern" && (
        <div className="flex h-full">
          <div className="h-full w-[30%]" style={{ background: accent }} />
          <div className="flex-1 space-y-1.5 p-2">
            <div className={cn(bar, "w-3/4 bg-zinc-400 dark:bg-zinc-500")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className="h-1.5 w-1/2 rounded-full" style={{ background: accent, opacity: 0.5 }} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-4/6")} />
          </div>
        </div>
      )}

      {id === "classic" && (
        <div className="flex h-full flex-col items-center px-4 py-2.5">
          <div className={cn(bar, "w-1/2 bg-zinc-400 dark:bg-zinc-500")} />
          <div className="mt-1 h-0.5 w-1/4 rounded-full" style={{ background: accent }} />
          <div className="mt-2 w-full space-y-1.5">
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-4/5")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-3/5")} />
          </div>
        </div>
      )}

      {id === "minimal" && (
        <div className="flex h-full flex-col px-4 py-3">
          <div className={cn(bar, "w-2/5 bg-zinc-400 dark:bg-zinc-500")} />
          <div className="mt-1 h-0.5 w-1/5 rounded-full" style={{ background: accent }} />
          <div className="mt-3 space-y-2.5">
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className="mt-1 h-1 w-1/3 rounded-full" style={{ background: accent, opacity: 0.55 }} />
            <div className={cn(faint, "w-3/4")} />
          </div>
        </div>
      )}

      {id === "creative" && (
        <div className="flex h-full flex-col">
          <div className="h-[34%] w-full" style={{ background: accent }} />
          <div className="flex-1 space-y-1.5 p-2">
            <div className="flex gap-1">
              {[0.35, 0.45, 0.3].map((w, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full"
                  style={{ width: `${w * 100}%`, background: accent, opacity: 0.4 }}
                />
              ))}
            </div>
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-4/6")} />
          </div>
        </div>
      )}

      {id === "executive" && (
        <div className="flex h-full flex-col">
          <div className="flex h-[30%] w-full items-center gap-1.5 bg-zinc-800 px-2 dark:bg-zinc-950">
            <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
            <div className="h-1 w-1/3 rounded-full bg-zinc-500" />
          </div>
          <div className="h-1 w-full" style={{ background: accent }} />
          <div className="flex-1 space-y-1.5 p-2">
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-3/5")} />
          </div>
        </div>
      )}

      {id === "technical" && (
        <div className="flex h-full gap-2 p-2">
          {[0, 1].map((col) => (
            <div key={col} className="flex-1 space-y-1.5">
              <div className="h-1.5 w-2/3 rounded-full" style={{ background: accent, opacity: col ? 0.55 : 1 }} />
              <div className={cn(faint, "w-full")} />
              <div className={cn(faint, "w-5/6")} />
              <div className={cn(faint, "w-full")} />
              <div className={cn(faint, "w-4/6")} />
              <div className={cn(faint, "w-full")} />
            </div>
          ))}
        </div>
      )}

      {id === "cambridge" && (
        <div className="flex h-full flex-col items-center px-4 py-2.5">
          <div className={cn(bar, "w-1/2 bg-zinc-400 dark:bg-zinc-500")} />
          <div className={cn(faint, "mt-1 w-1/3 italic")} />
          <div className="mt-2 flex w-full items-center gap-1">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            <span className={cn("h-1 w-1/4 rounded-full", "bg-zinc-300 dark:bg-zinc-600")} />
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="mt-2 w-full space-y-1.5">
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-3/5")} />
          </div>
        </div>
      )}

      {id === "impact" && (
        <div className="flex h-full">
          <div className="flex h-full w-[30%] flex-col items-center gap-1 bg-zinc-800 px-1.5 pt-2 dark:bg-zinc-950">
            <span className="h-2.5 w-2.5 rounded-md" style={{ background: accent }} />
            <span className="h-1 w-full rounded-full bg-zinc-500" />
            <span className="h-0.5 w-4/5 rounded-full" style={{ background: accent, opacity: 0.6 }} />
            <span className="h-0.5 w-3/5 rounded-full" style={{ background: accent, opacity: 0.4 }} />
          </div>
          <div className="flex-1 space-y-1.5 p-2">
            <div className={cn(bar, "w-2/3 bg-zinc-400 dark:bg-zinc-500")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-4/6")} />
          </div>
        </div>
      )}

      {id === "summit" && (
        <div className="flex h-full flex-col">
          <div className="flex h-[32%] w-full items-center gap-1.5 px-2" style={{ background: `linear-gradient(115deg, ${accent}, ${accent}b3)` }}>
            <div className="h-1 w-1/3 rounded-full bg-white/80" />
          </div>
          <div className="flex-1 space-y-1.5 p-2">
            <div className={cn(bar, "w-1/2 bg-zinc-400 dark:bg-zinc-500")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-3/5")} />
          </div>
        </div>
      )}

      {id === "timeline" && (
        <div className="relative h-full space-y-1.5 py-2 pl-5 pr-2">
          <span className="absolute left-2.5 top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
          <span className="absolute left-[7px] top-2.5 size-[5px] rounded-full" style={{ background: accent }} aria-hidden />
          <span className="absolute left-[7px] top-1/2 size-[5px] rounded-full" style={{ background: accent }} aria-hidden />
          <span className="absolute left-[7px] bottom-2.5 size-[5px] rounded-full" style={{ background: accent }} aria-hidden />
          <div className={cn(bar, "w-1/2 bg-zinc-400 dark:bg-zinc-500")} />
          <div className={cn(faint, "w-full")} />
          <div className={cn(faint, "w-5/6")} />
          <div className={cn(faint, "w-full")} />
          <div className={cn(faint, "w-4/6")} />
        </div>
      )}

      {id === "vertex" && (
        <div className="h-full space-y-1.5 px-3 py-2.5">
          <div className={cn(bar, "w-1/2 bg-zinc-500 dark:bg-zinc-400")} />
          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700" />
          <div className={cn(faint, "w-full")} />
          <div className={cn(faint, "w-5/6")} />
          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700" />
          <div className={cn(faint, "w-full")} />
          <div className={cn(faint, "w-4/6")} />
          <div className={cn(faint, "w-5/6")} />
        </div>
      )}

      {id === "prestige" && (
        <div className="h-full px-3 py-2.5">
          <div className="flex items-end justify-between">
            <div className={cn(bar, "w-2/5 bg-zinc-500 dark:bg-zinc-400")} />
            <div className="space-y-0.5 text-right">
              <div className={cn(faint, "ml-auto w-8")} />
              <div className={cn(faint, "ml-auto w-6")} />
            </div>
          </div>
          <div className="mt-1.5 h-[3px] w-full rounded-sm bg-zinc-700 dark:bg-zinc-500" />
          <div className="mt-2 space-y-1.5">
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-5/6")} />
            <div className={cn(faint, "w-full")} />
            <div className={cn(faint, "w-3/5")} />
          </div>
        </div>
      )}

      {id === "meridian" && (
        <div className="h-full space-y-2 px-3 py-2.5">
          <div className="h-[3px] w-6 rounded-full" style={{ background: accent }} />
          <div className={cn(bar, "w-1/2 bg-zinc-400 dark:bg-zinc-500")} />
          {["w-full", "w-5/6", "w-full", "w-4/6"].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-1.5 w-[3px] rounded-full" style={{ background: accent, opacity: 0.55 }} />
              <div className={cn(faint, w)} />
            </div>
          ))}
        </div>
      )}

      {id === "compact" && (
        <div className="h-full space-y-1 px-3 py-2.5">
          <div className="flex items-baseline justify-between">
            <div className={cn(bar, "w-2/5 bg-zinc-500 dark:bg-zinc-400")} />
            <div className={cn(faint, "w-1/5")} />
          </div>
          <div className="h-px w-full" style={{ background: accent, opacity: 0.6 }} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={cn(faint, i % 3 === 2 ? "w-4/5" : "w-full")} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== Design step ============================== */

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export default function FormDesign({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const update = (patch: Partial<ResumeData>) => updateResume(resume.id, patch);
  const [hex, setHex] = React.useState(resume.accent);

  const validHex = HEX_RE.test(hex);

  function applyHex(raw: string) {
    setHex(raw);
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) update({ accent: normalized.toLowerCase() });
  }

  function pickPreset(value: string) {
    setHex(value);
    update({ accent: value });
  }

  return (
    <section aria-label="Design step">
      <StepHeader
        icon={Palette}
        title="Design"
        description="Template, accent color, and title — every change hits the live preview instantly."
      />

      <div className="space-y-8">
        {/* Title */}
        <Field
          label="Resume title"
          hint="Private — it only names this resume in your dashboard."
        >
          <Input
            value={resume.title}
            placeholder="Senior Frontend Engineer — Google"
            autoComplete="off"
            onChange={(e) => update({ title: e.target.value })}
          />
        </Field>

        {/* Template picker */}
        <div className="space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Template
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Resume template">
            {(Object.keys(TEMPLATE_META) as TemplateId[]).map((id) => {
              const meta = TEMPLATE_META[id];
              const selected = resume.template === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ template: id })}
                  className={cn(
                    "group relative rounded-xl border p-2 text-left transition-all",
                    selected
                      ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30"
                      : "hover:border-emerald-500/40 hover:bg-muted/40"
                  )}
                >
                  <TemplateThumb id={id} accent={resume.accent} />
                  <div className="px-1 pb-0.5 pt-2">
                    <p className="flex items-center gap-1 text-[12.5px] font-semibold">
                      {meta.name}
                      {selected && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {meta.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent color */}
        <div className="space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Accent color
          </h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_PRESETS.map((preset) => {
              const selected = resume.accent.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  aria-label={`${preset.name} accent`}
                  aria-pressed={selected}
                  onClick={() => pickPreset(preset.value)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform hover:scale-110",
                    selected
                      ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
                      : "ring-1 ring-black/10 dark:ring-white/15"
                  )}
                  style={{ background: preset.value }}
                />
              );
            })}

            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

            <div className="flex items-center gap-2">
              <span
                className="h-7 w-7 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                style={{ background: validHex ? (hex.startsWith("#") ? hex : `#${hex}`) : "#e4e4e7" }}
                aria-hidden
              />
              <Input
                value={hex}
                onChange={(e) => applyHex(e.target.value)}
                placeholder="#10b981"
                aria-label="Custom accent hex color"
                aria-invalid={!validHex}
                maxLength={7}
                autoComplete="off"
                className={cn(
                  "h-8 w-28 font-mono text-xs uppercase",
                  !validHex && "border-amber-500/60 focus-visible:ring-amber-500/30"
                )}
              />
            </div>
          </div>
          {!validHex && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Enter a 6-digit hex color, e.g. #10b981.
            </p>
          )}
        </div>

        {/* Live note */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live preview:</span>{" "}
          the page on the right updates with every keystroke. Try a template + accent combo, then hit
          Export PDF.
        </div>
      </div>
    </section>
  );
}
