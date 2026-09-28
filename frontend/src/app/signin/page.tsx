import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";
import SignInForm from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign in — ResumeForge AI",
  description:
    "Sign in to your ResumeForge AI workspace and keep building your ATS-proof resume.",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
