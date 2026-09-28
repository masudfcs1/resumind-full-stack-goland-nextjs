"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, FileText, Loader2, Plus } from "lucide-react";
import { useActiveResume, useResumeStore, type ResumeData } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { STEPS, StepNav, StepProgress, type StepId } from "@/components/builder/step-nav";
import { ResumeBar } from "@/components/builder/resume-bar";
import PreviewPane from "@/components/builder/preview-pane";
import FormPersonal from "@/components/builder/forms-personal";
import FormSummary from "@/components/builder/forms-summary";
import FormExperience from "@/components/builder/forms-experience";
import FormEducation from "@/components/builder/forms-education";
import FormSkills from "@/components/builder/forms-skills";
import FormProjects from "@/components/builder/forms-projects";
import FormExtras from "@/components/builder/forms-extras";
import FormDesign from "@/components/builder/forms-design";

const STEP_FORMS: Record<StepId, React.ComponentType<{ resume: ResumeData }>> = {
  personal: FormPersonal,
  summary: FormSummary,
  experience: FormExperience,
  education: FormEducation,
  skills: FormSkills,
  projects: FormProjects,
  extras: FormExtras,
  design: FormDesign,
};

function NoResumeState() {
  const createResume = useResumeStore((s) => s.createResume);
  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] items-center justify-center bg-muted/30 md:-m-6 lg:-m-8">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
          <FileText className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-bold tracking-tight">No resume selected</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Create a resume to open the studio — every field autosaves as you type.
        </p>
        <Button
          onClick={() => createResume()}
          className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="h-4 w-4" aria-hidden /> Create resume
        </Button>
      </div>
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] items-center justify-center bg-muted/30 md:-m-6 lg:-m-8">
      <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" aria-hidden />
        <p className="text-sm font-medium">Preparing your studio…</p>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const mounted = useMounted();
  const resume = useActiveResume();
  const [step, setStep] = React.useState<StepId>("personal");
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  function go(next: StepId) {
    if (next === step) return;
    const from = STEPS.findIndex((s) => s.id === step);
    const to = STEPS.findIndex((s) => s.id === next);
    setDir(to > from ? 1 : -1);
    setStep(next);
  }

  if (!mounted) return <BuilderSkeleton />;
  if (!resume) return <NoResumeState />;

  const StepForm = STEP_FORMS[step];

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-muted/30 md:-m-6 lg:-m-8 lg:flex-row">
      {/* ============ Left zone: selector · steps · progress ============ */}
      <aside className="flex shrink-0 flex-col bg-background/80 backdrop-blur lg:w-[200px] lg:border-r">
        <ResumeBar onCreated={() => go("personal")} />
        <StepNav resume={resume} step={step} onSelect={go} />
        <StepProgress resume={resume} className="border-t" />
      </aside>

      {/* ============ Center zone: step forms ============ */}
      <main className="min-w-0 flex-1 overflow-y-auto" aria-label="Resume editor">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:px-6 lg:px-8 xl:pb-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 28 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 * dir }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <StepForm key={`${resume.id}-${step}`} resume={resume} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ============ Right zone: live preview (xl+) ============ */}
      <section
        aria-label="Live resume preview"
        className="hidden w-[46%] min-w-[480px] max-w-[760px] shrink-0 flex-col border-l xl:flex"
      >
        <PreviewPane resume={resume} />
      </section>

      {/* ============ Mobile / tablet floating preview ============ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-5 right-5 z-40 h-12 gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-[14px] font-semibold text-white shadow-xl shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 xl:hidden"
            aria-label="Open live preview"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Preview
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Live resume preview</SheetTitle>
          <PreviewPane resume={resume} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
