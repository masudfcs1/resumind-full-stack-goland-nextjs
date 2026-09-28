"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatMonth, type ResumeData } from "@/lib/resume-store";

/* A4 @96dpi = 794 x 1123. Render at fixed width; parent scales via transform. */

interface PreviewProps {
  resume: ResumeData;
  className?: string;
  id?: string;
}

function SectionTitle({
  children,
  accent,
  variant = "line",
}: {
  children: React.ReactNode;
  accent: string;
  variant?: "line" | "caps" | "block";
}) {
  if (variant === "caps")
    return (
      <h3
        className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-2"
        style={{ color: accent }}
      >
        {children}
      </h3>
    );
  if (variant === "block")
    return (
      <h3
        className="text-[11px] font-bold tracking-wide uppercase text-white px-2 py-1 mb-2 rounded-[3px] inline-block"
        style={{ background: accent }}
      >
        {children}
      </h3>
    );
  return (
    <h3
      className="text-[11.5px] font-bold tracking-[0.12em] uppercase pb-1 mb-2 border-b"
      style={{ color: accent, borderColor: `${accent}55` }}
    >
      {children}
    </h3>
  );
}

function Bullet({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex gap-1.5 text-[10.5px] leading-[1.5] text-neutral-700">
      <span className="mt-[5px] w-[4px] h-[4px] rounded-full shrink-0" style={{ background: color }} />
      <span>{children}</span>
    </li>
  );
}

function dateRange(start: string, end: string, current: boolean) {
  const s = formatMonth(start);
  const e = current ? "Present" : formatMonth(end);
  return [s, e].filter(Boolean).join(" — ");
}

