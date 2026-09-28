"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, Search, SearchX, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  TEMPLATE_META,
  useActiveResume,
  useResumeStore,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import ResumePreview from "@/components/resume/resume-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/* Filter tabs                                                         */
/* ------------------------------------------------------------------ */

type TabKey = "all" | "new" | "ats" | "creative" | "senior";

const TAB_FILTERS: Record<Exclude<TabKey, "all">, TemplateId[]> = {
  new: ["vertex", "prestige", "meridian", "compact"],
  ats: ["technical", "classic", "timeline", "vertex", "meridian", "compact", "prestige"],
  creative: ["creative", "impact", "summit"],
  senior: ["executive", "cambridge", "prestige"],
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "ats", label: "ATS-Optimized" },
  { key: "creative", label: "Creative" },
  { key: "senior", label: "Senior" },
];

const TEMPLATE_ORDER: TemplateId[] = [
  "modern",
  "vertex",
  "impact",
  "classic",
  "summit",
  "meridian",
  "minimal",
  "cambridge",
  "technical",
  "timeline",
  "prestige",
  "compact",
  "executive",
  "creative",
];

const TAG_TONE: Record<string, string> = {
  "Most Popular": "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Safe Choice": "border-transparent bg-teal-500/10 text-teal-700 dark:text-teal-400",
  Clean: "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400",
  Bold: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-400",
  Senior: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "ATS-Ready": "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Refined: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Eye-Catching": "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-400",
  Balanced: "border-transparent bg-teal-500/10 text-teal-700 dark:text-teal-400",
  Structured: "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "FAANG-Ready": "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Conservative: "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  "ATS-First": "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "One-Page": "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

/* ------------------------------------------------------------------ */
/* Demo fallback resume (used only when the store is empty)            */
/* ------------------------------------------------------------------ */

const DEMO_RESUME: ResumeData = {
  id: "demo-preview",
  title: "Demo",
  template: "modern",
  accent: "#10b981",
  updatedAt: 0,
  personal: {
    fullName: "Jordan Lee",
    jobTitle: "Senior Product Engineer",
    email: "jordan.lee@email.com",
    phone: "+1 (555) 010-2233",
    location: "Austin, TX",
    website: "jordanlee.dev",
    linkedin: "linkedin.com/in/jordanlee",
    github: "github.com/jordanlee",
  },
  summary:
    "Product-minded engineer with 6+ years of experience shipping delightful, high-performance web products. Passionate about design systems, accessibility and developer experience.",
  experience: [
    {
      id: "demo-exp-1",
      company: "Acme Cloud",
      role: "Senior Frontend Engineer",
      location: "Austin, TX",
      startDate: "2020-03",
      endDate: "",
      current: true,
      bullets: [
        "Led the redesign of the customer dashboard used by 120K monthly users",
        "Cut initial page load from 4.2s to 1.4s through code-splitting and caching",
        "Built a component library adopted by 4 product teams",
      ],
    },
    {
      id: "demo-exp-2",
      company: "BrightApps",
      role: "Frontend Engineer",
      location: "Remote",
      startDate: "2017-06",
      endDate: "2020-02",
      current: false,
      bullets: [
        "Shipped 40+ features across web and mobile web clients",
        "Introduced automated visual regression testing across the suite",
      ],
    },
  ],
  education: [
    {
      id: "demo-edu-1",
      school: "University of Texas at Austin",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2013-08",
      endDate: "2017-05",
      gpa: "3.7",
    },
  ],
  skills: [
    { id: "demo-sk-1", name: "React", level: 5 },
    { id: "demo-sk-2", name: "TypeScript", level: 5 },
    { id: "demo-sk-3", name: "Node.js", level: 4 },
    { id: "demo-sk-4", name: "Design Systems", level: 4 },
  ],
  projects: [
    {
      id: "demo-pr-1",
      name: "OpenChart",
      url: "github.com/jordanlee/openchart",
      description: "Open-source charting library with 2.1K GitHub stars.",
      tech: ["TypeScript", "D3"],
    },
  ],
  certifications: [{ id: "demo-ce-1", name: "AWS Certified Developer", issuer: "AWS", year: "2022" }],
  languages: [{ id: "demo-la-1", name: "English", level: "Native" }],
};

const TEMPLATE_ACCENTS: Record<TemplateId, string> = {
  modern: "#10b981",
  classic: "#475569",
  minimal: "#14b8a6",
  creative: "#f43f5e",
  executive: "#f59e0b",
  technical: "#8b5cf6",
  cambridge: "#9f1239",
  impact: "#0d9488",
  summit: "#8b5cf6",
  timeline: "#f97316",
  vertex: "#10b981",
  prestige: "#475569",
  meridian: "#059669",
  compact: "#0d9488",
};

/* ------------------------------------------------------------------ */
/* Template card                                                       */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  preview,
  index,
  onUse,
  onPreview,
}: {
  template: TemplateId;
  preview: ResumeData;
  index: number;
  onUse: () => void;
  onPreview: () => void;
}) {
  const meta = TEMPLATE_META[template];
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4), ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-emerald-500/10"
    >
      {/* Live preview: scale 0.26 → 0.3 on hover */}
      <div className="relative flex h-[300px] justify-center overflow-hidden border-b bg-muted/40">
        <div
          aria-hidden="true"
          className="pointer-events-none shrink-0 origin-top scale-[0.26] transition-transform duration-300 ease-out group-hover:scale-[0.3]"
          style={{ width: 794, height: 1123 }}
        >
          <ResumePreview resume={preview} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[15px] font-bold tracking-tight">{meta.name}</h3>
          <Badge variant="outline" className={cn("border-transparent", TAG_TONE[meta.tag])}>
            {meta.tag}
          </Badge>
        </div>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          <span className="font-medium text-foreground/75">Best for:</span> {meta.bestFor}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={onUse}
            className="h-9 flex-1 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Use template
          </Button>
          <Button variant="outline" onClick={onPreview} className="h-9 gap-1.5 rounded-lg">
            <Eye className="h-4 w-4" aria-hidden="true" /> Preview
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TemplatesPage() {
  const mounted = useMounted();
  const router = useRouter();
  const resumes = useResumeStore((s) => s.resumes);
  const active = useActiveResume();
  const createResume = useResumeStore((s) => s.createResume);
  const updateResume = useResumeStore((s) => s.updateResume);

  const [tab, setTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");
  const [previewTemplate, setPreviewTemplate] = React.useState<TemplateId | null>(null);

  /* Personalized preview content: prefer the active resume's data */
  const baseResume: ResumeData = active ?? resumes[0] ?? DEMO_RESUME;

  const previews = React.useMemo(() => {
    const map = new Map<TemplateId, ResumeData>();
    for (const t of TEMPLATE_ORDER) {
      map.set(t, { ...baseResume, id: `tpl-preview-${t}`, template: t, accent: TEMPLATE_ACCENTS[t] });
    }
    return map;
  }, [baseResume]);

  const visibleTemplates = React.useMemo(() => {
    const byTab =
      tab === "all" ? TEMPLATE_ORDER : TEMPLATE_ORDER.filter((t) => TAB_FILTERS[tab].includes(t));
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((t) => {
      const meta = TEMPLATE_META[t];
      return (
        meta.name.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        meta.bestFor.toLowerCase().includes(q) ||
        meta.tag.toLowerCase().includes(q)
      );
    });
  }, [tab, query]);

  const tabCount = (key: TabKey) =>
    key === "all" ? TEMPLATE_ORDER.length : TAB_FILTERS[key].length;

  const filtersActive = tab !== "all" || query.trim() !== "";

  const clearFilters = () => {
    setTab("all");
    setQuery("");
  };

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading templates">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const handleUse = (t: TemplateId) => {
    if (active) {
      updateResume(active.id, { template: t });
      toast.success(`${TEMPLATE_META[t].name} template applied`, {
        description: `“${active.title}” now uses the ${TEMPLATE_META[t].name} layout.`,
      });
    } else {
      createResume("Untitled Resume", t, TEMPLATE_ACCENTS[t]);
      toast.success("Resume created", {
        description: `Started with the ${TEMPLATE_META[t].name} template — opening the Studio…`,
      });
      router.push("/dashboard/builder");
    }
  };

  const previewOpen = previewTemplate !== null ? previews.get(previewTemplate) : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Choose your style</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Fourteen recruiter-tested layouts — including a dedicated ATS-first family — all rendered
            live from your own content.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          />
        </div>
      </header>

      {/* ATS note */}
      <aside
        aria-label="ATS compatibility note"
        className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[13.5px] font-semibold">Every template is parseable by ATS systems</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Real text, semantic structure and standard section headings — applicant tracking systems
            read all fourteen layouts flawlessly. The ATS-first family (Vertex, Meridian, Compact,
            Prestige) goes further: one column, reverse-chronological, no graphics or skill bars — the
            minimalist format top engineering teams expect. Pick the style that fits you, not the robot.
          </p>
        </div>
      </aside>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList aria-label="Filter templates" className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="h-8 flex-none px-3 text-[13px]">
                {t.label}
                <span className="ml-1.5 text-[10.5px] tabular-nums text-muted-foreground">
                  {tabCount(t.key)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Showing {visibleTemplates.length} of {TEMPLATE_ORDER.length} templates
        </p>
      </div>

      {/* Grid */}
      {visibleTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold">No templates match your filters</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Try a different keyword or browse the full collection.
          </p>
          {filtersActive && (
            <Button variant="outline" onClick={clearFilters} className="mt-4 h-9 rounded-lg text-[13px]">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label="Template gallery"
        >
          {visibleTemplates.map((t, i) => (
            <TemplateCard
              key={t}
              template={t}
              preview={previews.get(t) ?? DEMO_RESUME}
              index={i}
              onUse={() => handleUse(t)}
              onPreview={() => setPreviewTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[520px]">
          {previewOpen && previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {TEMPLATE_META[previewTemplate].name} template
                </DialogTitle>
                <DialogDescription>{TEMPLATE_META[previewTemplate].description}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[62vh] overflow-y-auto rounded-lg border bg-muted/40 p-2 scrollbar-thin">
                <div className="flex justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none shrink-0"
                    style={{ width: 794 * 0.5, height: 1123 * 0.5 }}
                  >
                    <div
                      style={{
                        width: 794,
                        height: 1123,
                        transform: "scale(0.5)",
                        transformOrigin: "top left",
                      }}
                    >
                      <ResumePreview resume={previewOpen} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
