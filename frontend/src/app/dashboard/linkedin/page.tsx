"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BadgeCheck,
  Briefcase,
  Check,
  ClipboardPaste,
  FileText,
  GraduationCap,
  Info,
  Linkedin,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { parseLinkedInProfile, type LinkedInParsed } from "@/lib/mock-ai";
import { uid, useActiveResume, useResumeStore, type ResumeData } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/account/page-header";
import { fadeUp, staggerContainer } from "@/components/account/motion-presets";

/* ------------------------- Sample LinkedIn export ------------------------- */

const SAMPLE_EXPORT = `Jordan Smith
Senior Product Designer | Design Systems & 0→1 Products
San Francisco, California, United States

About
Product designer with 9+ years crafting intuitive interfaces for B2B SaaS and consumer products. I lead design from discovery through shipped product, blending research, systems thinking, and pixel-level craft.
At Figma I redesigned FigJam onboarding and built the Prism design system; at Airbnb I owned guest checkout, lifting booking conversion by 18%. I care about accessibility, motion, and shipping software that feels effortless.

Experience
Senior Product Designer at Figma
Mar 2021 - Present
• Led the redesign of the FigJam onboarding flow, lifting week-1 retention by 31%
• Built the company-wide design system "Prism", adopted by 12 product teams
• Partnered with engineering to ship multiplayer cursors used by 4M+ users
• Mentored 4 designers; 2 were promoted to senior within 18 months

Product Designer at Airbnb
Jun 2017 - Feb 2021
• Owned the guest checkout redesign, increasing booking conversion by 18%
• Ran 40+ A/B tests and established an experimentation playbook for the growth team
• Shipped the mobile date-picker used by 60M travelers annually

UI Designer at Studio North
Aug 2014 - May 2017
• Delivered 25+ client projects across fintech, health, and travel
• Introduced a component-based workflow that cut delivery time by 30%

Education
Carnegie Mellon University, B.S. Human-Computer Interaction
2009 - 2013
Stanford University, M.S. Design Impact
2013 - 2015

Skills
Product Strategy, Design Systems, Prototyping, User Research, Interaction Design, Figma, Motion Design, HTML/CSS, Usability Testing, Data Visualization`;

const DEMO_ACCOUNTS = [
  { name: "Jordan Smith", email: "jordan.smith@design.co", note: "Primary account" },
  { name: "Jordan Smith", email: "jsmith@studiornorth.co", note: "Freelance studio" },
] as const;

const CONNECT_STEPS = ["Authenticating…", "Fetching profile…", "Parsing sections…"] as const;

const DEFAULT_CHECKED = { basics: true, summary: true, experience: true, education: true, skills: true };
type CheckedState = typeof DEFAULT_CHECKED;

/* ------------------------------ Small pieces ------------------------------ */

