"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityBars, type DayActivity } from "./mini-charts";

export const WEEK_ACTIVITY: DayActivity[] = [
  { day: "Mon", value: 7 },
  { day: "Tue", value: 11 },
  { day: "Wed", value: 5 },
  { day: "Thu", value: 14 },
  { day: "Fri", value: 9 },
  { day: "Sat", value: 4 },
  { day: "Sun", value: 12 },
];

export function WeeklyActivityCard() {
  const total = WEEK_ACTIVITY.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              This week&rsquo;s activity
            </CardTitle>
            <CardDescription className="mt-1 text-[12.5px]">
              Edits, scans and exports across your workspace
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
            <Activity className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-baseline gap-2">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-display text-2xl font-bold tracking-tight"
          >
            {total}
          </motion.span>
          <span className="text-[12px] text-muted-foreground">
            actions · <span className="font-medium text-emerald-600 dark:text-emerald-400">+18%</span>{" "}
            vs last week
          </span>
        </div>
        <ActivityBars data={WEEK_ACTIVITY} height={128} />
      </CardContent>
    </Card>
  );
}
