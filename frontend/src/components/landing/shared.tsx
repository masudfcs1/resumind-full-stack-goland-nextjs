"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- */
/* Smooth anchor scrolling with sticky-header offset                 */
/* ---------------------------------------------------------------- */
export function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/* ---------------------------------------------------------------- */
/* Brand logo                                                        */
/* ---------------------------------------------------------------- */
export function Logo({
  className,
  tone = "default",
}: {
  className?: string;
  /** "light" renders white text for use on dark brand panels (auth pages). */
  tone?: "default" | "light";
}) {
  return (
    <Link
      href="/"
      aria-label="ResumeForge AI — home"
      className={cn("group flex w-fit items-center gap-2.5", className)}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
        <Sparkles className="size-[18px]" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          tone === "light" ? "text-white" : "text-foreground"
        )}
      >
        Resume
        <span className={tone === "light" ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"}>
          Forge
        </span>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------- */
/* Scroll-reveal wrapper                                             */
/* ---------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/* Eyebrow pill                                                      */
/* ---------------------------------------------------------------- */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Section heading                                                   */
/* ---------------------------------------------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

/* ---------------------------------------------------------------- */
/* Animated counter (springs up when scrolled into view)             */
/* ---------------------------------------------------------------- */
export function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 42, damping: 16, mass: 1 });
  const text = useTransform(
    spring,
    (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`
  );

  React.useEffect(() => {
    // Reduced motion: no count-up — the final value renders immediately.
    if (reduced) {
      spring.jump(to);
      return;
    }
    if (inView) mv.set(to);
  }, [inView, mv, spring, to, reduced]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </motion.span>
  );
}

/* ---------------------------------------------------------------- */
/* Gradient primary CTA button (Link)                                */
/* ---------------------------------------------------------------- */
export function GradientButton({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const isHash = href.startsWith("#");
  return (
    <Link
      href={href}
      onClick={
        onClick ??
        (isHash
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              scrollToId(href.slice(1));
            }
          : undefined)
      }
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {children}
    </Link>
  );
}