function SectionCard({
  id,
  checked,
  onToggle,
  title,
  icon: Icon,
  count,
  countLabel,
  hint,
  disabled,
  children,
}: {
  id: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  countLabel: string;
  hint: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn("transition-colors", checked && !disabled && "border-emerald-500/30 bg-emerald-500/[0.03]")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={id}
            checked={disabled ? false : checked}
            onCheckedChange={(v) => onToggle(v === true)}
            disabled={disabled}
            aria-label={`Import ${title}`}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={id} className={cn("flex items-center gap-2 font-semibold", disabled && "opacity-60")}>
                <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                {title}
              </Label>
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                {count} {countLabel}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">{hint}</p>
            <div className="mt-3">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function LinkedInPage() {
  const mounted = useMounted();
  const activeResume = useActiveResume();

  const [text, setText] = React.useState("");
  const [parsed, setParsed] = React.useState<LinkedInParsed | null>(null);
  const [shownConfidence, setShownConfidence] = React.useState(0);
  const [checked, setChecked] = React.useState<CheckedState>(DEFAULT_CHECKED);

  // Connect-with-LinkedIn (fake OAuth) flow
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [accountIdx, setAccountIdx] = React.useState("0");
  const [connecting, setConnecting] = React.useState(false);
  const [connectStep, setConnectStep] = React.useState(0);

  // Import result
  const [importedOpen, setImportedOpen] = React.useState(false);
  const [importedCount, setImportedCount] = React.useState(0);
  const [importedTarget, setImportedTarget] = React.useState("");

  const parseAnchorRef = React.useRef<HTMLDivElement>(null);

  // Animate the confidence meter whenever a new parse lands
  React.useEffect(() => {
    if (!parsed) return;
    setShownConfidence(0);
    const timer = window.setTimeout(() => setShownConfidence(parsed.confidence), 200);
    return () => window.clearTimeout(timer);
  }, [parsed]);

  const applyParsed = (value: LinkedInParsed) => {
    setParsed(value);
    setChecked(DEFAULT_CHECKED);
  };

  const scrollToParse = () => {
    window.setTimeout(() => {
      parseAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  };

  /* -------- Path A: fake OAuth connect flow -------- */
  const runConnectFlow = async () => {
    setConnecting(true);
    setConnectStep(0);
    for (let i = 0; i < CONNECT_STEPS.length; i++) {
      setConnectStep(i);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    setText(SAMPLE_EXPORT);
    applyParsed(parseLinkedInProfile(SAMPLE_EXPORT));
    setConnecting(false);
    setConnectOpen(false);
    toast.success("Connected as Jordan Smith", {
      description: "Profile fetched and parsed — review the sections below.",
    });
    scrollToParse();
  };

  /* -------- Path B: manual paste -------- */
  const handleParse = () => {
    if (text.trim().length < 30) {
      toast.error("Nothing to parse yet", { description: "Paste your LinkedIn profile text into the box first." });
      return;
    }
    const result = parseLinkedInProfile(text);
    applyParsed(result);
    if (result.confidence === 0) {
      toast.error("Couldn't recognize any sections", {
        description: "Make sure the text includes headers like About, Experience, Education and Skills.",
      });
      return;
    }
    toast.success("Profile parsed", { description: `${result.confidence}% parsing confidence detected.` });
    scrollToParse();
  };

  /* -------- Import -------- */
  const buildPatch = (p: LinkedInParsed, base: ResumeData): { patch: Partial<ResumeData>; count: number } => {
    const patch: Partial<ResumeData> = {};
    let count = 0;

    if (checked.basics && (p.name || p.headline || p.location)) {
      patch.personal = {
        ...base.personal,
        fullName: p.name || base.personal.fullName,
        jobTitle: p.headline || base.personal.jobTitle,
        location: p.location || base.personal.location,
      };
      count += 1;
    }
    if (checked.summary && p.summary) {
      patch.summary = p.summary;
      count += 1;
    }
    if (checked.experience) {
      if (p.experience.length === 0) {
        toast.warning("No experience entries detected — skipping Experience");
      } else {
        patch.experience = p.experience.map((exp) => ({
          id: uid(),
          company: exp.company,
          role: exp.role,
          location: "",
          startDate: "",
          endDate: "",
          current: /present/i.test(exp.period),
          bullets: exp.bullets,
        }));
        count += 1;
      }
    }
    if (checked.education) {
      if (p.education.length === 0) {
        toast.warning("No education entries detected — skipping Education");
      } else {
        patch.education = p.education.map((edu) => ({
          id: uid(),
          school: edu.school,
          degree: edu.degree,
          field: "",
          startDate: "",
          endDate: edu.period,
          gpa: "",
        }));
        count += 1;
      }
    }
    if (checked.skills) {
      if (p.skills.length === 0) {
        toast.warning("No skills detected — skipping Skills");
      } else {
        patch.skills = p.skills.map((name) => ({ id: uid(), name, level: 4 }));
        count += 1;
      }
    }
    return { patch, count };
  };

  const importInto = (targetId: string, asNew: boolean) => {
    if (!parsed) return;
    const base = useResumeStore.getState().resumes.find((r) => r.id === targetId);
    if (!base) return;
    const { patch, count } = buildPatch(parsed, base);
    if (count === 0 || Object.keys(patch).length === 0) {
      toast.error("Nothing to import", {
        description: "Tick at least one section that has parsed content.",
      });
      return;
    }
    if (asNew) {
      const newId = useResumeStore.getState().createResume(`${parsed.name || "LinkedIn"} — LinkedIn`, "modern");
      useResumeStore.getState().updateResume(newId, patch);
      setImportedTarget(`${parsed.name || "LinkedIn"} — LinkedIn`);
    } else {
      useResumeStore.getState().updateResume(targetId, patch);
      setImportedTarget(base.title);
    }
    setImportedCount(count);
    setImportedOpen(true);
  };

  const handleClear = () => {
    setText("");
    setParsed(null);
    setChecked(DEFAULT_CHECKED);
    setConnectStep(0);
    toast.info("Cleared", { description: "Ready for a fresh import." });
  };

  const hasParsedContent = Boolean(parsed);
  const importDisabled = !mounted || !parsed || !activeResume;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        icon={Linkedin}
        eyebrow="Account Tools"
        title="LinkedIn Import"
        description="Skip the copy-typing. Connect your LinkedIn account or paste your profile text, review what we parsed, and merge it into your resume."
      />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
        {/* ---------- Two import paths ---------- */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Path A — Connect with LinkedIn */}
          <motion.section variants={fadeUp} aria-label="Connect with LinkedIn">
            <Card className="relative h-full overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"
                aria-hidden="true"
              />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-7 items-center justify-center rounded-md bg-[#0A66C2] text-white" aria-hidden="true">
                    <Linkedin className="size-4" />
                  </span>
                  Connect with LinkedIn
                </CardTitle>
                <CardDescription>
                  Recommended — sign in with a demo account and we&apos;ll fetch your profile automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    One-click profile fetch (simulated OAuth)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Auto-fills the parser with your profile text
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Read-only — we never post on your behalf
                  </li>
                </ul>
                <Button
                  onClick={() => setConnectOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500/90 hover:to-teal-600/90"
                  aria-label="Connect with LinkedIn"
                >
                  <Linkedin aria-hidden="true" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          {/* Path B — Paste your profile */}
          <motion.section variants={fadeUp} aria-label="Paste your LinkedIn profile">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardPaste className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Paste your profile
                </CardTitle>
                <CardDescription>Copy your LinkedIn profile text and paste it below — parsing happens instantly, in your browser.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Accordion type="single" collapsible>
                  <AccordionItem value="how-to-export">
                    <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Info className="size-4" aria-hidden="true" />
                        How to export your profile
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                        <li>Open LinkedIn → your profile → <span className="font-medium text-foreground">Settings &amp; Privacy</span>.</li>
                        <li>Under &ldquo;Data privacy&rdquo;, click <span className="font-medium text-foreground">Get a copy of your data</span>.</li>
                        <li>Choose the fast download — it includes your profile text.</li>
                        <li>Open the file and copy the profile section.</li>
                        <li>Paste it below. Headers like <em>About</em>, <em>Experience</em>, <em>Education</em> and <em>Skills</em> help the parser.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Label htmlFor="linkedin-text" className="sr-only">
                  LinkedIn profile text
                </Label>
                <Textarea
                  id="linkedin-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Jordan Smith\nSenior Product Designer | …\nSan Francisco, California, United States\n\nAbout\n…\n\nExperience\nSenior Product Designer at Figma\n…"}
                  className="h-44 resize-y font-mono text-xs lg:h-52"
                  aria-describedby="linkedin-text-hint"
                />
                <div className="flex items-center justify-between gap-3">
                  <p id="linkedin-text-hint" className="text-xs text-muted-foreground">
                    {text.length.toLocaleString()} characters pasted
                  </p>
                  <Button
                    onClick={handleParse}
                    disabled={!text.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
                    aria-label="Parse pasted LinkedIn profile"
                  >
                    <Sparkles aria-hidden="true" />
                    Parse profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* ---------- Parse results ---------- */}
        <div ref={parseAnchorRef} className="scroll-mt-20" aria-hidden="true" />
        {parsed ? (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
            aria-label="Parsed profile preview"
          >
            {/* Confidence meter */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display flex items-center gap-2 text-base font-semibold">
                    <BadgeCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Parsing confidence
                  </h2>
                  <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400" aria-live="polite">
                    {parsed.confidence}%
                  </span>
                </div>
                <Progress
                  value={shownConfidence}
                  className="mt-3 h-2.5"
                  aria-label={`Parsing confidence ${parsed.confidence} percent`}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {parsed.confidence >= 80
                    ? "Great — all major sections were detected and mapped."
                    : parsed.confidence >= 40
                      ? "Decent — some sections may be missing. Tweak the paste and re-parse for a better result."
                      : "Low confidence — check that your paste includes clear section headers (About, Experience, Education, Skills)."}
                </p>
              </CardContent>
            </Card>

            {/* Parsed sections */}
            <div className="grid gap-4 md:grid-cols-2">
              <SectionCard
                id="sec-basics"
                checked={checked.basics}
                onToggle={(v) => setChecked((c) => ({ ...c, basics: v }))}
                title="Basics"
                icon={User}
                count={[parsed.name, parsed.headline, parsed.location].filter(Boolean).length}
                countLabel="fields"
                hint="→ becomes your personal info (name, title, location)"
                disabled={!parsed.name && !parsed.headline && !parsed.location}
              >
                <div className="space-y-1.5 text-sm">
                  {parsed.name ? (
                    <p className="font-semibold">{parsed.name}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Name not detected</p>
                  )}
                  {parsed.headline ? <p className="text-muted-foreground">{parsed.headline}</p> : null}
                  {parsed.location ? (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {parsed.location}
                    </p>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard
                id="sec-summary"
                checked={checked.summary}
                onToggle={(v) => setChecked((c) => ({ ...c, summary: v }))}
                title="Summary"
                icon={FileText}
                count={parsed.summary ? 1 : 0}
                countLabel="block"
                hint="→ becomes your Summary"
                disabled={!parsed.summary}
              >
                <p className="line-clamp-4 rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
                  {parsed.summary || "No summary detected in the pasted text."}
                </p>
              </SectionCard>

              <SectionCard
                id="sec-experience"
                checked={checked.experience}
                onToggle={(v) => setChecked((c) => ({ ...c, experience: v }))}
                title="Experience"
                icon={Briefcase}
                count={parsed.experience.length}
                countLabel="roles"
                hint="→ becomes your Experience entries"
                disabled={parsed.experience.length === 0}
              >
                {parsed.experience.length > 0 ? (
                  <ul className="max-h-44 space-y-2.5 overflow-y-auto scrollbar-thin pr-1" role="list">
                    {parsed.experience.map((exp, i) => (
                      <li key={`${exp.company}-${i}`} className="rounded-md border p-2.5 text-sm">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{exp.role}</span>
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{exp.period}</span>
                        </div>
                        <p className="text-muted-foreground">{exp.company}</p>
                        {exp.bullets.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">{exp.bullets.length} bullet{exp.bullets.length === 1 ? "" : "s"} captured</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No roles detected.</p>
                )}
              </SectionCard>

              <SectionCard
                id="sec-education"
                checked={checked.education}
                onToggle={(v) => setChecked((c) => ({ ...c, education: v }))}
                title="Education"
                icon={GraduationCap}
                count={parsed.education.length}
                countLabel="entries"
                hint="→ becomes your Education entries"
                disabled={parsed.education.length === 0}
              >
                {parsed.education.length > 0 ? (
                  <ul className="max-h-32 space-y-2.5 overflow-y-auto scrollbar-thin pr-1" role="list">
                    {parsed.education.map((edu, i) => (
                      <li key={`${edu.school}-${i}`} className="rounded-md border p-2.5 text-sm">
                        <p className="font-medium">{edu.school}</p>
                        <p className="text-muted-foreground">
                          {edu.degree}
                          {edu.period ? <span className="font-mono text-[10px]"> · {edu.period}</span> : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No education detected.</p>
                )}
              </SectionCard>

              <SectionCard
                id="sec-skills"
                checked={checked.skills}
                onToggle={(v) => setChecked((c) => ({ ...c, skills: v }))}
                title="Skills"
                icon={Wrench}
                count={parsed.skills.length}
                countLabel="skills"
                hint="→ become your Skills (level 4 of 5)"
                disabled={parsed.skills.length === 0}
                >
                {parsed.skills.length > 0 ? (
                  <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin" role="list">
                    {parsed.skills.map((skill) => (
                      <span
                        key={skill}
                        role="listitem"
                        className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills detected.</p>
                )}
              </SectionCard>
            </div>

            {/* Import actions */}
            <Card>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Import into active resume</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Target: {activeResume ? activeResume.title : "no active resume"} — checked sections only; everything else is left untouched.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => importInto(activeResume!.id, true)}
                  disabled={importDisabled}
                  aria-label="Import as a new resume"
                >
                  <Sparkles aria-hidden="true" />
                  Import as new resume
                </Button>
                <Button
                  onClick={() => importInto(activeResume!.id, false)}
                  disabled={importDisabled}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500/90 hover:to-teal-600/90"
                  aria-label="Import checked sections into the active resume"
                >
                  <BadgeCheck aria-hidden="true" />
                  Import into active resume
                </Button>
                <Button variant="ghost" onClick={handleClear} aria-label="Clear import state">
                  <RotateCcw aria-hidden="true" />
                  Clear
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        ) : (
          <motion.section variants={fadeUp} aria-label="No parsed profile yet">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Linkedin className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold">Nothing parsed yet</h2>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Connect your account or paste your LinkedIn profile text above — parsed sections will appear here for review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </motion.div>

      {/* ---------- Fake OAuth dialog ---------- */}
      <Dialog open={connectOpen} onOpenChange={(open) => { if (!connecting) setConnectOpen(open); }}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md" aria-describedby="connect-dialog-description">
          {/* LinkedIn-style dark header */}
          <div className="flex items-center gap-3 bg-zinc-900 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] text-white" aria-hidden="true">
              <Linkedin className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-50">Connect with LinkedIn</DialogTitle>
              <p className="text-xs text-zinc-400">Secure demo authorization · read-only scope</p>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            {connecting ? (
              <div className="flex flex-col gap-4 py-2" aria-live="polite">
                {CONNECT_STEPS.map((step, i) => {
                  const done = connectStep > i;
                  const active = connectStep === i;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      {done ? (
                        <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                          <Check className="size-4" strokeWidth={3} />
                        </span>
                      ) : active ? (
                        <LoaderCircle className="size-7 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <span className="size-7 rounded-full border-2 border-muted" aria-hidden="true" />
                      )}
                      <span className={cn("text-sm", done || active ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <DialogHeader className="mb-3">
                  <DialogDescription id="connect-dialog-description" className="text-left">
                    Choose an account to continue to <span className="font-medium text-foreground">ResumeForge AI</span>.
                  </DialogDescription>
                </DialogHeader>
                <RadioGroup value={accountIdx} onValueChange={setAccountIdx} className="gap-2">
                  {DEMO_ACCOUNTS.map((account, i) => (
                    <Label
                      key={account.email}
                      htmlFor={`account-${i}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                        accountIdx === String(i)
                          ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <RadioGroupItem id={`account-${i}`} value={String(i)} className="sr-only" />
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-display text-sm font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                        aria-hidden="true"
                      >
                        JS
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{account.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{account.note}</span>
                    </Label>
                  ))}
                </RadioGroup>
                <Button
                  onClick={runConnectFlow}
                  className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90"
                  aria-label="Continue with the selected account"
                >
                  <Linkedin aria-hidden="true" />
                  Continue
                </Button>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                  This is a demo — no real LinkedIn request is made. A sample profile (Jordan Smith) will be imported.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Import success dialog ---------- */}
      <Dialog open={importedOpen} onOpenChange={setImportedOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby="import-success-description">
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <BadgeCheck className="size-7" aria-hidden="true" />
            </motion.div>
            <DialogTitle className="font-display text-xl">
              Imported {importedCount} section{importedCount === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription id="import-success-description" className="text-center">
              Your LinkedIn data was merged into <span className="font-medium text-foreground">{importedTarget}</span>. Review and fine-tune it in Resume Studio.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setImportedOpen(false)}>
              Done
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-500/90 hover:to-teal-600/90">
              <Link href="/dashboard/builder">
                Open Resume Studio
                <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