function ExperienceBlock({ resume, variant }: { resume: ResumeData; variant: "default" | "compact" }) {
  return (
    <div className={cn("space-y-2.5", variant === "compact" && "space-y-2")}>
      {resume.experience.map((exp) => (
        <div key={exp.id}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11.5px] font-bold text-neutral-900">{exp.role || "Role"}</p>
              <p className="text-[10.5px] font-medium" style={{ color: resume.accent }}>
                {exp.company || "Company"}
                {exp.location ? <span className="text-neutral-500 font-normal"> · {exp.location}</span> : null}
              </p>
            </div>
            <p className="text-[9.5px] text-neutral-500 whitespace-nowrap shrink-0">
              {dateRange(exp.startDate, exp.endDate, exp.current)}
            </p>
          </div>
          {exp.bullets.length > 0 && (
            <ul className="mt-1 space-y-[3px]">
              {exp.bullets.map((b, i) => (
                <Bullet key={i} color={resume.accent}>
                  {b}
                </Bullet>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsBlock({ resume, variant }: { resume: ResumeData; variant: "list" | "chips" | "bars" }) {
  if (resume.skills.length === 0) return null;
  if (variant === "chips")
    return (
      <div className="flex flex-wrap gap-1">
        {resume.skills.map((s) => (
          <span
            key={s.id}
            className="text-[9.5px] font-medium px-2 py-[3px] rounded-full"
            style={{ background: `${resume.accent}18`, color: resume.accent }}
          >
            {s.name}
          </span>
        ))}
      </div>
    );
  if (variant === "bars")
    return (
      <div className="space-y-1.5">
        {resume.skills.map((s) => (
          <div key={s.id}>
            <div className="flex justify-between text-[9.5px]">
              <span className="font-medium text-neutral-800">{s.name}</span>
            </div>
            <div className="h-[4px] rounded-full bg-neutral-200 mt-[2px] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(s.level / 5) * 100}%`, background: resume.accent }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-[2px]">
      {resume.skills.map((s) => (
        <li key={s.id} className="text-[10.5px] text-neutral-700 flex gap-1.5 items-center">
          <span className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: resume.accent }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function ProjectsBlock({ resume }: { resume: ResumeData }) {
  if (resume.projects.length === 0) return null;
  return (
    <div className="space-y-2">
      {resume.projects.map((p) => (
        <div key={p.id}>
          <p className="text-[11px] font-bold text-neutral-900">
            {p.name}
            {p.url ? <span className="text-[9.5px] font-normal text-neutral-500 ml-2">{p.url}</span> : null}
          </p>
          {p.description && <p className="text-[10.5px] text-neutral-700 leading-[1.5] mt-[1px]">{p.description}</p>}
          {p.tech.length > 0 && (
            <p className="text-[9.5px] mt-[2px]" style={{ color: resume.accent }}>
              {p.tech.join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function CertsLangs({ resume }: { resume: ResumeData }) {
  if (resume.certifications.length === 0 && resume.languages.length === 0) return null;
  return (
    <>
      {resume.certifications.length > 0 && (
        <div>
          <SectionTitle accent={resume.accent} variant="caps">
            Certifications
          </SectionTitle>
          <div className="space-y-1">
            {resume.certifications.map((c) => (
              <div key={c.id} className="flex justify-between gap-2 text-[10.5px]">
                <span className="font-medium text-neutral-800">{c.name}</span>
                <span className="text-neutral-500 text-[9.5px] whitespace-nowrap">
                  {c.issuer}
                  {c.year ? ` · ${c.year}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {resume.languages.length > 0 && (
        <div>
          <SectionTitle accent={resume.accent} variant="caps">
            Languages
          </SectionTitle>
          <p className="text-[10.5px] text-neutral-700">
            {resume.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}
          </p>
        </div>
      )}
    </>
  );
}

function SummaryPara({ resume }: { resume: ResumeData }) {
  if (!resume.summary) return null;
  return <p className="text-[10.5px] leading-[1.55] text-neutral-700">{resume.summary}</p>;
}

/* ============================== Templates ============================== */

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AB"
  );
}

function ModernTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="flex h-full">
      <aside className="w-[248px] shrink-0 p-6 text-white flex flex-col gap-5" style={{ background: a }}>
        <div className="flex flex-col items-center text-center gap-3 mt-2">
          <div className="w-[76px] h-[76px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-[26px] font-bold tracking-wide">
            {initials(resume.personal.fullName)}
          </div>
          <div>
            <h1 className="text-[19px] font-bold leading-tight">{resume.personal.fullName || "Your Name"}</h1>
            <p className="text-[11px] text-white/85 mt-1">{resume.personal.jobTitle || "Job Title"}</p>
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2 text-white/80">Contact</h3>
          <ul className="space-y-1.5 text-[10px] text-white/95 break-all">
            {resume.personal.email && <li>{resume.personal.email}</li>}
            {resume.personal.phone && <li>{resume.personal.phone}</li>}
            {resume.personal.location && <li>{resume.personal.location}</li>}
            {resume.personal.website && <li>{resume.personal.website}</li>}
            {resume.personal.linkedin && <li>{resume.personal.linkedin}</li>}
            {resume.personal.github && <li>{resume.personal.github}</li>}
          </ul>
        </div>
        {resume.skills.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2 text-white/80">Skills</h3>
            <div className="space-y-1.5">
              {resume.skills.map((s) => (
                <div key={s.id}>
                  <p className="text-[9.5px] text-white/95">{s.name}</p>
                  <div className="h-[3.5px] rounded-full bg-white/25 mt-[2px] overflow-hidden">
                    <div className="h-full rounded-full bg-white" style={{ width: `${(s.level / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {resume.languages.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2 text-white/80">Languages</h3>
            <ul className="space-y-1 text-[10px] text-white/95">
              {resume.languages.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span>{l.name}</span>
                  <span className="text-white/75">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <main className="flex-1 p-6 space-y-4 bg-white">
        {resume.summary && (
          <section>
            <SectionTitle accent={a}>Profile</SectionTitle>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a}>Experience</SectionTitle>
            <ExperienceBlock resume={resume} variant="default" />
          </section>
        )}
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a}>Projects</SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
        {resume.education.length > 0 && (
          <section>
            <SectionTitle accent={a}>Education</SectionTitle>
            <div className="space-y-2">
              {resume.education.map((e) => (
                <div key={e.id} className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-neutral-900">
                      {e.degree} {e.field && `in ${e.field}`}
                    </p>
                    <p className="text-[10.5px] text-neutral-600">
                      {e.school}
                      {e.gpa ? ` · GPA ${e.gpa}` : ""}
                    </p>
                  </div>
                  <p className="text-[9.5px] text-neutral-500 whitespace-nowrap">
                    {dateRange(e.startDate, e.endDate, false)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.certifications.length > 0 && (
          <section>
            <SectionTitle accent={a}>Certifications</SectionTitle>
            <div className="space-y-1">
              {resume.certifications.map((c) => (
                <p key={c.id} className="text-[10.5px] text-neutral-700">
                  <span className="font-medium text-neutral-900">{c.name}</span> — {c.issuer}
                  {c.year ? ` (${c.year})` : ""}
                </p>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ClassicTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full bg-white px-10 py-9 space-y-4 font-serif">
      <header className="text-center border-b-2 pb-3" style={{ borderColor: a }}>
        <h1 className="text-[24px] font-bold tracking-wide text-neutral-900 uppercase">
          {resume.personal.fullName || "Your Name"}
        </h1>
        <p className="text-[12px] text-neutral-600 mt-1">{resume.personal.jobTitle || "Job Title"}</p>
        <p className="text-[10px] text-neutral-600 mt-1.5">
          {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website]
            .filter(Boolean)
            .join("  •  ")}
        </p>
      </header>
      {resume.summary && (
        <section>
          <SectionTitle accent={a}>Professional Summary</SectionTitle>
          <SummaryPara resume={resume} />
        </section>
      )}
      {resume.experience.length > 0 && (
        <section>
          <SectionTitle accent={a}>Professional Experience</SectionTitle>
          <ExperienceBlock resume={resume} variant="default" />
        </section>
      )}
      {resume.education.length > 0 && (
        <section>
          <SectionTitle accent={a}>Education</SectionTitle>
          <div className="space-y-2">
            {resume.education.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11.5px] font-bold text-neutral-900">
                    {e.degree} {e.field && `in ${e.field}`}
                  </p>
                  <p className="text-[10.5px] text-neutral-600">
                    {e.school}
                    {e.gpa ? ` · GPA ${e.gpa}` : ""}
                  </p>
                </div>
                <p className="text-[9.5px] text-neutral-500 whitespace-nowrap">{dateRange(e.startDate, e.endDate, false)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {resume.skills.length > 0 && (
        <section>
          <SectionTitle accent={a}>Skills</SectionTitle>
          <SkillsBlock resume={resume} variant="list" />
        </section>
      )}
      {resume.projects.length > 0 && (
        <section>
          <SectionTitle accent={a}>Projects</SectionTitle>
          <ProjectsBlock resume={resume} />
        </section>
      )}
      <CertsLangs resume={resume} />
    </div>
  );
}

function MinimalTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full bg-white px-12 py-12 space-y-6">
      <header>
        <h1 className="text-[28px] font-light tracking-tight text-neutral-900">
          {resume.personal.fullName || "Your Name"}
        </h1>
        <p className="text-[12px] mt-1 font-medium" style={{ color: a }}>
          {resume.personal.jobTitle || "Job Title"}
        </p>
        <p className="text-[10px] text-neutral-500 mt-2">
          {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website, resume.personal.linkedin]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>
      {resume.summary && (
        <section>
          <SummaryPara resume={resume} />
        </section>
      )}
      {resume.experience.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Experience
          </SectionTitle>
          <ExperienceBlock resume={resume} variant="compact" />
        </section>
      )}
      {resume.education.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Education
          </SectionTitle>
          <div className="space-y-2">
            {resume.education.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-neutral-900">
                    {e.school} — {e.degree} {e.field}
                  </p>
                </div>
                <p className="text-[9.5px] text-neutral-500 whitespace-nowrap">{dateRange(e.startDate, e.endDate, false)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {resume.skills.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Skills
          </SectionTitle>
          <p className="text-[10.5px] text-neutral-700 leading-relaxed">
            {resume.skills.map((s) => s.name).join("  ·  ")}
          </p>
        </section>
      )}
      {resume.projects.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Selected Work
          </SectionTitle>
          <ProjectsBlock resume={resume} />
        </section>
      )}
      <CertsLangs resume={resume} />
    </div>
  );
}

function CreativeTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full bg-white">
      <header
        className="px-9 py-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(120deg, ${a}, ${a}cc)` }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-14 w-28 h-28 rounded-full bg-white/10" />
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/85">Hello, I&apos;m</p>
        <h1 className="text-[30px] font-extrabold tracking-tight mt-1">{resume.personal.fullName || "Your Name"}</h1>
        <p className="text-[12.5px] text-white/90 mt-1 font-medium">{resume.personal.jobTitle || "Job Title"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-white/85">
          {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website]
            .filter(Boolean)
            .map((c) => (
              <span key={c}>{c}</span>
            ))}
        </div>
      </header>
      <div className="px-9 py-6 space-y-4">
        {resume.summary && (
          <section className="pl-3" style={{ borderLeft: `3px solid ${a}` }}>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="block">
              Experience
            </SectionTitle>
            <ExperienceBlock resume={resume} variant="compact" />
          </section>
        )}
        {resume.skills.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="block">
              Skills
            </SectionTitle>
            <SkillsBlock resume={resume} variant="chips" />
          </section>
        )}
        <div className="grid grid-cols-2 gap-5">
          {resume.education.length > 0 && (
            <section>
              <SectionTitle accent={a} variant="block">
                Education
              </SectionTitle>
              <div className="space-y-2">
                {resume.education.map((e) => (
                  <div key={e.id}>
                    <p className="text-[11px] font-bold text-neutral-900">{e.school}</p>
                    <p className="text-[10.5px] text-neutral-600">
                      {e.degree} {e.field && `in ${e.field}`}
                    </p>
                    <p className="text-[9.5px] text-neutral-500">{dateRange(e.startDate, e.endDate, false)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {resume.projects.length > 0 && (
            <section>
              <SectionTitle accent={a} variant="block">
                Projects
              </SectionTitle>
              <ProjectsBlock resume={resume} />
            </section>
          )}
        </div>
        <CertsLangs resume={resume} />
      </div>
    </div>
  );
}

function ExecutiveTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full bg-white">
      <header className="px-10 pt-9 pb-6" style={{ background: "linear-gradient(180deg, #1c1917, #292524)" }}>
        <h1 className="text-[26px] font-bold tracking-tight text-white">{resume.personal.fullName || "Your Name"}</h1>
        <p className="text-[12.5px] font-medium mt-1" style={{ color: a }}>
          {resume.personal.jobTitle || "Job Title"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-neutral-300">
          {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.linkedin, resume.personal.website]
            .filter(Boolean)
            .map((c) => (
              <span key={c}>{c}</span>
            ))}
        </div>
      </header>
      <div className="px-10 py-6 space-y-4">
        {resume.summary && (
          <section className="pl-4" style={{ borderLeft: `3px solid ${a}` }}>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a}>Leadership Experience</SectionTitle>
            <ExperienceBlock resume={resume} variant="default" />
          </section>
        )}
        <div className="grid grid-cols-2 gap-6">
          {resume.education.length > 0 && (
            <section>
              <SectionTitle accent={a}>Education</SectionTitle>
              <div className="space-y-2">
                {resume.education.map((e) => (
                  <div key={e.id}>
                    <p className="text-[11px] font-bold text-neutral-900">{e.school}</p>
                    <p className="text-[10.5px] text-neutral-600">
                      {e.degree} {e.field && `in ${e.field}`}
                    </p>
                    <p className="text-[9.5px] text-neutral-500">{dateRange(e.startDate, e.endDate, false)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {resume.skills.length > 0 && (
            <section>
              <SectionTitle accent={a}>Core Competencies</SectionTitle>
              <SkillsBlock resume={resume} variant="list" />
            </section>
          )}
        </div>
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a}>Selected Achievements</SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
        <CertsLangs resume={resume} />
      </div>
    </div>
  );
}

function TechnicalTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="flex h-full bg-white">
      <main className="flex-1 p-6 space-y-3.5">
        <header className="border-b-2 pb-2.5" style={{ borderColor: a }}>
          <h1 className="text-[22px] font-bold text-neutral-900">{resume.personal.fullName || "Your Name"}</h1>
          <p className="text-[11.5px] font-semibold mt-[2px]" style={{ color: a }}>
            {resume.personal.jobTitle || "Job Title"}
          </p>
          <p className="text-[9.5px] text-neutral-500 mt-1.5">
            {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.github, resume.personal.website]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        </header>
        {resume.summary && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Summary
            </SectionTitle>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Technical Experience
            </SectionTitle>
            <ExperienceBlock resume={resume} variant="compact" />
          </section>
        )}
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Projects
            </SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
        {resume.education.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Education
            </SectionTitle>
            <div className="space-y-1.5">
              {resume.education.map((e) => (
                <div key={e.id} className="flex items-baseline justify-between gap-2">
                  <p className="text-[10.5px] text-neutral-800">
                    <span className="font-bold">{e.school}</span> — {e.degree} {e.field && `in ${e.field}`}
                    {e.gpa ? ` (GPA ${e.gpa})` : ""}
                  </p>
                  <p className="text-[9.5px] text-neutral-500 whitespace-nowrap">{dateRange(e.startDate, e.endDate, false)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <aside className="w-[218px] shrink-0 p-5 space-y-4 text-white" style={{ background: "#1c1917" }}>
        {resume.skills.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: a }}>
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1">
              {resume.skills.map((s) => (
                <span key={s.id} className="text-[9px] font-medium px-1.5 py-[2px] rounded bg-white/10 text-neutral-200">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {resume.certifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: a }}>
              Certifications
            </h3>
            <ul className="space-y-1.5">
              {resume.certifications.map((c) => (
                <li key={c.id} className="text-[9.5px] text-neutral-300 leading-snug">
                  <span className="text-neutral-100 font-medium">{c.name}</span>
                  <br />
                  {c.issuer} {c.year && `· ${c.year}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        {resume.languages.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: a }}>
              Languages
            </h3>
            <ul className="space-y-1 text-[9.5px] text-neutral-300">
              {resume.languages.map((l) => (
                <li key={l.id}>
                  {l.name} — <span className="text-neutral-400">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ------------------------- Cambridge (serif masthead) ------------------------- */

function CambridgeRule({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-neutral-800">
      <span aria-hidden className="h-px flex-1 bg-neutral-300" />
      {children}
      <span aria-hidden className="h-px flex-1 bg-neutral-300" />
    </h3>
  );
}

function CambridgeTemplate({ resume }: { resume: ResumeData }) {
  return (
    <div className="h-full space-y-5 bg-white px-12 py-11 font-serif">
      <header className="border-b-2 border-neutral-800 pb-4 text-center">
        <h1 className="text-[27px] font-bold uppercase tracking-[0.08em] text-neutral-900">
          {resume.personal.fullName || "Your Name"}
        </h1>
        <p className="mt-1 text-[12.5px] italic text-neutral-600">
          {resume.personal.jobTitle || "Job Title"}
        </p>
        <p className="mt-2 text-[9.5px] tracking-wide text-neutral-500">
          {[
            resume.personal.email,
            resume.personal.phone,
            resume.personal.location,
            resume.personal.website,
            resume.personal.linkedin,
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>

      {resume.summary && (
        <section className="text-center">
          <SummaryPara resume={resume} />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <CambridgeRule>Professional Experience</CambridgeRule>
          <ExperienceBlock resume={resume} variant="compact" />
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <CambridgeRule>Education</CambridgeRule>
          <div className="space-y-1.5">
            {resume.education.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between gap-2 text-center sm:text-left">
                <p className="text-[11px] text-neutral-800">
                  <span className="font-bold">{e.school}</span> — {e.degree} {e.field}
                  {e.gpa ? <span className="text-neutral-500"> (GPA {e.gpa})</span> : null}
                </p>
                <p className="whitespace-nowrap text-[9.5px] text-neutral-500">
                  {dateRange(e.startDate, e.endDate, false)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <CambridgeRule>Areas of Expertise</CambridgeRule>
          <p className="text-center text-[10.5px] leading-relaxed text-neutral-700">
            {resume.skills.map((s) => s.name).join("   ·   ")}
          </p>
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section>
          <CambridgeRule>Certifications</CambridgeRule>
          <div className="space-y-1">
            {resume.certifications.map((c) => (
              <div key={c.id} className="flex justify-between gap-2 text-[10.5px]">
                <span className="text-neutral-800">{c.name}</span>
                <span className="whitespace-nowrap text-[9.5px] text-neutral-500">
                  {c.issuer}
                  {c.year ? ` · ${c.year}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.languages.length > 0 && (
        <section>
          <CambridgeRule>Languages</CambridgeRule>
          <p className="text-center text-[10.5px] text-neutral-700">
            {resume.languages.map((l) => `${l.name} (${l.level})`).join("  ·  ")}
          </p>
        </section>
      )}
    </div>
  );
}

/* ------------------------- Impact (dark brand sidebar) ------------------------- */

function ImpactTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  const contactItems = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.website,
    resume.personal.linkedin,
    resume.personal.github,
  ].filter(Boolean);
  return (
    <div className="flex h-full bg-white">
      <aside className="w-[240px] shrink-0 space-y-5 p-6 text-white" style={{ background: "#18181b" }}>
        <header>
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-[15px] font-bold text-white"
            style={{ background: a }}
            aria-hidden
          >
            {initials(resume.personal.fullName || "Your Name")}
          </span>
          <h1 className="mt-3 text-[21px] font-extrabold leading-tight tracking-tight">
            {resume.personal.fullName || "Your Name"}
          </h1>
          <p className="mt-1 text-[11px] font-semibold" style={{ color: a }}>
            {resume.personal.jobTitle || "Job Title"}
          </p>
        </header>

        {contactItems.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: a }}>
              Contact
            </h3>
            <ul className="space-y-1.5 text-[9.5px] leading-snug text-neutral-300">
              {contactItems.map((c) => (
                <li key={c} className="break-words">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.skills.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: a }}>
              Strengths
            </h3>
            <div className="space-y-1.5">
              {resume.skills.map((s) => (
                <div key={s.id}>
                  <p className="text-[9.5px] font-medium text-neutral-200">{s.name}</p>
                  <div className="mt-[2px] h-[4px] overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full" style={{ width: `${(s.level / 5) * 100}%`, background: a }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.languages.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: a }}>
              Languages
            </h3>
            <ul className="space-y-1 text-[9.5px] text-neutral-300">
              {resume.languages.map((l) => (
                <li key={l.id}>
                  {l.name} — <span className="text-neutral-400">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main className="flex-1 space-y-4 p-6">
        {resume.summary && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Profile
            </SectionTitle>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Experience
            </SectionTitle>
            <ExperienceBlock resume={resume} variant="default" />
          </section>
        )}
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Highlights
            </SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
        {resume.education.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Education
            </SectionTitle>
            <div className="space-y-1.5">
              {resume.education.map((e) => (
                <div key={e.id} className="flex items-baseline justify-between gap-2">
                  <p className="text-[10.5px] text-neutral-800">
                    <span className="font-bold">{e.school}</span> — {e.degree} {e.field && `in ${e.field}`}
                  </p>
                  <p className="whitespace-nowrap text-[9.5px] text-neutral-500">
                    {dateRange(e.startDate, e.endDate, false)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.certifications.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Certifications
            </SectionTitle>
            <div className="space-y-1">
              {resume.certifications.map((c) => (
                <div key={c.id} className="flex justify-between gap-2 text-[10.5px]">
                  <span className="font-medium text-neutral-800">{c.name}</span>
                  <span className="whitespace-nowrap text-[9.5px] text-neutral-500">
                    {c.issuer}
                    {c.year ? ` · ${c.year}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ------------------------- Summit (full-width header band) ------------------------- */

function SummitTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full bg-white">
      <header
        className="relative overflow-hidden px-10 pb-8 pt-9 text-white"
        style={{ background: `linear-gradient(115deg, ${a} 0%, ${a}d9 55%, ${a}b3 100%)` }}
      >
        <div aria-hidden className="absolute -right-10 -top-12 size-40 rounded-full border-[10px] border-white/10" />
        <div aria-hidden className="absolute -bottom-16 left-24 size-32 rounded-full border-8 border-white/10" />
        <div className="relative flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
              {resume.personal.jobTitle || "Job Title"}
            </p>
            <h1 className="mt-1.5 text-[30px] font-extrabold tracking-tight">
              {resume.personal.fullName || "Your Name"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/85">
              {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website, resume.personal.linkedin]
                .filter(Boolean)
                .map((c) => (
                  <span key={c}>{c}</span>
                ))}
            </div>
          </div>
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/30"
          >
            {initials(resume.personal.fullName || "Your Name")}
          </span>
        </div>
      </header>

      <div className="space-y-4 px-10 py-6">
        {resume.summary && (
          <section className="pl-4" style={{ borderLeft: `3px solid ${a}` }}>
            <SummaryPara resume={resume} />
          </section>
        )}
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle accent={a}>Experience</SectionTitle>
            <ExperienceBlock resume={resume} variant="default" />
          </section>
        )}
        <div className="grid grid-cols-2 gap-6">
          {resume.education.length > 0 && (
            <section>
              <SectionTitle accent={a}>Education</SectionTitle>
              <div className="space-y-2">
                {resume.education.map((e) => (
                  <div key={e.id}>
                    <p className="text-[11px] font-bold text-neutral-900">{e.school}</p>
                    <p className="text-[10.5px] text-neutral-600">
                      {e.degree} {e.field && `in ${e.field}`}
                    </p>
                    <p className="text-[9.5px] text-neutral-500">{dateRange(e.startDate, e.endDate, false)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {resume.skills.length > 0 && (
            <section>
              <SectionTitle accent={a}>Core Skills</SectionTitle>
              <SkillsBlock resume={resume} variant="list" />
            </section>
          )}
        </div>
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a}>Selected Work</SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
        <CertsLangs resume={resume} />
      </div>
    </div>
  );
}

/* ------------------------- Timeline (vertical career line) ------------------------- */

function TimelineTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full space-y-4 bg-white px-10 py-9">
      <header
        className="flex items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: `${a}55` }}
      >
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-neutral-900">
            {resume.personal.fullName || "Your Name"}
          </h1>
          <p className="mt-[2px] text-[12px] font-semibold" style={{ color: a }}>
            {resume.personal.jobTitle || "Job Title"}
          </p>
          <p className="mt-1.5 text-[9.5px] text-neutral-500">
            {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
          style={{ background: a }}
        >
          {initials(resume.personal.fullName || "Your Name")}
        </span>
      </header>

      {resume.summary && (
        <section>
          <SummaryPara resume={resume} />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Career Timeline
          </SectionTitle>
          <ol className="relative ml-1 space-y-3 pl-4" style={{ borderLeft: `2px solid ${a}33` }}>
            {resume.experience.map((exp) => (
              <li key={exp.id} className="relative">
                <span
                  aria-hidden
                  className="absolute top-[3px] size-[10px] rounded-full ring-2 ring-white"
                  style={{ background: a, left: "-21px" }}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11.5px] font-bold text-neutral-900">{exp.role || "Role"}</p>
                  <p className="whitespace-nowrap text-[9px] font-semibold" style={{ color: a }}>
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </p>
                </div>
                <p className="text-[10.5px] font-medium text-neutral-600">
                  {exp.company || "Company"}
                  {exp.location ? <span className="font-normal text-neutral-500"> · {exp.location}</span> : null}
                </p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1 space-y-[3px]">
                    {exp.bullets.map((b, i) => (
                      <Bullet key={i} color={a}>
                        {b}
                      </Bullet>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <SectionTitle accent={a} variant="caps">
            Skills
          </SectionTitle>
          <SkillsBlock resume={resume} variant="chips" />
        </section>
      )}

      <div className="grid grid-cols-2 gap-5">
        {resume.education.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Education
            </SectionTitle>
            <div className="space-y-1.5">
              {resume.education.map((e) => (
                <div key={e.id}>
                  <p className="text-[10.5px] font-bold text-neutral-900">{e.school}</p>
                  <p className="text-[9.5px] text-neutral-600">
                    {e.degree} {e.field && `in ${e.field}`} · {dateRange(e.startDate, e.endDate, false)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.projects.length > 0 && (
          <section>
            <SectionTitle accent={a} variant="caps">
              Projects
            </SectionTitle>
            <ProjectsBlock resume={resume} />
          </section>
        )}
      </div>

      <CertsLangs resume={resume} />
    </div>
  );
}

/* ============================== ATS-first family (Round 15) ==============================
   Four minimalist, one-column, reverse-chronological templates built for applicant
   tracking systems and Google/FAANG-style engineering reviews:
   - no photos, no graphics, no icons, no skill bars, no tables, no sidebars
   - standard section headings in the recruiter-expected order:
     Summary -> Technical Skills -> Professional Experience -> Selected Projects
     -> Education -> Certifications -> Languages
   - strong typographic hierarchy, action-first bullets, restrained color
     (accent appears, when it appears at all, only as a single hairline/mark)
   ================================================================================= */

function AtsBullets({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-[3px] pl-4 marker:text-neutral-400">
      {bullets.map((b, i) => (
        <li key={i} className="pl-0.5 text-[10.5px] leading-[1.5] text-neutral-700">
          {b}
        </li>
      ))}
    </ul>
  );
}

function AtsExperience({
  resume,
  variant,
}: {
  resume: ResumeData;
  variant: "role-first" | "company-first";
}) {
  return (
    <div className="space-y-3">
      {resume.experience.map((exp) => (
        <div key={exp.id}>
          {variant === "company-first" ? (
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11.5px] font-bold text-neutral-900">
                {exp.company || "Company"}
                {exp.location ? <span className="font-normal text-neutral-600"> — {exp.location}</span> : null}
              </p>
              <p className="whitespace-nowrap text-[9.5px] font-medium text-neutral-500">
                {dateRange(exp.startDate, exp.endDate, exp.current)}
              </p>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11.5px] font-bold text-neutral-900">{exp.role || "Role"}</p>
              <p className="whitespace-nowrap text-[9.5px] font-medium text-neutral-500">
                {dateRange(exp.startDate, exp.endDate, exp.current)}
              </p>
            </div>
          )}
          <p className={cn("text-[10.5px] text-neutral-700", variant === "company-first" && "italic")}>
            {variant === "company-first" ? (
              exp.role || "Role"
            ) : (
              <>
                <span className="font-medium">{exp.company || "Company"}</span>
                {exp.location ? <span className="font-normal text-neutral-500"> — {exp.location}</span> : null}
              </>
            )}
          </p>
          <AtsBullets bullets={exp.bullets} />
        </div>
      ))}
    </div>
  );
}

function AtsSkills({ resume, separator }: { resume: ResumeData; separator: string }) {
  if (resume.skills.length === 0) return null;
  return (
    <p className="text-[10.5px] leading-[1.55] text-neutral-700">
      {resume.skills.map((s) => s.name).join(separator)}
    </p>
  );
}

function AtsProjects({ resume, techPrefix = "Technologies" }: { resume: ResumeData; techPrefix?: string }) {
  if (resume.projects.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {resume.projects.map((p) => (
        <div key={p.id}>
          <p className="text-[11px] font-bold text-neutral-900">
            {p.name}
            {p.url ? <span className="ml-2 text-[9.5px] font-normal text-neutral-500">{p.url}</span> : null}
          </p>
          {p.description && <p className="mt-[1px] text-[10.5px] leading-[1.5] text-neutral-700">{p.description}</p>}
          {p.tech.length > 0 && (
            <p className="mt-[2px] text-[9.5px] text-neutral-600">
              {techPrefix}: {p.tech.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function AtsEducation({ resume, inline = false }: { resume: ResumeData; inline?: boolean }) {
  if (resume.education.length === 0) return null;
  if (inline)
    return (
      <div className="space-y-[3px]">
        {resume.education.map((e) => (
          <p key={e.id} className="text-[10px] leading-[1.5] text-neutral-700">
            <span className="font-bold text-neutral-900">
              {e.degree} {e.field && `in ${e.field}`}
            </span>{" "}
            — {e.school}
            {e.gpa ? ` (GPA ${e.gpa})` : ""} · {dateRange(e.startDate, e.endDate, false)}
          </p>
        ))}
      </div>
    );
  return (
    <div className="space-y-2">
      {resume.education.map((e) => (
        <div key={e.id} className="flex items-baseline justify-between gap-3">
          <p className="text-[10.5px] text-neutral-800">
            <span className="font-bold text-neutral-900">
              {e.degree} {e.field && `in ${e.field}`}
            </span>{" "}
            — {e.school}
            {e.gpa ? <span className="text-neutral-500"> (GPA {e.gpa})</span> : null}
          </p>
          <p className="whitespace-nowrap text-[9.5px] text-neutral-500">{dateRange(e.startDate, e.endDate, false)}</p>
        </div>
      ))}
    </div>
  );
}

function AtsCerts({ resume, inline = false }: { resume: ResumeData; inline?: boolean }) {
  const hasCerts = resume.certifications.length > 0;
  const hasLangs = resume.languages.length > 0;
  if (!hasCerts && !hasLangs) return null;
  if (inline) {
    return (
      <div className="space-y-[3px]">
        {hasCerts && (
          <p className="text-[10px] leading-[1.5] text-neutral-700">
            {resume.certifications
              .map((c) => `${c.name}${c.issuer ? `, ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`)
              .join(" · ")}
          </p>
        )}
        {hasLangs && (
          <p className="text-[10px] leading-[1.5] text-neutral-700">
            Languages: {resume.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`).join(", ")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {hasCerts && (
        <div className="space-y-1">
          {resume.certifications.map((c) => (
            <p key={c.id} className="text-[10.5px] text-neutral-700">
              <span className="font-medium text-neutral-900">{c.name}</span>
              {c.issuer ? ` — ${c.issuer}` : ""}
              {c.year ? ` (${c.year})` : ""}
            </p>
          ))}
        </div>
      )}
      {hasLangs && (
        <p className="text-[10.5px] text-neutral-700">
          <span className="font-medium text-neutral-900">Languages:</span>{" "}
          {resume.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ------------------------- Vertex (Google/FAANG style) ------------------------- */

function VertexTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full space-y-4 bg-white px-11 py-10">
      <header className="border-b-2 pb-3" style={{ borderColor: a }}>
        <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
          {resume.personal.fullName || "Your Name"}
        </h1>
        <p className="mt-0.5 text-[12.5px] font-medium text-neutral-700">
          {resume.personal.jobTitle || "Job Title"}
        </p>
        <p className="mt-1.5 text-[10px] text-neutral-600">
          {[
            resume.personal.email,
            resume.personal.phone,
            resume.personal.location,
            resume.personal.linkedin,
            resume.personal.github,
            resume.personal.website,
          ]
            .filter(Boolean)
            .join("  |  ")}
        </p>
      </header>

      {resume.summary && (
        <section>
          <h3 className="mb-1.5 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Professional Summary
          </h3>
          <SummaryPara resume={resume} />
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <h3 className="mb-1.5 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Technical Skills
          </h3>
          <AtsSkills resume={resume} separator="  ·  " />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <h3 className="mb-2 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Professional Experience
          </h3>
          <AtsExperience resume={resume} variant="role-first" />
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <h3 className="mb-2 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Selected Projects
          </h3>
          <AtsProjects resume={resume} />
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <h3 className="mb-2 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Education
          </h3>
          <AtsEducation resume={resume} />
        </section>
      )}

      {(resume.certifications.length > 0 || resume.languages.length > 0) && (
        <section>
          <h3 className="mb-2 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">
            Certifications &amp; Achievements
          </h3>
          <AtsCerts resume={resume} />
        </section>
      )}
    </div>
  );
}

/* ------------------------- Prestige (banker's serif) ------------------------- */

function PrestigeRule({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 border-b-2 border-neutral-800 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900">
      {children}
    </h3>
  );
}

function PrestigeTemplate({ resume }: { resume: ResumeData }) {
  return (
    <div className="h-full space-y-5 bg-white px-12 py-11 font-serif">
      <header className="border-b-[3px] border-double pb-3" style={{ borderColor: "#1c1917" }}>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[24px] font-bold uppercase tracking-[0.06em] text-neutral-900">
              {resume.personal.fullName || "Your Name"}
            </h1>
            <p className="mt-0.5 text-[11.5px] italic text-neutral-600">
              {resume.personal.jobTitle || "Job Title"}
            </p>
          </div>
          <div className="shrink-0 text-right text-[9.5px] leading-[1.6] text-neutral-600">
            {[resume.personal.email, resume.personal.phone, resume.personal.location, resume.personal.website, resume.personal.linkedin]
              .filter(Boolean)
              .map((c) => (
                <p key={c}>{c}</p>
              ))}
          </div>
        </div>
      </header>

      {resume.summary && (
        <section>
          <PrestigeRule>Professional Summary</PrestigeRule>
          <SummaryPara resume={resume} />
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <PrestigeRule>Technical Skills</PrestigeRule>
          <AtsSkills resume={resume} separator="   ·   " />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <PrestigeRule>Professional Experience</PrestigeRule>
          <AtsExperience resume={resume} variant="company-first" />
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <PrestigeRule>Selected Projects</PrestigeRule>
          <AtsProjects resume={resume} />
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <PrestigeRule>Education</PrestigeRule>
          <AtsEducation resume={resume} />
        </section>
      )}

      {(resume.certifications.length > 0 || resume.languages.length > 0) && (
        <section>
          <PrestigeRule>Certifications</PrestigeRule>
          <AtsCerts resume={resume} />
        </section>
      )}
    </div>
  );
}

/* ------------------------- Meridian (contemporary ATS) ------------------------- */

function MeridianHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-neutral-900">
      <span aria-hidden className="h-[11px] w-[3px] rounded-full" style={{ background: accent }} />
      {children}
    </h3>
  );
}

function MeridianTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full space-y-5 bg-white px-11 py-10">
      <header>
        <span aria-hidden className="mb-2.5 block h-[3px] w-10 rounded-full" style={{ background: a }} />
        <h1 className="text-[25px] font-extrabold tracking-tight text-neutral-900">
          {resume.personal.fullName || "Your Name"}
        </h1>
        <p className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
          {resume.personal.jobTitle || "Job Title"}
        </p>
        <p className="mt-2 text-[10px] text-neutral-600">
          {[
            resume.personal.email,
            resume.personal.phone,
            resume.personal.location,
            resume.personal.website,
            resume.personal.linkedin,
            resume.personal.github,
          ]
            .filter(Boolean)
            .join("   ·   ")}
        </p>
      </header>

      {resume.summary && (
        <section>
          <MeridianHeading accent={a}>Professional Summary</MeridianHeading>
          <SummaryPara resume={resume} />
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <MeridianHeading accent={a}>Technical Skills</MeridianHeading>
          <AtsSkills resume={resume} separator="  ·  " />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <MeridianHeading accent={a}>Professional Experience</MeridianHeading>
          <AtsExperience resume={resume} variant="role-first" />
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <MeridianHeading accent={a}>Selected Projects</MeridianHeading>
          <AtsProjects resume={resume} />
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <MeridianHeading accent={a}>Education</MeridianHeading>
          <AtsEducation resume={resume} />
        </section>
      )}

      {(resume.certifications.length > 0 || resume.languages.length > 0) && (
        <section>
          <MeridianHeading accent={a}>Certifications</MeridianHeading>
          <AtsCerts resume={resume} />
        </section>
      )}
    </div>
  );
}

/* ------------------------- Compact (max-density one-pager) ------------------------- */

function CompactTemplate({ resume }: { resume: ResumeData }) {
  const a = resume.accent;
  return (
    <div className="h-full space-y-3 bg-white px-10 py-8">
      <header className="border-b pb-2" style={{ borderColor: a }}>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[20px] font-bold tracking-tight text-neutral-900">
            {resume.personal.fullName || "Your Name"}
          </h1>
          <p className="text-[10.5px] font-semibold text-neutral-700">
            {resume.personal.jobTitle || "Job Title"}
          </p>
        </div>
        <p className="mt-1 text-[9px] text-neutral-600">
          {[
            resume.personal.email,
            resume.personal.phone,
            resume.personal.location,
            resume.personal.website,
            resume.personal.linkedin,
            resume.personal.github,
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>

      {resume.summary && (
        <section>
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Professional Summary
          </h3>
          <p className="text-[10px] leading-[1.5] text-neutral-700">{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section>
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Technical Skills
          </h3>
          <AtsSkills resume={resume} separator=", " />
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Professional Experience
          </h3>
          <div className="space-y-2.5">
            {resume.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10.5px] font-bold text-neutral-900">
                    {exp.role || "Role"}
                    <span className="font-medium text-neutral-700">
                      {" "}
                      · {exp.company || "Company"}
                      {exp.location ? <span className="font-normal text-neutral-500"> · {exp.location}</span> : null}
                    </span>
                  </p>
                  <p className="whitespace-nowrap text-[9px] font-medium text-neutral-500">
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </p>
                </div>
                <AtsBullets bullets={exp.bullets} />
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Selected Projects
          </h3>
          <AtsProjects resume={resume} />
        </section>
      )}

      {resume.education.length > 0 && (
        <section>
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Education
          </h3>
          <AtsEducation resume={resume} inline />
        </section>
      )}

      {(resume.certifications.length > 0 || resume.languages.length > 0) && (
        <section>
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
            Certifications &amp; Languages
          </h3>
          <AtsCerts resume={resume} inline />
        </section>
      )}
    </div>
  );
}

/* ============================== Root ============================== */

const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<{ resume: ResumeData }>> = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  creative: CreativeTemplate,
  executive: ExecutiveTemplate,
  technical: TechnicalTemplate,
  cambridge: CambridgeTemplate,
  impact: ImpactTemplate,
  summit: SummitTemplate,
  timeline: TimelineTemplate,
  vertex: VertexTemplate,
  prestige: PrestigeTemplate,
  meridian: MeridianTemplate,
  compact: CompactTemplate,
};

export default function ResumePreview({ resume, className, id }: PreviewProps) {
  const Template = TEMPLATE_COMPONENTS[resume.template] ?? ModernTemplate;
  return (
    <div
      id={id}
      className={cn(
        "w-[794px] min-h-[1123px] bg-white text-neutral-900 shadow-xl ring-1 ring-black/5 overflow-hidden",
        "font-sans"
      )}
    >
      <Template resume={resume} />
    </div>
  );
}
