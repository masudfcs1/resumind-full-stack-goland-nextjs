"use client";

import * as React from "react";
import { Check, Github, Heart, Linkedin, Loader2, Mail, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Logo, scrollToId } from "./shared";

interface FooterCol {
  heading: string;
  links: { label: string; target?: string }[];
}

const COLUMNS: FooterCol[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", target: "features" },
      { label: "Templates", target: "templates" },
      { label: "ATS Scanner", target: "ats" },
      { label: "Pricing", target: "pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Resume examples" },
      { label: "Cover letter guide" },
      { label: "ATS glossary" },
      { label: "Career blog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us" },
      { label: "Careers" },
      { label: "Press kit" },
      { label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy" },
      { label: "Terms of service" },
      { label: "Cookie policy" },
      { label: "FAQ", target: "faq" },
    ],
  },
];

const SOCIALS = [
  { icon: Github, label: "ResumeForge AI on GitHub" },
  { icon: Twitter, label: "ResumeForge AI on X (Twitter)" },
  { icon: Linkedin, label: "ResumeForge AI on LinkedIn" },
] as const;

const COMPLIANCE = ["GDPR-ready", "CCPA", "SOC 2 in progress"] as const;

/* Newsletter — client-validated signup with toast feedback. No network call
 * is made (frontend-only demo): after a short simulated latency the form
 * confirms success, mirroring the product's offline-first spirit. */
function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (status === "sending") return;
    setStatus("sending");
    window.setTimeout(() => {
      setStatus("done");
      setEmail("");
      toast.success("You're on the list — one useful email a month, no noise.");
    }, 650);
  };

  return (
    <form data-newsletter onSubmit={submit} className="mt-5 max-w-xs" noValidate>
      <label
        htmlFor="footer-newsletter"
        className="text-[13px] font-semibold text-foreground"
      >
        The monthly career playbook
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        Job-search tactics and template drops. Unsubscribe anytime.
      </p>
      <div className="mt-2.5 flex gap-2">
        <div className="relative flex-1">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="footer-newsletter"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "done"}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={status !== "idle"}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:shadow-lg hover:shadow-emerald-500/35 hover:brightness-105 active:scale-[0.97] disabled:cursor-default disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {status === "idle" && (
            <>
              Subscribe
            </>
          )}
          {status === "sending" && (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span className="sr-only">Subscribing</span>
            </>
          )}
          {status === "done" && (
            <>
              <Check className="size-4" aria-hidden />
              Done
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function Footer() {
  return (
    <footer id="footer" aria-label="Footer" className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The AI resume builder that gets you past the robots and in front
              of the recruiters. Forge yours in minutes.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#footer"
                  onClick={(e) => e.preventDefault()}
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  <s.icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
            {/* Compliance chips */}
            <ul
              aria-label="Privacy and compliance"
              className="mt-5 flex flex-wrap gap-1.5"
            >
              {COMPLIANCE.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-border/80 bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {c}
                </li>
              ))}
            </ul>
            <NewsletterForm />
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={`Footer — ${col.heading}`}>
              <h3 className="text-sm font-bold text-foreground">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.target ? `#${link.target}` : "#footer"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.target) scrollToId(link.target);
                      }}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2025 ResumeForge AI. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:gap-4">
            {/* Operational status — pulsing dot is disabled under
                prefers-reduced-motion */}
            <a
              href="#footer"
              onClick={(e) => e.preventDefault()}
              data-status-pill
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
              aria-label="System status: all systems operational"
            >
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </a>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Crafted with{" "}
              <Heart
                className="size-3.5 fill-emerald-500 text-emerald-500"
                aria-hidden
              />{" "}
              for job seekers everywhere.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
