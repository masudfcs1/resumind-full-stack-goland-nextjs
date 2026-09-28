"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/auth-store";
import { AuthDivider, SocialAuthButtons } from "./auth-shell";
import { cn } from "@/lib/utils";

/**
 * SignUpForm — mock account creation with a live password-strength meter.
 * Pure frontend: validated fields, a simulated round-trip, then the member
 * session is persisted via the auth store and the user lands in the
 * dashboard with their name in the account menu.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4); // 0–4
}

const STRENGTH_META = [
  { label: "Too short", cls: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Weak", cls: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Fair", cls: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Good", cls: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "Strong", cls: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
] as const;

function StrengthMeter({ pw }: { pw: string }) {
  const score = scorePassword(pw);
  const meta = STRENGTH_META[score];
  return (
    <div
      className="pt-1"
      role="status"
      aria-label={`Password strength: ${meta.label}`}
    >
      <div className="flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < Math.max(score, pw ? 1 : 0) ? meta.cls : "bg-muted"
            )}
          />
        ))}
      </div>
      {pw ? (
        <p className={cn("mt-1 text-xs font-medium", meta.text)}>
          {meta.label}
          {score >= 3 ? " — nice, that holds up" : " — try mixing cases, digits & symbols"}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          8+ characters. Mix cases, digits & symbols.
        </p>
      )}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export default function SignUpForm() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [terms, setTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const busy = submitting;

  function validate(): Errors {
    const next: Errors = {};
    if (!name.trim()) next.name = "Your name is required.";
    else if (name.trim().length < 2) next.name = "That name looks too short.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    if (!terms) next.terms = "Please accept the terms to continue.";
    return next;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    // Simulated provisioning round-trip — no real backend in this demo.
    window.setTimeout(() => {
      signUp({ name: cleanName, email: cleanEmail });
      toast.success(`Welcome aboard, ${cleanName.split(" ")[0]}`, {
        description: "Your free workspace is ready — 3 sample resumes included.",
      });
      router.push("/dashboard");
    }, 1000);
  }

  function onSocial(provider: "google" | "github") {
    if (busy) return;
    setSubmitting(true);
    const user =
      provider === "google"
        ? { name: "Alex Chen", email: "alex.chen@gmail.com" }
        : { name: "Alex Chen", email: "alexchen@github.io" };
    window.setTimeout(() => {
      signUp(user);
      toast.success(`Account created with ${provider === "google" ? "Google" : "GitHub"}`, {
        description: "Your free workspace is ready.",
      });
      router.push("/dashboard");
    }, 800);
  }

  const inputCls = (invalid: boolean) =>
    cn(
      "h-11 rounded-lg pl-10 text-sm",
      invalid && "border-red-500/60 focus-visible:ring-red-500/30 dark:border-red-500/50"
    );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        Create your free account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Free plan forever. No credit card required.
      </p>

      <div className="mt-6">
        <SocialAuthButtons
          onSocial={onSocial}
          disabled={busy}
          actionLabel="One-click sign-up"
        />
      </div>

      <div className="my-6">
        <AuthDivider label="or sign up with email" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Full name</Label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Alex Chen"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              disabled={busy}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              className={inputCls(Boolean(errors.name))}
            />
          </div>
          <FieldError id="signup-name-error" message={errors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="signup-email"
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
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className={inputCls(Boolean(errors.email))}
            />
          </div>
          <FieldError id="signup-email-error" message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              disabled={busy}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "signup-password-error" : undefined}
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
          <div id="signup-password-error">
            <FieldError id="signup-password-msg" message={errors.password} />
          </div>
          <StrengthMeter pw={password} />
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              checked={terms}
              onCheckedChange={(v) => {
                setTerms(v === true);
                if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
              }}
              disabled={busy}
              aria-label="Accept terms and privacy policy"
              className={cn("mt-0.5", errors.terms && "border-red-500/60")}
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link href="/" className="font-medium text-foreground underline-offset-2 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/" className="font-medium text-foreground underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <FieldError id="signup-terms-error" message={errors.terms} />
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Creating your account…
            </>
          ) : (
            <>
              Create free account
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1" aria-label="Signup assurances">
          {["Free forever", "No credit card", "Cancel anytime"].map((t) => (
            <li key={t} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-semibold text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
