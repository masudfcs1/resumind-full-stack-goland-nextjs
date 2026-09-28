"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Play, Scale, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { CONTAINER, Reveal, scrollToId } from "./shared";

/* FinalCtaFunnel — closing CTA with funnel wiring. Carries the exact visual
 * language of final-cta.tsx (gradient card, dot pattern, glow blobs) and adds:
 *   1. a trust strip above the buttons (3 inline stats, tabular-nums, subtle
 *      dividers, hero-badge framing: pill + uppercase tracked micro-labels);
 *   2. a secondary "Compare plans" button that smooth-scrolls to #pricing;
 *   3. focus-visible rings on both buttons (white on the emerald card).
 * The primary button deep-links to /dashboard like every other funnel entry.
 * final-cta.tsx itself is left untouched; this component supersedes it on the
 * page. */

const TRUST_STATS = [
  { value: "12k+", label: "resumes built" },
  { value: "4.9/5", label: "avg rating" },
  { value: "92%", label: "pass ATS" },
] as const;

export default function FinalCtaFunnel() {
  return (
    <section aria-label="Final call to action" className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-16 text-center shadow-2xl shadow-emerald-600/25 sm:px-16 sm:py-20">
            {/* Dot pattern + glow blobs (carried over from final-cta.tsx) */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div
              aria-hidden
              className="absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-28 -right-20 size-80 rounded-full bg-teal-300/20 blur-3xl"
            />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Your dream job is one resume away
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
                Join 2.1 million job seekers who stopped getting ghosted. Build
                a recruiter-ready, ATS-proof resume in the next 10 minutes.
              </p>

              {/* Trust strip — hero badge language: pill frame, uppercase
                  tracked labels, tabular-nums values, subtle dividers. */}
              <ul
                aria-label="ResumeForge AI by the numbers"
                className="mx-auto mt-9 flex w-fit max-w-full flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 backdrop-blur-sm sm:flex-row sm:gap-0 sm:rounded-full sm:py-2.5"
              >
                {TRUST_STATS.map((stat, i) => (
                  <Fragment key={stat.label}>
                    {i > 0 && (
                      <li
                        aria-hidden
                        className="hidden h-4 w-px bg-white/25 sm:mx-5 sm:block"
                      />
                    )}
                    <li className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold tabular-nums text-white">
                        {stat.value}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-50/85">
                        {stat.label}
                      </span>
                    </li>
                  </Fragment>
                ))}
              </ul>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {/* Primary: the zero-friction live demo — the same funnel the
                    navbar and hero feed. Secondary: plan comparison. */}
                <Link
                  href="/dashboard"
                  onClick={() => useAuthStore.getState().enterDemo()}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-emerald-700 shadow-xl shadow-emerald-900/20 transition-all duration-200 hover:bg-emerald-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
                >
                  <Play className="size-5 fill-current" aria-hidden />
                  Try the live demo — it&apos;s free
                </Link>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("pricing");
                  }}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-8 text-base font-bold text-white transition-all duration-200 hover:bg-white/20 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
                >
                  <Scale className="size-5" aria-hidden />
                  Compare plans
                </a>
              </div>

              <p className="mt-5 text-sm font-medium text-emerald-50/90">
                Prefer an account?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  Sign up free
                </Link>
              </p>

              <p className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-100/85">
                <ShieldCheck className="size-4" aria-hidden />
                No credit card required · Free plan forever
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
