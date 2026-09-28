"use client";

import * as React from "react";
import {
  Briefcase,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore, type PersonalInfo, type ResumeData } from "@/lib/resume-store";
import { Field, IconInput, StepHeader } from "@/components/builder/builder-kit";

const FIELDS: Array<{
  key: keyof PersonalInfo;
  label: string;
  placeholder: string;
  icon: LucideIcon;
}> = [
  { key: "fullName", label: "Full name", placeholder: "Alexander Chen", icon: User },
  { key: "jobTitle", label: "Job title", placeholder: "Senior Frontend Engineer", icon: Briefcase },
  { key: "email", label: "Email", placeholder: "you@email.com", icon: Mail },
  { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000", icon: Phone },
  { key: "location", label: "Location", placeholder: "San Francisco, CA", icon: MapPin },
  { key: "website", label: "Website", placeholder: "yoursite.dev", icon: Globe },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you", icon: Linkedin },
  { key: "github", label: "GitHub", placeholder: "github.com/you", icon: Github },
];

export default function FormPersonal({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);

  return (
    <section aria-label="Personal details step">
      <StepHeader
        icon={User}
        title="Personal details"
        description="How recruiters will reach you — keep it current."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label, placeholder, icon: Icon }) => (
          <Field key={key} label={label}>
            <IconInput
              icon={Icon}
              value={resume.personal[key]}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(e) =>
                updateResume(resume.id, {
                  personal: { ...resume.personal, [key]: e.target.value },
                })
              }
            />
          </Field>
        ))}
      </div>

      <p className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tip:</span> your job
        title powers the AI tools across the studio — make it the role you&apos;re{" "}
        <span className="italic">targeting</span>, not necessarily your current one.
      </p>
    </section>
  );
}
