"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

export function WelcomeBanner({
  greeting,
  name,
  subtitle,
  streak,
}: {
  greeting: string;
  name: string;
  subtitle: string;
  streak: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label="Welcome banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-500/20 dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-800"
    >
      {/* Decorative layered shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-14 -top-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute right-28 top-5 h-24 w-24 rotate-12 rounded-2xl bg-white/10" />
        <div className="absolute bottom-4 right-44 h-14 w-14 -rotate-6 rounded-xl bg-white/10" />
        <div className="absolute left-1/2 top-6 h-10 w-10 rotate-45 rounded-lg bg-white/5" />
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
            <Flame className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            {streak}-day streak
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
            {greeting}, {name} <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-emerald-50/90">{subtitle}</p>
        </div>

        {/* Mini glass illustration */}
        <div aria-hidden="true" className="relative hidden shrink-0 sm:block">
          <div className="absolute -inset-3 rounded-full bg-white/10 blur-md" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Sparkles className="h-10 w-10 text-amber-200 drop-shadow" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
