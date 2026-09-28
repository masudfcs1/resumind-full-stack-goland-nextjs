"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import { useResumeStore } from "@/lib/resume-store";
import { initialsFor, useAuthStore } from "@/lib/auth-store";
import { useMounted } from "@/lib/use-mounted";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FileText,
  PenLine,
  LayoutTemplate,
  GitCompareArrows,
  Target,
  SpellCheck,
  Mail,
  Globe,
  Linkedin,
  Settings,
  Search,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Plus,
  LogOut,
  User,
  Zap,
  Briefcase,
  MessagesSquare,
  Crosshair,
} from "lucide-react";

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }>;
}> = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/resumes", label: "My Resumes", icon: FileText },
      { href: "/dashboard/builder", label: "Resume Studio", icon: PenLine },
      { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/dashboard/compare", label: "Compare", icon: GitCompareArrows },
      { href: "/dashboard/tracker", label: "Job Tracker", icon: Briefcase },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { href: "/dashboard/ats", label: "ATS Scanner", icon: Target },
      { href: "/dashboard/match", label: "Job Match", icon: Crosshair },
      { href: "/dashboard/grammar", label: "Grammar Check", icon: SpellCheck },
      { href: "/dashboard/cover-letter", label: "Cover Letters", icon: Mail },
      { href: "/dashboard/portfolio", label: "Portfolio Site", icon: Globe },
      { href: "/dashboard/interview", label: "Interview Prep", icon: MessagesSquare },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/linkedin", label: "LinkedIn Import", icon: Linkedin },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-bold tracking-tight text-[15px]">
            Resume<span className="text-emerald-500">Forge</span>
          </p>
          <p className="text-[10px] text-muted-foreground -mt-0.5">AI Career Studio</p>
        </div>
      )}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const reduceMotion = useReducedMotion() ?? false;
  /* Scope the sliding indicator to this NavLinks instance — the desktop sidebar
     and the mobile sheet each mount their own, so framer never animates between
     the two. Gated on mount + reduced-motion to stay hydration-safe. */
  const indicatorId = `nav-indicator-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const animatedIndicator = mounted && !reduceMotion;

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/70">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                      active && "text-emerald-500"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {active &&
                    (animatedIndicator ? (
                      <motion.span
                        layoutId={indicatorId}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        className="absolute left-0 inset-y-1 w-[3px] rounded-full bg-emerald-500"
                        aria-hidden
                      />
                    ) : (
                      <span
                        className="absolute left-0 inset-y-1 w-[3px] rounded-full bg-emerald-500"
                        aria-hidden
                      />
                    ))}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="p-3 border-t">
      <div className="rounded-xl p-3.5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-[12px] font-semibold">Pro tip</p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Run the ATS Scanner after every edit to keep your score above 85.
        </p>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  /* Scroll-aware topbar hairline — starts false on server + first client render,
     only the effect below ever flips it (hydration-safe). */
  const [scrolled, setScrolled] = React.useState(false);
  const router = useRouter();
  const createResume = useResumeStore((s) => s.createResume);
  /* Auth state (rehydrated post-mount by <StoreRehydrator /> — server and
     first client render always see guest + null, so no hydration shift). */
  const authUser = useAuthStore((s) => s.user);
  const authMode = useAuthStore((s) => s.mode);
  const signOut = useAuthStore((s) => s.signOut);
  const displayName = authUser?.name ?? "Alexander Chen";
  const displayEmail = authUser?.email ?? "alex.chen@email.com";
  const avatarInitials = authUser ? initialsFor(authUser.name) : "AC";

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ⌘K / Ctrl+K opens the command palette */
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setPaletteOpen(false);
    command();
  }, []);

  const pageTitle =
    NAV_GROUPS.flatMap((g) => g.items).find((i) =>
      i.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(i.href)
    )?.label ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r bg-sidebar">
          <div className="h-16 flex items-center px-5 border-b">
            <Logo />
          </div>
          <NavLinks />
          <SidebarFooter />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header
            className={cn(
              "h-16 shrink-0 sticky top-0 z-40 flex items-center gap-3 px-4 md:px-6 border-b bg-background/80 transition-[border-color,backdrop-filter] duration-300",
              scrolled
                ? "border-border/60 backdrop-blur-xl"
                : "border-transparent backdrop-blur-md"
            )}
          >
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden focus-visible:ring-emerald-500/60"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[272px]">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="h-16 flex items-center px-5 border-b">
                  <Logo />
                </div>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              <h1 className="font-semibold text-[15px] truncate">{pageTitle}</h1>
            </div>

            <div className="relative ml-auto w-full max-w-[220px] hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="h-9 w-full pl-8 pr-12 rounded-lg text-[13px] text-muted-foreground text-left bg-muted/60 border border-transparent hover:border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Open command palette"
              >
                Search tools…
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <Button
                size="sm"
                onClick={() => createResume("Untitled Resume", "modern", "#10b981")}
                className="h-9 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 gap-1.5 focus-visible:ring-emerald-500/60"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Resume</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 focus-visible:ring-emerald-500/60"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    {mounted && theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[12px] font-bold flex items-center justify-center ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all focus-visible:outline-none focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Account menu"
                  >
                    {avatarInitials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">{displayEmail}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <User className="w-4 h-4 mr-2" /> Profile settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="w-4 h-4 mr-2" /> Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      signOut();
                      router.push("/");
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Demo-mode banner — appears after rehydrate when the user
              entered via the landing "Try Live Demo" button. */}
          {authMode === "demo" && (
            <div
              role="status"
              aria-label="Demo mode active"
              className="relative z-30 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 px-4 py-2.5 md:px-6 lg:px-8 dark:border-emerald-500/25"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Zap className="size-3.5" aria-hidden />
                  </span>
                  <p className="min-w-0 flex-1 text-[13px] font-medium leading-relaxed text-foreground sm:leading-snug">
                    You&apos;re exploring the{" "}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      live demo
                    </span>{" "}
                    — everything works, and progress is saved in this browser
                    only.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:brightness-105"
                  >
                    <Link href="/signup">Create free account</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      signOut();
                      router.push("/");
                    }}
                  >
                    Exit demo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>

      {/* ⌘K Command palette */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  <item.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="new resume"
              onSelect={() =>
                runCommand(() => {
                  createResume("Untitled Resume", "modern", "#10b981");
                  router.push("/dashboard/builder");
                })
              }
            >
              <Plus className="w-4 h-4 mr-2 text-muted-foreground" />
              Create new resume
            </CommandItem>
            <CommandItem
              value="toggle theme"
              onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 mr-2 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 mr-2 text-muted-foreground" />
              )}
              Toggle light / dark theme
            </CommandItem>
            <CommandItem
              value="landing website"
              onSelect={() => runCommand(() => router.push("/"))}
            >
              <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
              Go to landing page
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </TooltipProvider>
  );
}
