"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useScroll, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, Moon, Play, Sparkles, Sun } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo, scrollToId } from "./shared";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "Templates", id: "templates" },
  { label: "ATS", id: "ats" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
] as const;

function AnchorLink({
  label,
  id,
  active,
  className,
  onNavigate,
}: {
  label: string;
  id: string;
  active?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={`#${id}`}
      aria-current={active ? "true" : undefined}
      onClick={(e) => {
        e.preventDefault();
        scrollToId(id);
        onNavigate?.();
      }}
      className={cn(
        "relative text-sm transition-colors",
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      {/* Active section indicator dot */}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-[9px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-500 transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </a>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-lg text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  /* Auth-aware CTA cluster. Server + first render always show the guest
     buttons; a signed-in member's buttons swap in after mount (post-rehydrate
     store update — never a hydration mismatch). */
  const mounted = useMounted();
  const member = useAuthStore((s) => s.mode === "member" && s.user !== null);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const isMember = mounted && member;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section highlighting: observe each anchored section; the one
  // crossing the upper-middle band of the viewport wins. Above the first
  // section (hero) nothing is highlighted.
  React.useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      // A narrow horizontal band around the upper-middle of the viewport —
      // matches what a reader is looking at while a sticky header is present.
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));

    const onScroll = () => {
      if (window.scrollY < 260) setActiveSection(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 shadow-[0_1px_24px_-8px_rgb(0_0_0/0.12)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Logo />

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <AnchorLink
              key={l.id}
              label={l.label}
              id={l.id}
              active={activeSection === l.id}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Auth-aware desktop CTA cluster. Members go straight back to
              the workspace; guests get sign-in + the zero-friction demo. */}
          {isMember ? (
            <Link
              href="/dashboard"
              className="hidden h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.97] sm:inline-flex"
            >
              Open Dashboard
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden h-9 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                onClick={enterDemo}
                className="hidden h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.97] sm:inline-flex"
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                Try Live Demo
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="md:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Sparkles className="size-4" />
                  </span>
                  ResumeForge AI
                </SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex flex-col gap-1 px-4">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.id}
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      // wait for the sheet to close before scrolling
                      window.setTimeout(() => scrollToId(l.id), 120);
                    }}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="mt-3 flex flex-col gap-2">
                  {isMember ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:brightness-105 active:scale-[0.97]"
                    >
                      Open Dashboard
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={enterDemo}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:brightness-105 active:scale-[0.97]"
                      >
                        <Play className="size-4 fill-current" aria-hidden />
                        Try Live Demo
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/signin"
                          onClick={() => setOpen(false)}
                          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent active:scale-[0.97]"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setOpen(false)}
                          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300 active:scale-[0.97]"
                        >
                          Sign up free
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Reading-progress hairline pinned to the bottom edge of the header —
          scaleX tracks scroll position (scroll-driven, not autonomous, so it
          is fine under prefers-reduced-motion). */}
      <motion.div
        aria-hidden
        data-scroll-progress
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
        style={{ scaleX: reduced ? 0 : scrollYProgress }}
      />
    </header>
  );
}
