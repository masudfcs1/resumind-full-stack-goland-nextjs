"use client";

import * as React from "react";
import { Award, Languages, Plus } from "lucide-react";
import { uid, useResumeStore, type ResumeData } from "@/lib/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDelete, StepHeader, listOps } from "@/components/builder/builder-kit";

const LANGUAGE_LEVELS = ["Native", "Fluent", "Conversational", "Basic"];

export default function FormExtras({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);

  const certs = resume.certifications;
  const certCommit = (next: typeof certs) => updateResume(resume.id, { certifications: next });
  const certOps = listOps(certs, certCommit);

  const langs = resume.languages;
  const langCommit = (next: typeof langs) => updateResume(resume.id, { languages: next });
  const langOps = listOps(langs, langCommit);

  return (
    <section aria-label="Certifications and languages step">
      <StepHeader
        icon={Award}
        title="Extras"
        description="Certifications & languages — the finishing touches recruiters scan for."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ============================== Certifications ============================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              Certifications
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {certs.length}
              </span>
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-[12px]"
              onClick={() =>
                certOps.add({ id: uid(), name: "", issuer: "", year: "" })
              }
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add
            </Button>
          </div>

          {certs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[12px] text-muted-foreground">
              No certifications yet — AWS, Scrum, Google Cloud all land well.
            </div>
          ) : (
            <ul className="space-y-2.5" aria-label="Certifications">
              {certs.map((cert, index) => (
                <li key={cert.id} className="space-y-2 rounded-xl border bg-background p-3 shadow-xs">
                  <div className="flex gap-2">
                    <Input
                      value={cert.name}
                      placeholder="AWS Certified Developer"
                      aria-label="Certification name"
                      autoComplete="off"
                      className="h-8 flex-1 text-[13px]"
                      onChange={(e) => certOps.patch(index, { name: e.target.value })}
                    />
                    <Input
                      value={cert.year}
                      placeholder="2023"
                      aria-label="Certification year"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      className="h-8 w-[76px] shrink-0 text-[13px]"
                      onChange={(e) => certOps.patch(index, { year: e.target.value })}
                    />
                    <ConfirmDelete itemName="certification" onConfirm={() => certOps.remove(index)} />
                  </div>
                  <Input
                    value={cert.issuer}
                    placeholder="Issuer — Amazon Web Services"
                    aria-label="Certification issuer"
                    autoComplete="off"
                    className="h-8 text-[13px]"
                    onChange={(e) => certOps.patch(index, { issuer: e.target.value })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ============================== Languages ============================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Languages className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              Languages
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {langs.length}
              </span>
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-[12px]"
              onClick={() => langOps.add({ id: uid(), name: "", level: "Conversational" })}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add
            </Button>
          </div>

          {langs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[12px] text-muted-foreground">
              No languages yet — multilingual candidates stand out in global teams.
            </div>
          ) : (
            <ul className="space-y-2.5" aria-label="Languages">
              {langs.map((lang, index) => (
                <li key={lang.id} className="flex gap-2 rounded-xl border bg-background p-3 shadow-xs">
                  <Input
                    value={lang.name}
                    placeholder="Spanish"
                    aria-label="Language name"
                    autoComplete="off"
                    className="h-8 flex-1 text-[13px]"
                    onChange={(e) => langOps.patch(index, { name: e.target.value })}
                  />
                  <Select value={lang.level} onValueChange={(v) => langOps.patch(index, { level: v })}>
                    <SelectTrigger size="sm" aria-label={`Level of ${lang.name || "language"}`} className="w-[140px] shrink-0 text-[13px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ConfirmDelete itemName="language" onConfirm={() => langOps.remove(index)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
