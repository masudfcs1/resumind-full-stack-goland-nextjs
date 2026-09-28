"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ResumePreview from "@/components/resume/resume-preview";
import {
  TEMPLATE_META,
  useResumeStore,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { CONTAINER, SectionHeading } from "./shared";

/* ---------------------------------------------------------------- */

type Category = "All" | "Modern" | "Classic" | "Creative" | "ATS";

const CATEGORY_OF: Record<TemplateId, Category> = {
  modern: "Modern",
  minimal: "Modern",
  impact: "Modern",
  summit: "Modern",
  classic: "Classic",
  executive: "Classic",
  cambridge: "Classic",
  creative: "Creative",
  technical: "Creative",
  timeline: "Creative",
  vertex: "ATS",
  prestige: "ATS",
  meridian: "ATS",
  compact: "ATS",
};

/** Round-15 additions — the ATS-first family, surfaced with a "New" badge. */
const NEW_TEMPLATES = new Set<TemplateId>(["vertex", "prestige", "meridian", "compact"]);

const SHOWCASE: TemplateId[] = [
  "modern",
  "vertex",
  "summit",
  "executive",
  "impact",
  "classic",
  "timeline",
  "minimal",
  "meridian",
  "cambridge",
  "technical",
  "prestige",
  "creative",
  "compact",
];

interface ShowcaseItem {
  template: TemplateId;
  resume: ResumeData;
}

function Thumb({ item }: { item: ShowcaseItem }) {
  const meta = TEMPLATE_META[item.template];
  const isNew = NEW_TEMPLATES.has(item.template);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href="/dashboard/templates"
        className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10"
      >
        <div className="relative flex h-[330px] items-start justify-center overflow-hidden border-b bg-muted/40 pt-4">
          <div
            className="overflow-hidden rounded-md shadow-lg"
            style={{ width: 794 * 0.28, height: 1123 * 0.28 }}
          >
            <div className="origin-top-left transition-transform duration-300 group-hover:scale-[1.035]" style={{ transform: "scale(0.28)" }}>
              <ResumePreview resume={item.resume} />
            </div>
          </div>
          {isNew && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/30">
              New
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-bold text-foreground">{meta.name}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {meta.tag}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Best for: {meta.bestFor}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 transition-all group-hover:gap-1.5 dark:text-emerald-400">
            Use
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function ThumbSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-[330px] animate-pulse border-b bg-muted/50" />
      <div className="space-y-2 p-4">
        <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-muted/70" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function TemplateShowcase() {
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);
  const [category, setCategory] = React.useState<Category>("All");

  const items = React.useMemo<ShowcaseItem[]>(() => {
    if (!mounted) return [];
    const alex = resumes.find((r) => r.id === "seed-alex") ?? resumes[0];
    const maya = resumes.find((r) => r.id === "seed-maya") ?? resumes[0];
    const david = resumes.find((r) => r.id === "seed-david") ?? resumes[0];
    if (!alex || !maya || !david) return [];
    const byTemplate: Record<string, ShowcaseItem> = {
      modern: { template: "modern", resume: alex },
      minimal: {
        template: "minimal",
        resume: { ...alex, id: "show-minimal", template: "minimal", accent: "#14b8a6" },
      },
      impact: {
        template: "impact",
        resume: { ...alex, id: "show-impact", template: "impact", accent: "#0d9488" },
      },
      summit: {
        template: "summit",
        resume: { ...maya, id: "show-summit", template: "summit", accent: "#8b5cf6" },
      },
      timeline: {
        template: "timeline",
        resume: { ...alex, id: "show-timeline", template: "timeline", accent: "#f97316" },
      },
      classic: {
        template: "classic",
        resume: { ...maya, id: "show-classic", template: "classic", accent: "#475569" },
      },
      executive: { template: "executive", resume: maya },
      cambridge: {
        template: "cambridge",
        resume: { ...david, id: "show-cambridge", template: "cambridge", accent: "#9f1239" },
      },
      creative: {
        template: "creative",
        resume: { ...david, id: "show-creative", template: "creative", accent: "#8b5cf6" },
      },
      technical: { template: "technical", resume: david },
      vertex: {
        template: "vertex",
        resume: { ...alex, id: "show-vertex", template: "vertex", accent: "#10b981" },
      },
      prestige: {
        template: "prestige",
        resume: { ...maya, id: "show-prestige", template: "prestige", accent: "#475569" },
      },
      meridian: {
        template: "meridian",
        resume: { ...david, id: "show-meridian", template: "meridian", accent: "#059669" },
      },
      compact: {
        template: "compact",
        resume: { ...alex, id: "show-compact", template: "compact", accent: "#0d9488" },
      },
    };
    return SHOWCASE.map((t) => byTemplate[t]).filter(Boolean);
  }, [mounted, resumes]);

  const visible =
    category === "All" ? items : items.filter((i) => CATEGORY_OF[i.template] === category);

  return (
    <section id="templates" aria-label="Template showcase" className="scroll-mt-20 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Templates"
          title="Beautiful templates, parse-perfect by design"
          description="Fourteen signature layouts — including a dedicated ATS-first family built in the clean, one-column style top engineering teams prefer. Every layout is tested against applicant-tracking software before it ships."
        />

        {/* Filter tabs with live counts */}
        <div className="mt-10 flex justify-center">
          <div
            aria-label="Filter templates by style"
            className="inline-flex max-w-full flex-wrap justify-center gap-y-1 rounded-2xl border bg-card p-1 shadow-sm sm:rounded-full"
          >
            {(["All", "ATS", "Modern", "Classic", "Creative"] as const).map((c) => {
              const count =
                c === "All"
                  ? items.length
                  : items.filter((i) => CATEGORY_OF[i.template] === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-5 sm:text-sm",
                    category === c
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums",
                      category === c ? "text-white/75" : "text-muted-foreground/60"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-10">
          {!mounted ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE.map((t) => (
                <ThumbSkeleton key={t} />
              ))}
            </div>
          ) : (
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Template gallery">
              <AnimatePresence mode="popLayout">
                {visible.map((item) => (
                  <Thumb key={item.template} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Live previews rendered from real resumes —{" "}
          <Link
            href="/dashboard/templates"
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            open the gallery to use any of the {items.length || 14}
          </Link>
        </p>
      </div>
    </section>
  );
}
