"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { AuthDivider, SocialAuthButtons } from "./auth-shell";

/**
 * SignInForm — mock credential sign-in (pure frontend, no backend).
 * Validation runs client-side; "authentication" simulates a short network
 * round-trip, then persists the member session via the auth store and
 * routes to the dashboard. Already-signed-in visitors get a session card
 * instead of the form (gated on mount — hydration-safe).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "alex.chen@x.com" → "Alex Chen" — a friendly display name for sign-ins. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "Resume Builder";
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

interface Errors {
  email?: string;
  password?: string;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export default function SignInForm() {
  const router = useRouter();
  const mounted = useMounted();
  const signIn = useAuthStore((s) => s.signIn);
  const existingUser = useAuthStore((s) => s.user);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const busy = submitting;

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    return next;
  }

  function finishSession(user: AuthUser, greeting: string) {
    signIn(user);
    toast.success(greeting, {
      description: "You're signed in — your workspace is ready.",
    });
    router.push("/dashboard");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const clean = email.trim();
    // Simulated round-trip — no real backend in this demo product.
    window.setTimeout(() => {
      finishSession(
        { name: nameFromEmail(clean), email: clean },
        `Welcome back, ${nameFromEmail(clean).split(" ")[0]}`
      );
    }, 900);
  }

  function onSocial(provider: "google" | "github") {
    if (busy) return;
    setSubmitting(true);
    const user: AuthUser =
      provider === "google"
        ? { name: "Alex Chen", email: "alex.chen@gmail.com" }
        : { name: "Alex Chen", email: "alexchen@github.io" };
    window.setTimeout(() => {
      finishSession(user, `Signed in with ${provider === "google" ? "Google" : "GitHub"}`);
    }, 700);
  }

  /* Already signed in — offer a direct path back to the workspace. */
  if (mounted && existingUser) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <LayoutDashboard className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">
          You&apos;re already signed in
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {existingUser.name} · {existingUser.email}
        </p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="mt-6 h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:brightness-105"
        >
          Go to your dashboard
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  const inputCls = (invalid: boolean) =>
    cn(
      "h-11 rounded-lg pl-10 text-sm",
      invalid &&
        "border-red-500/60 focus-visible:ring-red-500/30 dark:border-red-500/50"
    );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to keep building your ATS-proof resume.
      </p>

      <div className="mt-6">
        <SocialAuthButtons
          onSocial={onSocial}
          disabled={busy}
          actionLabel="Instant demo access"
        />
      </div>

      <div className="my-6">
        <AuthDivider label="or sign in with email" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signin-email">Email</Label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              disabled={busy}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signin-email-error" : undefined}
              className={inputCls(Boolean(errors.email))}
            />
          </div>
          <FieldError id="signin-email-error" message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button
              type="button"
              onClick={() =>
                toast.info("Password reset (demo)", {
                  description: `In production we'd email a reset link to ${
                    email.trim() || "your registered address"
                  }.`,
                })
              }
              className="text-xs font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              disabled={busy}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "signin-password-error" : undefined}
              className={cn(inputCls(Boolean(errors.password)), "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError id="signin-password-error" message={errors.password} />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 py-1">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
            disabled={busy}
            aria-label="Keep me signed in"
          />
          <span className="text-sm text-muted-foreground">Keep me signed in</span>
        </label>

        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing you in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ResumeForge?{" "}
        <Link
          href="/signup"
          className="font-semibold text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}
