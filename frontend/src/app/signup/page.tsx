import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";
import SignUpForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your free account — ResumeForge AI",
  description:
    "Create a free ResumeForge AI account — AI resume writing, live ATS scoring and recruiter-approved templates. Free plan forever, no credit card required.",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
