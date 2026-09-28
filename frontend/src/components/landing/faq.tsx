"use client";

import * as React from "react";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTAINER, Reveal, SectionHeading, scrollToId } from "./shared";

const FAQS = [
  {
    q: "Is my data private?",
    a: "Completely. Your resumes live in your own browser's local storage — nothing is uploaded to a server, and nothing is used to train models. Clearing your browser data or hitting 'Reset demo data' in Settings wipes everything instantly.",
  },
  {
    q: "Will my resume actually beat the ATS?",
    a: "That's the whole point. Our scanner mirrors how popular applicant-tracking systems parse documents: it checks keyword coverage against the job description, quantifies impact, and validates formatting. Users average a 94/100 score after optimizing, versus 62 for typical DIY resumes.",
  },
  {
    q: "Can I export to PDF?",
    a: "Yes — one click gives you a pixel-perfect A4 PDF that keeps columns, fonts, and colors exactly as designed, so no recruiter's PDF viewer can mangle it. Plain-text export is also available for job boards that parse raw text.",
  },
  {
    q: "What formats and templates are supported?",
    a: "Six signature templates (Modern, Classic, Minimal, Creative, Executive, Technical) with 60+ variations across tech, finance, healthcare, design, and more. Each has a matched accent color system, and every layout is tested against ATS parsers before release.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Anytime, in one click, no emails or phone calls required. You keep Pro features until the end of your billing period, and your resumes stay accessible on the Free plan forever.",
  },
  {
    q: "Do you have templates for my field?",
    a: "Almost certainly — the gallery covers engineering, product, design, marketing, sales, finance, healthcare, academia, and skilled trades. Filter by field in the template gallery, or let the AI recommend the three best fits based on your target role.",
  },
] as const;

export default function Faq() {
  return (
    <section id="faq" aria-label="Frequently asked questions" className="scroll-mt-20 border-t border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything people ask before they hit 'Build my resume'."
        />

        <Reveal className="mx-auto mt-12 max-w-3xl" delay={0.1}>
          <Accordion type="single" collapsible className="rounded-2xl border bg-card px-6 shadow-sm">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="py-5 text-left text-[15px] font-semibold hover:no-underline hover:text-emerald-700 dark:hover:text-emerald-400">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        {/* Still-have-questions card — gives the FAQ a professional close
            with a next step instead of dead-ending the section. */}
        <Reveal className="mx-auto mt-6 max-w-3xl" delay={0.15}>
          <div
            data-faq-contact
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.07] to-teal-500/[0.07] px-6 py-5 shadow-sm sm:flex-row dark:border-emerald-400/20 dark:from-emerald-500/[0.08] dark:to-teal-500/[0.08]"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <MessageCircleQuestion className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Still have questions?
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Real humans answer within one business day.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("pricing");
                }}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-emerald-500/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Compare plans
              </a>
              <a
                href="mailto:support@resumeforge.ai"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:shadow-lg hover:shadow-emerald-500/35 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Contact support
                <ArrowRight className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
