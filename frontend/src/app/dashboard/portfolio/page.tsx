"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  LoaderCircle,
  Lock,
  Monitor,
  Rocket,
  Smartphone,
  UserRound,
} from "lucide-react";
import {
  useActiveResume,
  useResumeStore,
} from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { fadeUp, staggerContainer } from "@/components/account/motion-presets";
import { PortfolioSite } from "@/components/account/portfolio-site";
import { buildPortfolioHtml } from "@/components/account/build-portfolio-html";
import { downloadBlob } from "@/components/account/download";

const PUBLISH_STEPS = [
  "Generating layout…",
  "Styling sections…",
  "Optimizing SEO…",
  "Deploying…",
] as const;

const THEME_SWATCHES = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
] as const;

type PreviewMode = "desktop" | "mobile";

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "");
  return slug || "portfolio";
}

export default function PortfolioPage() {
  const mounted = useMounted();
  const activeResume = useActiveResume();
  const resumes = useResumeStore((s) => s.resumes);
  const setActive = useResumeStore((s) => s.setActive);

  const [accent, setAccent] = React.useState<string>("#8b5cf6");
  const [mode, setMode] = React.useState<PreviewMode>("desktop");
  const [dark, setDark] = React.useState(false);

  const [publishing, setPublishing] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const cancelRef = React.useRef(false);

  const hasName = Boolean(activeResume?.personal.fullName);
  const fakeUrl = `https://${slugify(activeResume?.personal.fullName ?? "")}.resumeforge.site`;

  const handlePublish = async () => {
    if (!hasName || publishing) return;
    cancelRef.current = false;
    setPublishing(true);
    setStepIndex(0);
    for (let i = 0; i < PUBLISH_STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (cancelRef.current) return;
    }
    setPublishing(false);
    setSuccessOpen(true);
    toast.success("Portfolio published", { description: fakeUrl });
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fakeUrl);
      toast.success("URL copied to clipboard", { description: fakeUrl });
    } catch {
      toast.error("Couldn't access the clipboard — copy it manually", { description: fakeUrl });
    }
  };

  const handleDownloadHtml = () => {
    if (!activeResume || !hasName) return;
    try {
      const html = buildPortfolioHtml(activeResume, accent, dark);
      downloadBlob(html, "portfolio.html", "text/html;charset=utf-8");
      toast.success("portfolio.html downloaded", {
        description: "A standalone site — open it in any browser, no setup needed.",
      });
    } catch {
      toast.error("Export failed", { description: "Something went wrong while building the HTML file." });
    }
  };

  const preview = mounted && activeResume && hasName ? (
    <PortfolioSite data={activeResume} accent={accent} dark={dark} />
  ) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        icon={Globe}
        eyebrow="Account Tools"
        title="Portfolio Website Generator"
        description="Turn your active resume into a polished one-page portfolio site — theme it, preview it live, publish it (demo) or export a standalone HTML file."
      >
        <Button
          variant="outline"
          onClick={handleDownloadHtml}
          disabled={!activeResume || !hasName}
          aria-label="Download portfolio as standalone HTML file"
        >
          <Download aria-hidden="true" />
          <span className="hidden sm:inline">Download HTML</span>
          <span className="sm:hidden">HTML</span>
        </Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
        {/* ---------- Config row ---------- */}
        <motion.section variants={fadeUp} aria-label="Portfolio configuration">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Site configuration</CardTitle>
              <CardDescription>Everything updates the live preview instantly.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                {/* Resume selector */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="resume-select" className="text-xs text-muted-foreground">
                    Resume source
                  </Label>
                  <Select value={activeResume?.id ?? ""} onValueChange={setActive}>
                    <SelectTrigger id="resume-select" className="w-[240px]" aria-label="Choose resume to build portfolio from">
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Accent theme swatches */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Accent theme</span>
                  <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent theme">
                    {THEME_SWATCHES.map((swatch) => {
                      const selected = accent === swatch.value;
                      return (
                        <button
                          key={swatch.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`${swatch.name} theme`}
                          onClick={() => setAccent(swatch.value)}
                          className="relative size-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          style={{
                            backgroundColor: swatch.value,
                            boxShadow: selected
                              ? `0 0 0 2px ${swatch.value}, 0 0 0 6px ${swatch.value}30`
                              : undefined,
                            transform: selected ? "scale(1.12)" : undefined,
                          }}
                        >
                          {selected ? (
                            <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" strokeWidth={3} aria-hidden="true" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview mode toggle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Preview mode</span>
                  <div className="inline-flex rounded-lg border p-1" role="group" aria-label="Preview mode">
                    {(
                      [
                        { key: "desktop", icon: Monitor, label: "Desktop" },
                        { key: "mobile", icon: Smartphone, label: "Mobile" },
                      ] as const
                    ).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={mode === key}
                        aria-label={`${label} preview`}
                        onClick={() => setMode(key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          mode === key
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark preview toggle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Site theme</span>
                  <div className="flex h-9 items-center gap-2">
                    <Switch id="dark-preview" checked={dark} onCheckedChange={setDark} aria-label="Toggle dark preview" />
                    <Label htmlFor="dark-preview" className="text-sm">
                      Dark
                    </Label>
                  </div>
                </div>

                {/* Publish */}
                <div className="ml-auto flex flex-col items-end gap-1.5">
                  <Button
                    onClick={handlePublish}
                    disabled={!hasName || publishing}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500/90 hover:to-teal-600/90"
                    aria-label="Publish portfolio site"
                  >
                    {publishing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Rocket aria-hidden="true" />}
                    {publishing ? "Publishing…" : "Publish site"}
                  </Button>
                  <AnimatePresence mode="wait">
                    {publishing ? (
                      <motion.p
                        key={stepIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        aria-live="polite"
                      >
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                        {PUBLISH_STEPS[stepIndex]}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ---------- Empty state / Live preview ---------- */}
        {!mounted || !activeResume || !hasName ? (
          <motion.section variants={fadeUp} aria-label="Portfolio unavailable">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UserRound className="size-7" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-lg font-semibold">Finish your profile first</h2>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    {mounted
                      ? `Your ${activeResume ? "active resume" : "workspace"} doesn't have a name yet. Add your name and basics in Resume Studio, then come back to generate your portfolio site.`
                      : "Loading your workspace…"}
                  </p>
                </div>
                {mounted ? (
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90">
                    <Link href="/dashboard/builder">
                      Complete your profile
                      <ExternalLink aria-hidden="true" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </motion.section>
        ) : (
          <motion.section variants={fadeUp} aria-label="Live portfolio preview">
            {/* Browser chrome */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-lg shadow-black/5">
              <div className="flex items-center gap-3 border-b bg-muted/60 px-4 py-2.5">
                <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full bg-rose-400" />
                  <span className="size-3 rounded-full bg-amber-400" />
                  <span className="size-3 rounded-full bg-emerald-400" />
                </div>
                <div
                  className="mx-auto flex w-full max-w-md items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-1 font-mono text-xs text-muted-foreground"
                  role="status"
                >
                  <Lock className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="truncate">{fakeUrl}</span>
                </div>
                <div className="w-12 shrink-0" aria-hidden="true" />
              </div>
              {/* Scrolling site preview */}
              <div className="max-h-[720px] overflow-y-auto scrollbar-thin">
                <motion.div
                  key={`${mode}-${dark ? "dark" : "light"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(mode === "mobile" && "bg-muted/40 py-6 dark:bg-muted/20")}
                >
                  <div className={cn(mode === "mobile" && "mx-auto w-[390px] max-w-full overflow-hidden border-x shadow-xl")}>
                    {preview}
                  </div>
                </motion.div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground" role="note">
              Live preview — {mode === "mobile" ? "390px mobile frame" : "desktop layout"} · scroll inside the frame
            </p>
          </motion.section>
        )}
      </motion.div>

      {/* ---------- Publish success dialog ---------- */}
      <Dialog open={successOpen} onOpenChange={(open) => { cancelRef.current = !open; setSuccessOpen(open); }}>
        <DialogContent className="sm:max-w-md" aria-describedby="publish-success-description">
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
              className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
            >
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-400/40"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1, delay: 0.4, repeat: 1 }}
                aria-hidden="true"
              />
              {/* confetti dots */}
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute size-1.5 rounded-full"
                  style={{
                    backgroundColor: ["#8b5cf6", "#f59e0b", "#10b981", "#f43f5e"][i % 4],
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 52,
                    y: Math.sin((i / 8) * Math.PI * 2) * 52,
                    opacity: 0,
                    scale: [1, 1.3, 0.6],
                  }}
                  transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
                  aria-hidden="true"
                />
              ))}
              <Check className="size-8" strokeWidth={3} aria-hidden="true" />
            </motion.div>
            <DialogTitle className="font-display text-xl">Your site is live!</DialogTitle>
            <DialogDescription id="publish-success-description" className="text-center">
              {activeResume?.personal.fullName}&rsquo;s portfolio was published (demo).
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5" role="group" aria-label="Published site URL">
            <Lock className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono text-sm">{fakeUrl}</span>
            <Button size="sm" variant="outline" onClick={handleCopyUrl} aria-label="Copy site URL">
              <Copy aria-hidden="true" />
              Copy URL
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="inline-flex cursor-not-allowed select-none items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground opacity-80"
              aria-disabled="true"
              title="Demo only"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Visit site
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Opens in new tab (demo)</span>
            </span>
            <Button
              onClick={() => setSuccessOpen(false)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
