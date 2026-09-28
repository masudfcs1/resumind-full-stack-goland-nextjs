"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMounted } from "@/lib/use-mounted";
import { CONTAINER } from "./shared";

const COMPANIES = [
  { name: "Google", cls: "font-extrabold tracking-tight" },
  { name: "Meta", cls: "font-bold tracking-tight" },
  { name: "Stripe", cls: "font-semibold italic" },
  { name: "Netflix", cls: "font-black uppercase tracking-[0.08em]" },
  { name: "Airbnb", cls: "font-bold" },
  { name: "Spotify", cls: "font-extrabold tracking-tight" },
  { name: "Uber", cls: "font-medium uppercase tracking-[0.22em]" },
  { name: "Tesla", cls: "font-bold uppercase tracking-[0.14em]" },
  { name: "Amazon", cls: "font-semibold lowercase" },
  { name: "Slack", cls: "font-bold tracking-tight" },
  { name: "Figma", cls: "font-semibold" },
  { name: "Shopify", cls: "font-bold italic" },
] as const;

export default function LogoMarquee() {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  // Post-hydration flag so SSR markup stays stable; used for the QA-observable
  // paused-state attribute. Under prefers-reduced-motion the marquee is frozen.
  const paused = mounted && reduced;

  return (
    <section aria-label="Trusted by teams" className="border-y border-border/60 bg-muted/30 py-9">
      <div className={CONTAINER}>
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Trusted by teams at
        </p>
        <div
          aria-hidden
          className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
        >
          <motion.div
            className="flex w-max items-center gap-16 pr-16"
            data-marquee-state={paused ? "paused" : "running"}
            animate={reduced ? { x: "0%" } : { x: ["0%", "-50%"] }}
            transition={
              reduced ? { duration: 0 } : { repeat: Infinity, duration: 32, ease: "linear" }
            }
          >
            {[...COMPANIES, ...COMPANIES].map((c, i) => (
              <span
                key={`${c.name}-${i}`}
                className={`font-display whitespace-nowrap text-xl text-foreground/35 transition-colors hover:text-foreground/60 dark:text-foreground/30 sm:text-2xl ${c.cls}`}
              >
                {c.name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
