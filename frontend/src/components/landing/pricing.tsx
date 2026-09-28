"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { CONTAINER, Eyebrow, Reveal } from "./shared";

/* ---------------------------------------------------------------- */

type Billing = "monthly" | "annual";

interface Tier {
  id: string;
  name: string;
  tagline: string;
  /** Sticker price per month on monthly billing. */
  monthly: number;
  /** Static suffix next to the price ("forever", "/month", …). */
  unit: string;
  cta: string;
  popular?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For trying things out",
    monthly: 0,
    unit: "forever",
    cta: "Start for free",
    features: [
      "3 resumes",
      "6 classic templates",
      "Basic ATS check",
      "1-click PDF export",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Everything to land the job",
    monthly: 12,
    unit: "/month",
    cta: "Go Pro",
    popular: true,
    features: [
      "Unlimited resumes",
      "All 60+ ATS templates",
      "AI writing assistant",
      "ATS score scanner",
      "Grammar checker",
      "AI cover letters",
      "Portfolio site generator",
      "LinkedIn import",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    tagline: "Pay once, forge forever",
    monthly: 149,
    unit: "one-time payment",
    cta: "Get Lifetime",
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Priority support",
      "Early-access features",
      "Exclusive executive templates",
    ],
  },
];

/** Annual billing = "2 months free": pay for 10 of 12 months, shown as a
 *  rounded monthly equivalent — round(monthly × 10 / 12). Pro: 12 → 10. */
function annualMonthly(monthly: number): number {
  return Math.round((monthly * 10) / 12);
}

function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/* ---------------------------------------------------------------- */

export default function Pricing() {
  // Deterministic initial state ("monthly") — server and client agree.
  const [billing, setBilling] = React.useState<Billing>("monthly");
  const reduced = useReducedMotion();

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <div className={CONTAINER}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2
            id="pricing-heading"
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            One interview pays for a decade of Pro
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel
            anytime in one click.
          </p>
        </Reveal>

        {/* Billing toggle — segmented pill. Both segments stay in the tab
            order and carry aria-pressed; the "Save ~17%" chip is always
            rendered on the Annual side so the toggle never changes width. */}
        <Reveal className="mt-9 flex justify-center" y={14}>
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm"
          >
            {(["monthly", "annual"] as const).map((b) => {
              const selected = billing === b;
              return (
                <button
                  key={b}
                  type="button"
                  data-billing={b}
                  aria-pressed={selected}
                  onClick={() => setBilling(b)}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {b === "monthly" ? "Monthly" : "Annual"}
                  {b === "annual" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold leading-4",
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                      )}
                    >
                      Save ~17%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Tiers */}
        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const isLifetime = tier.id === "lifetime";
            const price =
              !isLifetime && billing === "annual"
                ? annualMonthly(tier.monthly)
                : tier.monthly;
            const billedNote = isLifetime
              ? "yours forever, updates included"
              : tier.id === "free"
                ? "no credit card required"
                : billing === "annual"
                  ? "billed annually · 2 months free"
                  : "billed monthly";

            const card = (
              <div
                className={cn(
                  "relative flex h-full flex-col p-7",
                  tier.popular
                    ? "rounded-[14px] bg-card"
                    : "rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5"
                )}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30 dark:from-emerald-700 dark:to-teal-800">
                    <Sparkles className="size-3" aria-hidden />
                    Most popular
                  </span>
                )}

                <h3 className="font-display text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

                {/* Fixed-height rows so the price swap never shifts layout */}
                <div className="mt-6 flex h-14 items-end gap-1.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`${tier.id}-${billing}`}
                      data-price={tier.id}
                      initial={{ y: reduced ? 0 : 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: reduced ? 0 : -8, opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, ease: "easeOut" }}
                      className={cn(
                        "font-display text-5xl font-extrabold tracking-tight",
                        tier.popular
                          ? "bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300"
                          : "text-foreground"
                      )}
                    >
                      {formatPrice(price)}
                    </motion.span>
                  </AnimatePresence>
                  <span className="pb-1.5 text-xs font-medium text-muted-foreground">
                    {tier.unit}
                  </span>
                </div>
                <p aria-live="polite" className="mt-1.5 h-4 text-xs text-muted-foreground">
                  {billedNote}
                </p>

                <ul className="mt-7 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                          tier.popular
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Check className="size-3" aria-hidden />
                      </span>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.id === "free" ? "/dashboard" : "/signup"}
                  onClick={
                    tier.id === "free"
                      ? () => useAuthStore.getState().enterDemo()
                      : undefined
                  }
                  className={cn(
                    "mt-8 inline-flex h-11 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 active:scale-[0.97]",
                    tier.popular
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-105"
                      : "border border-border bg-background text-foreground hover:border-emerald-500/40 hover:bg-accent"
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            );

            return (
              <Reveal key={tier.id} delay={i * 0.1} className="h-full">
                {tier.popular ? (
                  /* Gradient "border" wrapper — lifts the shadow on hover to
                     match the bento-card treatment (inner card stays put so
                     the two hover transforms don't stack). */
                  <div className="h-full rounded-2xl bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-600 p-[2px] shadow-xl shadow-emerald-500/20 transition-shadow duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 lg:-translate-y-3 dark:from-emerald-500 dark:via-teal-500 dark:to-emerald-700">
                    {card}
                  </div>
                ) : (
                  card
                )}
              </Reveal>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in USD. Annual billing saves ~17% — that&apos;s Pro for{" "}
          {formatPrice(annualMonthly(TIERS[1].monthly))}/mo, billed once a year.
        </p>
      </div>
    </section>
  );
}
