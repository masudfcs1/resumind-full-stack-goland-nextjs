"use client";

import { Check, Minus, Sparkles, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTAINER, Reveal, SectionHeading } from "./shared";

/* Comparison — "Why ResumeForge" head-to-head table against the two most
 * common alternatives (DIY in a word processor, generic template sites).
 *
 * Semantics: every cell renders an icon plus a visually-hidden word
 * ("Included" / "Partial" / "Not available") so screen readers get the same
 * information sighted users get from color/shape. Responsive: below md the
 * grid keeps a 640px minimum and scrolls horizontally — standard for
 * comparison tables, with all content still reachable. */

type CellState = "yes" | "partial" | "no";

const CELL: Record<
  CellState,
  { icon: LucideIcon; sr: string; cls: string }
> = {
  yes: {
    icon: Check,
    sr: "Included",
    cls: "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400 dark:ring-emerald-400/25",
  },
  partial: {
    icon: Minus,
    sr: "Partial",
    cls: "bg-muted text-muted-foreground ring-1 ring-border",
  },
  no: {
    icon: X,
    sr: "Not available",
    cls: "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 dark:text-rose-400/90 dark:ring-rose-400/20",
  },
};

const ROWS: { label: string; us: CellState; docs: CellState; sites: CellState }[] = [
  { label: "Real ATS score before you apply", us: "yes", docs: "no", sites: "partial" },
  { label: "AI rewrites every bullet with metrics", us: "yes", docs: "no", sites: "no" },
  { label: "Keyword targeting per job description", us: "yes", docs: "no", sites: "partial" },
  { label: "Recruiter-tested template library", us: "yes", docs: "partial", sites: "yes" },
  { label: "Application tracking built in", us: "yes", docs: "no", sites: "no" },
  { label: "Your data never leaves your browser", us: "yes", docs: "yes", sites: "no" },
];

const COLS = [
  { key: "docs", name: "Word / Docs", sub: "DIY from scratch" },
  { key: "sites", name: "Template sites", sub: "Static downloads" },
] as const;

function CellMark({ state }: { state: CellState }) {
  const c = CELL[state];
  const Icon = c.icon;
  return (
    <span
      role="img"
      aria-label={c.sr}
      title={c.sr}
      className={cn(
        "flex size-7 items-center justify-center rounded-full",
        c.cls
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

export default function Comparison() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Why ResumeForge"
          title={
            <>
              Everything the other options{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                can&apos;t do
              </span>
            </>
          }
          description="A side-by-side look at what you get here versus building it alone or downloading a static template."
        />

        <Reveal className="mt-12" delay={0.05}>
          <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
            <div
              role="table"
              aria-label="ResumeForge AI compared with DIY documents and template sites"
              className="min-w-[640px] overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              {/* Header row */}
              <div
                role="row"
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-b bg-muted/40"
              >
                <div role="columnheader" className="px-5 py-4 sm:px-6" />
                <div role="columnheader" className="px-3 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-bold text-white shadow-md shadow-emerald-500/25 dark:from-emerald-700 dark:to-teal-800">
                    <Sparkles className="size-3" aria-hidden />
                    ResumeForge AI
                  </span>
                </div>
                {COLS.map((c) => (
                  <div
                    key={c.key}
                    role="columnheader"
                    className="px-3 py-4 text-center"
                  >
                    <span className="block text-sm font-bold text-foreground">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {c.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Body rows */}
              {ROWS.map((row, i) => (
                <div
                  key={row.label}
                  role="row"
                  className={cn(
                    "grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center",
                    i < ROWS.length - 1 && "border-b border-border/60"
                  )}
                >
                  <div
                    role="cell"
                    className="px-5 py-3.5 text-sm font-medium text-foreground sm:px-6"
                  >
                    {row.label}
                  </div>
                  <div role="cell" className="flex justify-center bg-emerald-500/[0.04] py-3.5 dark:bg-emerald-500/[0.06]">
                    <CellMark state={row.us} />
                  </div>
                  <div role="cell" className="flex justify-center py-3.5">
                    <CellMark state={row.docs} />
                  </div>
                  <div role="cell" className="flex justify-center py-3.5">
                    <CellMark state={row.sites} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Comparison reflects commonly available capabilities of DIY word
            processors and one-time template downloads. Every ResumeForge
            feature is available on the Free plan unless noted in pricing.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
