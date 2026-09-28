"use client";

import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlignLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Copy,
  Crosshair,
  Download,
  Info,
  Loader2,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  Save,
  SkipForward,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveResume, useResumeStore } from "@/lib/resume-store";
import {
  generateCoverLetter,
  generateTailoredCoverLetter,
  sleep,
  type CoverTone,
} from "@/lib/mock-ai";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

import { gradeBadgeClass } from "@/components/tools/score-gauge";
import { ResumeSelect } from "@/components/tools/resume-select";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import {
  EASE,
  fadeInScale,
  staggerContainer,
  staggerItem,
} from "@/components/tools/variants";
import { loadMatchHistory, type MatchHistoryEntry } from "@/components/match/history";
import { keywordLabel } from "@/components/match/suggest";

/* ============================== Meta ============================== */

const TONES: Array<{
  value: CoverTone;
  label: string;
  icon: LucideIcon;
  hint: string;
}> = [
  { value: "professional", label: "Professional", icon: Briefcase, hint: "Classic and polished" },
  { value: "enthusiastic", label: "Enthusiastic", icon: Zap, hint: "Energetic and eager" },
  { value: "concise", label: "Concise", icon: AlignLeft, hint: "Short and direct" },
  { value: "creative", label: "Creative", icon: Palette, hint: "Bold and memorable" },
];

type HeaderStyle = "classic" | "modern" | "minimal";

const HEADER_STYLES: Array<{ value: HeaderStyle; label: string; blurb: string }> = [
  { value: "classic", label: "Classic", blurb: "Centered letterhead" },
  { value: "modern", label: "Modern", blurb: "Accent bar, bold" },
  { value: "minimal", label: "Minimal", blurb: "Quiet, airy" },
];

/** Keyword chip: pops in with a slight scale so the row feels alive. */
const chipItem: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 6 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/* ============================== Page ============================== */

