"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerItem } from "./variants";

interface ToolPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Right-aligned action area (selectors, primary buttons). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header for the AI tool pages:
 * gradient icon tile + display-font title + description, with an actions slot.
 * Participates in the parent `staggerContainer` animation.
 */
export function ToolPageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: ToolPageHeaderProps) {
  return (
    <motion.header
      variants={staggerItem}
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        >
          <Icon className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </motion.header>
  );
}
