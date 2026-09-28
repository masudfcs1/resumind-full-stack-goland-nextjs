"use client";

import { FileDown, ShieldCheck, Trash2, UserX, type LucideIcon } from "lucide-react";
import { CONTAINER, Reveal } from "./shared";

/* TrustBand — a compact privacy/security assurance strip rendered right
 * before the final CTA. Professional landing pages close the sale by
 * de-risking it; these four guarantees answer the last objections
 * ("where does my data go?", "can I get my file out?", "am I locked in?"). */

const ITEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Resumes live in your browser's local storage — nothing is uploaded, nothing trains models.",
  },
  {
    icon: FileDown,
    title: "Export anywhere",
    body: "Pixel-perfect A4 PDF, plain text for job boards, and JSON backups you own.",
  },
  {
    icon: UserX,
    title: "No sign-up walls",
    body: "Your workspace is ready the moment you arrive. No email, no credit card.",
  },
  {
    icon: Trash2,
    title: "Delete anytime",
    body: "One-click per-tool purge and a full reset in Settings — verified instantly.",
  },
];

export default function TrustBand() {
  return (
    <section
      aria-label="Privacy and data guarantees"
      className="border-t border-border/60 bg-muted/30 py-14 sm:py-16"
    >
      <div className={CONTAINER}>
        <Reveal>
          <ul
            data-trust-band
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border/60"
          >
            {ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={0.06 * i} y={18}>
                <li className="flex items-start gap-3.5 lg:px-6 lg:first:pl-0 lg:last:pr-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