export default function CoverLetterPage() {
  const mounted = useMounted();
  const resumes = useResumeStore((s) => s.resumes);
  const activeResume = useActiveResume();
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActive = useResumeStore((s) => s.setActive);
  const incrementCoverLetters = useResumeStore((s) => s.incrementCoverLetters);

  const resume = resumes.find((r) => r.id === activeResumeId) ?? activeResume;

  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [roleTouched, setRoleTouched] = React.useState(false);
  const [tone, setTone] = React.useState<CoverTone>("professional");
  const [headerStyle, setHeaderStyle] = React.useState<HeaderStyle>("modern");
  const [generating, setGenerating] = React.useState(false);
  const [letter, setLetter] = React.useState<string | null>(null);
  const [typedLen, setTypedLen] = React.useState(0);
  const [history, setHistory] = React.useState<MatchHistoryEntry[]>([]);
  const [selectedJdId, setSelectedJdId] = React.useState<string | null>(null);
  const [injected, setInjected] = React.useState<string[]>([]);
  const [requested, setRequested] = React.useState<string[]>([]);
  const [genKey, setGenKey] = React.useState(0);

  /* Prefill role from the active resume once hydrated (unless user edited). */
  React.useEffect(() => {
    if (!mounted || roleTouched) return;
    if (activeResume?.personal.jobTitle) setRole(activeResume.personal.jobTitle);
  }, [mounted, activeResume, roleTouched]);

  /* Load Job Match scans once hydrated (localStorage — never during SSR). */
  React.useEffect(() => {
    if (!mounted) return;
    setHistory(loadMatchHistory());
  }, [mounted]);

  /* Keep only scans made with the currently selected resume. */
  const jdEntries = React.useMemo(
    () => history.filter((h) => h.resumeId === activeResumeId),
    [history, activeResumeId]
  );
  const selectedJd = jdEntries.find((h) => h.id === selectedJdId) ?? null;

  /* A selected scan belongs to one resume — drop the pick when it changes. */
  React.useEffect(() => {
    setSelectedJdId(null);
  }, [activeResumeId]);

  /* Typewriter reveal: slice the generated letter at ~12ms per character. */
  React.useEffect(() => {
    if (letter === null) {
      setTypedLen(0);
      return;
    }
    setTypedLen(0);
    const id = window.setInterval(() => {
      setTypedLen((n) => {
        if (n >= letter.length) {
          window.clearInterval(id);
          return n;
        }
        return Math.min(n + 2, letter.length);
      });
    }, 12);
    return () => window.clearInterval(id);
  }, [letter]);

  const typing = letter !== null && typedLen < letter.length;
  const typed = letter === null ? "" : letter.slice(0, typedLen);

  /* Tone summary chip next to the "Tailored to JD" badge. */
  const toneMeta = TONES.find((t) => t.value === tone) ?? null;

  const buildLetter = React.useCallback(
    (): { text: string; injected: string[]; requested: string[] } | null => {
      if (!resume) return null;
      const baseOpts = {
        resume,
        company: company.trim() || "your team",
        role: role.trim() || resume.personal.jobTitle || "the open role",
        tone,
      };
      if (selectedJd) {
        const tailored = generateTailoredCoverLetter({
          ...baseOpts,
          jd: selectedJd.jd,
        });
        return {
          text: tailored.text,
          injected: tailored.injectedKeywords,
          requested: tailored.requestedKeywords,
        };
      }
      return { text: generateCoverLetter(baseOpts), injected: [], requested: [] };
    },
    [resume, company, role, tone, selectedJd]
  );

  const handleGenerate = async () => {
    if (generating || !resume) return;
    setGenerating(true);
    setLetter(null);
    try {
      await sleep(1400);
      const result = buildLetter();
      if (result) {
        setLetter(result.text);
        setInjected(result.injected);
        setRequested(result.requested);
        setGenKey((k) => k + 1);
        toast.success(
          result.injected.length > 0
            ? `Tailored with ${result.injected.length} keyword${result.injected.length === 1 ? "" : "s"}`
            : "Cover letter drafted"
        );
      }
    } catch {
      toast.error("Generation failed — please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (generating || !resume) return;
    setGenerating(true);
    try {
      await sleep(600);
      const result = buildLetter();
      if (result) {
        setLetter(result.text);
        setInjected(result.injected);
        setRequested(result.requested);
        setGenKey((k) => k + 1);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClearJd = () => setSelectedJdId(null);

  const handleCopy = async () => {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't access the clipboard — select and copy manually");
    }
  };

  const handleDownload = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      company
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "draft";
    a.download = `cover-letter-${slug}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded");
  };

  const handleSave = () => {
    incrementCoverLetters();
    toast.success("Saved to dashboard");
  };

  const handleSkip = () => {
    if (letter !== null) setTypedLen(letter.length);
  };

  /* Split the letter into letterhead + body for styled rendering. */
  const lines = typed.split("\n");
  const headerLines = lines.slice(0, 2);
  const bodyText = lines.slice(2).join("\n");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      <ToolPageHeader
        icon={Mail}
        title="Cover Letter Generator"
        description="Turn your resume into a tailored, hiring-manager-ready cover letter. Pick a tone, choose a letterhead, and ship it in seconds."
      />

      {/* Config */}
      <motion.section variants={staggerItem} aria-label="Cover letter configuration">
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <Label htmlFor="cl-company">Company</Label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="cl-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Lumen Labs"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-role">Role</Label>
              <Input
                id="cl-role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setRoleTouched(true);
                }}
                placeholder="e.g. Senior Frontend Engineer"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as CoverTone)}>
                <SelectTrigger id="cl-tone" aria-label="Letter tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        {t.label}
                        <span className="text-xs text-muted-foreground">— {t.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resume</Label>
              <ResumeSelect
                value={resume?.id ?? ""}
                onValueChange={setActive}
                ariaLabel="Resume to base the letter on"
              />
            </div>

            {/* Letterhead style picker */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Letterhead style</Label>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Letterhead style">
                {HEADER_STYLES.map((s) => {
                  const active = headerStyle === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setHeaderStyle(s.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all hover:border-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-emerald-500/60 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                          : "border-border"
                      )}
                    >
                      <span className="flex h-4 items-end" aria-hidden="true">
                        {s.value === "classic" ? (
                          <span className="mx-auto h-1.5 w-10 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                        ) : s.value === "modern" ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3.5 w-1 rounded bg-emerald-500" />
                            <span className="h-1.5 w-9 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          </span>
                        ) : (
                          <span className="h-1 w-7 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                        )}
                      </span>
                      <span className="mt-2 block text-xs font-semibold">{s.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{s.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tailor to a job description (Job Match scans) */}
            <div
              className="min-w-0 space-y-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 sm:col-span-2 dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]"
              aria-label="Tailor to a job description"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Crosshair
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold">Tailor to a job description</h3>
                {selectedJd ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearJd}
                    aria-label="Clear the selected job description"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Clear
                  </Button>
                ) : null}
              </div>

              {!mounted ? (
                <div
                  className="h-11 animate-pulse rounded-lg bg-emerald-500/5"
                  aria-hidden="true"
                />
              ) : jdEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-emerald-500/30 px-4 py-5 text-center">
                  <p className="text-sm font-medium">
                    No Job Match scans for this resume yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scan a job description to see what it needs — then weave it in here.
                  </p>
                  <Link
                    href="/dashboard/match"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-emerald-300"
                    aria-label="Run a match scan first in the Job Match Scanner"
                  >
                    Run a match scan first
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <>
                  <ul
                    aria-label="Job descriptions scanned for this resume"
                    className="space-y-1.5"
                  >
                    {jdEntries.map((entry) => {
                      const active = entry.id === selectedJdId;
                      return (
                        <li key={entry.id} className="relative list-none">
                          {active ? (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-emerald-500"
                            />
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSelectedJdId(active ? null : entry.id)}
                            aria-pressed={active}
                            aria-label={`Tailor the letter to ${entry.jdBrief} — match score ${entry.score} of 100, scanned ${formatDistanceToNow(entry.at, { addSuffix: true })}`}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-emerald-500/60 bg-emerald-500/10 py-2.5 pl-4 pr-10 ring-2 ring-emerald-500/20"
                                : "border-border/70 py-2.5 pl-3 pr-3 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]"
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {entry.jdBrief}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                                gradeBadgeClass(entry.score)
                              )}
                            >
                              {entry.score}
                            </span>
                            <span className="hidden w-20 shrink-0 text-right text-[11px] text-muted-foreground sm:inline">
                              {formatDistanceToNow(entry.at, { addSuffix: true })}
                            </span>
                          </button>
                          {active ? (
                            <button
                              type="button"
                              onClick={handleClearJd}
                              aria-label={`Stop tailoring to ${entry.jdBrief}`}
                              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-500/15 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-emerald-300"
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  <p
                    className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"
                    role="status"
                  >
                    {selectedJd ? (
                      <>
                        <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                        The letter will weave in up to 5 keywords this JD needs.
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Select a scan above to weave its missing keywords into the letter.
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>

            <div className="sm:col-span-2">
              <Button
                onClick={handleGenerate}
                disabled={generating || !resume || !company.trim()}
                className="relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
                aria-label="Generate cover letter with AI"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {generating ? "Generating…" : "Generate with AI"}
                {generating ? (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    initial={{ x: "-150%" }}
                    animate={{ x: "150%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                ) : null}
              </Button>
              {!company.trim() ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Add a company name above to unlock generation.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Output */}
      {generating && !letter ? (
        <motion.section variants={staggerItem} aria-busy="true" aria-label="Generating letter">
          <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-white shadow-xl shadow-zinc-950/5 dark:bg-zinc-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" aria-hidden="true" />
            <div className="space-y-3 p-8 sm:p-10" aria-hidden="true">
              <div className="mx-auto h-3 w-36 rounded bg-muted" />
              <div className="h-2 w-48 rounded bg-muted/70" />
              <div className="mt-8 space-y-2.5">
                {[100, 94, 97, 88, 0, 96, 90, 72].map((w, i) =>
                  w === 0 ? (
                    <div key={i} className="h-2" />
                  ) : (
                    <div key={i} className="h-2 rounded bg-muted" style={{ width: `${w}%` }} />
                  )
                )}
              </div>
            </div>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent"
              initial={{ top: "-20%" }}
              animate={{ top: "110%" }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground" role="status">
            <Loader2 className="mr-2 inline size-4 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Drafting your cover letter
            <span className="animate-pulse" aria-hidden="true">…</span>
          </p>
        </motion.section>
      ) : letter !== null ? (
        <motion.section variants={staggerItem} aria-label="Generated cover letter">
          <motion.article
            variants={fadeInScale}
            aria-busy={typing}
            className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-white text-zinc-900 shadow-xl shadow-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {headerStyle === "modern" ? (
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" aria-hidden="true" />
            ) : null}
            <div className="p-7 font-serif text-[15px] leading-relaxed sm:p-10">
              {/* Letterhead */}
              <div
                className={cn(
                  "mb-6 space-y-1 pb-4",
                  headerStyle === "classic" && "border-b-4 border-double border-zinc-200 pb-5 text-center dark:border-zinc-700",
                  headerStyle === "modern" && "border-l-4 border-emerald-500 pl-4",
                  headerStyle === "minimal" && "pb-6"
                )}
              >
                {headerLines.map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      i === 0 && "text-lg font-semibold tracking-wide",
                      i === 1 && "text-xs text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {line}
                  </p>
                ))}
              </div>
              {/* Body + signature */}
              <div className="whitespace-pre-wrap">
                {bodyText}
                {typing ? (
                  <span
                    className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-emerald-500"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          </motion.article>

          {/* Tailoring strip: badge + injected keyword chips */}
          {injected.length > 0 ? (
            <motion.div
              key={`tailored-${genKey}`}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="mx-auto mt-4 flex w-full max-w-2xl flex-wrap items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 dark:bg-emerald-500/[0.08]"
            >
              <Badge
                className="shrink-0 border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                aria-label="This letter is tailored to a job description"
              >
                <Crosshair className="size-3" aria-hidden="true" />
                Tailored to JD
              </Badge>
              {toneMeta ? (
                <Badge
                  variant="outline"
                  className="shrink-0 border-zinc-300 bg-background text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  aria-label={`Letter tone: ${toneMeta.label}`}
                >
                  <toneMeta.icon className="size-3 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                  Tone: {toneMeta.label}
                </Badge>
              ) : null}
              <ul
                className="flex flex-wrap items-center gap-1.5"
                aria-label="Keywords woven into this letter"
              >
                {injected.map((kw) => (
                  <motion.li
                    key={kw}
                    variants={chipItem}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-background px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200"
                  >
                    <Plus
                      className="size-3 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    {keywordLabel(kw)}
                  </motion.li>
                ))}
              </ul>
              {/* Density guard: only surfaced when the cap actually dropped a
                  requested keyword — a short letter got its budget trimmed.
                  When nothing was capped the note is omitted entirely. */}
              {requested.length > injected.length ? (
                <motion.p
                  variants={chipItem}
                  className="flex w-full items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400"
                  role="status"
                >
                  <Info className="size-3.5 shrink-0" aria-hidden="true" />
                  Density guard: {injected.length} of {requested.length} requested
                  keywords injected (short letter)
                </motion.p>
              ) : null}
            </motion.div>
          ) : null}

          {/* Status + actions */}
          <div className="mx-auto mt-5 w-full max-w-2xl space-y-4">
            <p
              className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground"
              role="status"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  typing ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                )}
              />
              {typing ? "Generating" : `Draft ready · ${letter.length} characters`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {typing ? (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  <SkipForward className="size-4" aria-hidden="true" />
                  Skip animation
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!letter}>
                <Copy className="size-4" aria-hidden="true" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!letter}>
                <Download className="size-4" aria-hidden="true" />
                Download .txt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={generating}
              >
                <RefreshCw className={cn("size-4", generating && "animate-spin")} aria-hidden="true" />
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
              >
                <Save className="size-4" aria-hidden="true" />
                Save
              </Button>
            </div>
          </div>
        </motion.section>
      ) : (
        /* Empty config state */
        <motion.section variants={staggerItem} aria-label="Getting started">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center sm:p-14">
            <div className="relative" aria-hidden="true">
              <motion.div
                className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Mail className="size-9" />
              </motion.div>
              <motion.span
                className="absolute -right-9 top-0 flex size-9 items-center justify-center rounded-lg border bg-card text-amber-600 shadow-sm dark:text-amber-400"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Briefcase className="size-4" />
              </motion.span>
              <motion.span
                className="absolute -left-9 bottom-0 flex size-9 items-center justify-center rounded-lg border bg-card text-violet-600 shadow-sm dark:text-violet-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Palette className="size-4" />
              </motion.span>
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold">
              Tell us where you&apos;re applying
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Add a company and role above, choose a tone, and we&apos;ll draft a
              tailored cover letter from your resume — complete with letterhead
              and signature.
            </p>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
