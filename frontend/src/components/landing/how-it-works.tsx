"use client";

import * as React from "react";
import { Rocket, Upload, WandSparkles } from "lucide-react";
import { CONTAINER, Reveal, SectionHeading } from "./shared";

const STEPS = [
  {
    icon: Upload,
    title: "Import or start fresh",
    desc: "Pull in your LinkedIn profile, upload an old resume, or start from a blank page — either way you're done in under a minute.",
  },
  {
    icon: WandSparkles,
    title: "Let AI polish every bullet",
    desc: "The assistant rewrites weak lines into quantified achievements, fixes grammar, and injects keywords from your target job post.",
  },
  {
    icon: Rocket,
    title: "Export & track your score",
    desc: "Download a pixel-perfect PDF and watch your ATS score climb from the 60s into the 90s before you hit apply.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section aria-label="How it works" className="border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to a sharper resume"
          description="No design skills, no resume-writing courses. Just a fast loop of import, improve, and ship."
        />

        <div className="relative mt-16">
          {/* Dashed connector (desktop) */}
          <div
            aria-hidden
            className="absolute left-[17%] right-[17%] top-10 hidden border-t-2 border-dashed border-emerald-500/30 md:block"
          />

          <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.15}>
                <li className="relative flex h-full flex-col items-center rounded-2xl border bg-card p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10">
                  <div className="relative mb-5">
                    <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-background">
                      <step.icon className="size-8" aria-hidden />
                    </span>
                    <span className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-foreground font-display text-xs font-extrabold text-background">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
