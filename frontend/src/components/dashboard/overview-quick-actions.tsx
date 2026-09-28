"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Globe,
  Linkedin,
  Mail,
  PenLine,
  SpellCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Tone = "emerald" | "teal" | "amber" | "violet" | "rose";

const TONE_CLASSES: Record<Tone, string> = {
  emerald:
    "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 group-hover:bg-teal-500/20 dark:text-teal-400",
  amber: "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-600 group-hover:bg-rose-500/20 dark:text-rose-400",
};

const ACTIONS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}> = [
  { href: "/dashboard/builder", label: "Resume Studio", icon: PenLine, tone: "emerald" },
  { href: "/dashboard/ats", label: "ATS Scanner", icon: Target, tone: "amber" },
  { href: "/dashboard/grammar", label: "Grammar Check", icon: SpellCheck, tone: "violet" },
  { href: "/dashboard/cover-letter", label: "Cover Letter", icon: Mail, tone: "teal" },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Globe, tone: "rose" },
  { href: "/dashboard/linkedin", label: "LinkedIn Import", icon: Linkedin, tone: "emerald" },
];

export function QuickActionsCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">Quick actions</CardTitle>
        <CardDescription className="text-[12.5px]">Jump straight into a tool</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              >
                <Link
                  href={action.href}
                  className="group flex h-full flex-col gap-2 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open ${action.label}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        TONE_CLASSES[action.tone]
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[12.5px] font-medium leading-tight">{action.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
