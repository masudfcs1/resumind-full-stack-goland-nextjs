"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
  icon: LucideIcon;
}

export function ChecklistCard({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Finish your resume
            </CardTitle>
            <CardDescription className="text-[12.5px]">
              {doneCount} of {items.length} steps complete
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <ListChecks className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={pct} className="mb-4 h-2" aria-label={`Checklist progress ${pct}%`} />

        <ul className="space-y-1">
          {items.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition-colors",
                  item.done ? "text-muted-foreground" : "hover:bg-muted/60",
                  !item.done && item.href && "group text-foreground"
                )}
              >
                {item.done ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="h-4 w-4 shrink-0 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                <Icon className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                <span className={cn("flex-1 truncate", item.done && "line-through opacity-70")}>
                  {item.label}
                </span>
                {!item.done && item.href && (
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500"
                    aria-hidden="true"
                  />
                )}
              </motion.span>
            );

            return (
              <li key={item.label}>
                {item.href && !item.done ? (
                  <Link href={item.href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

