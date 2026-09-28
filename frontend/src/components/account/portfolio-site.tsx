"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/lib/resume-store";
import { formatMonth } from "@/lib/resume-store";

/* Palette for the generated site — deliberately self-contained so the preview
   looks identical regardless of the dashboard's light/dark theme. */
interface Palette {
  bg: string;
  card: string;
  text: string;
  sub: string;
  faint: string;
  border: string;
  chip: string;
}

const LIGHT: Palette = {
  bg: "#fafaf9",
  card: "#ffffff",
  text: "#18181b",
  sub: "#52525b",
  faint: "#a1a1aa",
  border: "#e4e4e7",
  chip: "#f4f4f5",
};

const DARK: Palette = {
  bg: "#0b0b0d",
  card: "#141417",
  text: "#fafafa",
  sub: "#a1a1aa",
  faint: "#71717a",
  border: "rgba(255,255,255,0.09)",
  chip: "rgba(255,255,255,0.06)",
};

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function rangeLabel(start: string, end: string, current: boolean): string {
  const from = formatMonth(start);
  const to = current ? "Present" : formatMonth(end);
  if (!from && !to) return "";
  return [from, to].filter(Boolean).join(" — ");
}

function SectionTitle({ title, accent, tint }: { title: string; accent: string; tint: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: tint }}>
      <span className="h-[3px] w-7 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
      {title}
    </h2>
  );
}

export interface PortfolioSiteProps {
  data: ResumeData;
  accent: string;
  dark: boolean;
}

/** Fully self-designed portfolio page rendered from resume data. */
export function PortfolioSite({ data, accent, dark }: PortfolioSiteProps) {
  const t = dark ? DARK : LIGHT;
  const { personal, summary, skills, experience, projects, education } = data;
  const name = personal.fullName || "Your Name";
  const year = React.useMemo(() => new Date().getFullYear(), []);

  const contactLinks = [
    personal.email ? { icon: Mail, label: personal.email, href: `mailto:${personal.email}` } : null,
    personal.phone ? { icon: Phone, label: personal.phone, href: `tel:${personal.phone.replace(/[^+\d]/g, "")}` } : null,
    personal.website ? { icon: Globe, label: personal.website, href: `https://${personal.website.replace(/^https?:\/\//, "")}` } : null,
    personal.linkedin ? { icon: Linkedin, label: personal.linkedin, href: `https://${personal.linkedin.replace(/^https?:\/\//, "")}` } : null,
    personal.github ? { icon: Github, label: personal.github, href: `https://${personal.github.replace(/^https?:\/\//, "")}` } : null,
  ].filter((l): l is NonNullable<typeof l> => l !== null);

  return (
    <div className="min-h-full transition-colors duration-300" style={{ backgroundColor: t.bg, color: t.text }}>
      {/* ============ Hero ============ */}
      <header
        className="relative overflow-hidden px-6 pb-14 pt-16 sm:px-10 sm:pb-16 sm:pt-20"
        style={{
          backgroundImage: `linear-gradient(140deg, ${withAlpha(accent, "2b")} 0%, transparent 58%), radial-gradient(640px 320px at 88% -12%, ${withAlpha(accent, "26")}, transparent)`,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: withAlpha(accent, "1a"), color: accent }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ backgroundColor: accent }} />
                <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: accent }} />
              </span>
              Available for new opportunities
            </motion.div>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="font-display mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            >
              {name}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="mt-2 text-lg font-semibold sm:text-xl"
              style={{ color: accent }}
            >
              {personal.jobTitle || "Your professional title"}
            </motion.p>
            {personal.location ? (
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="mt-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: t.chip, color: t.sub, border: `1px solid ${t.border}` }}
                >
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {personal.location}
                </span>
              </motion.div>
            ) : null}
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: accent }}
              >
                View projects
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ border: `1.5px solid ${t.border}`, color: t.text, backgroundColor: t.card }}
              >
                Contact
              </a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 sm:px-10">
        {/* ============ About ============ */}
        {summary ? (
          <section className="py-10" aria-label="About">
            <SectionTitle title="About" accent={accent} tint={t.sub} />
            <p className="mt-4 leading-relaxed" style={{ color: t.sub }}>
              {summary}
            </p>
          </section>
        ) : null}

        {/* ============ Skills ============ */}
        {skills.length > 0 ? (
          <section className="py-10" style={{ borderTop: `1px solid ${t.border}` }} aria-label="Skills">
            <SectionTitle title="Skills" accent={accent} tint={t.sub} />
            <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {skills.map((skill, i) => (
                <div key={skill.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs" style={{ color: t.faint }}>
                      {skill.level * 20}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: t.chip, border: `1px solid ${t.border}` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accent }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.max(8, Math.min(100, skill.level * 20))}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ============ Experience ============ */}
        {experience.length > 0 ? (
          <section className="py-10" style={{ borderTop: `1px solid ${t.border}` }} aria-label="Experience">
            <SectionTitle title="Experience" accent={accent} tint={t.sub} />
            <ol className="relative mt-7 space-y-9 pl-7" style={{ borderLeft: `2px solid ${t.border}` }}>
              {experience.map((job, i) => {
                const label = rangeLabel(job.startDate, job.endDate, job.current);
                return (
                  <motion.li
                    key={job.id}
                    className="relative"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: 0.06 * i }}
                  >
                    <span
                      className="absolute -left-[37px] top-1.5 size-3.5 rounded-full border-[3px]"
                      style={{ borderColor: accent, backgroundColor: t.bg }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-base font-semibold">{job.role || "Role"}</h3>
                      {label ? (
                        <span className="font-mono text-xs" style={{ color: t.faint }}>
                          {label}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>
                      {job.company}
                      {job.location ? <span style={{ color: t.faint }}> · {job.location}</span> : null}
                    </p>
                    {job.bullets.length > 0 ? (
                      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed" style={{ color: t.sub }}>
                        {job.bullets.map((bullet, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ backgroundColor: withAlpha(accent, "99") }} aria-hidden="true" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </motion.li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {/* ============ Projects ============ */}
        {projects.length > 0 ? (
          <section id="projects" className="scroll-mt-6 py-10" style={{ borderTop: `1px solid ${t.border}` }} aria-label="Projects">
            <SectionTitle title="Projects" accent={accent} tint={t.sub} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {projects.map((project, i) => (
                <motion.article
                  key={project.id}
                  className="rounded-xl p-5 transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: 0.06 * i }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.url ? (
                      <span className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px]" style={{ backgroundColor: withAlpha(accent, "14"), color: accent }}>
                        {project.url}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: t.sub }}>
                    {project.description}
                  </p>
                  {project.tech.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: t.chip, color: t.sub, border: `1px solid ${t.border}` }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.article>
              ))}
            </div>
          </section>
        ) : null}

        {/* ============ Education ============ */}
        {education.length > 0 ? (
          <section className="py-10" style={{ borderTop: `1px solid ${t.border}` }} aria-label="Education">
            <SectionTitle title="Education" accent={accent} tint={t.sub} />
            <div className="mt-6 space-y-4">
              {education.map((edu) => {
                const label = rangeLabel(edu.startDate, edu.endDate, false);
                return (
                  <div key={edu.id} className="rounded-xl p-4" style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="font-semibold">{edu.school}</h3>
                      {label ? (
                        <span className="font-mono text-xs" style={{ color: t.faint }}>
                          {label}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm" style={{ color: t.sub }}>
                      {[edu.degree, edu.field].filter(Boolean).join(" · ")}
                      {edu.gpa ? <span style={{ color: t.faint }}> · GPA {edu.gpa}</span> : null}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>

      {/* ============ Contact footer ============ */}
      <footer id="contact" className="scroll-mt-6 px-6 pb-10 pt-12 sm:px-10" style={{ backgroundColor: t.card, borderTop: `1px solid ${t.border}` }}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: t.faint }}>
            Get in touch
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">Let&apos;s work together</h2>
          {contactLinks.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: t.chip, color: t.sub, border: `1px solid ${t.border}` }}
                >
                  <link.icon className="size-4" style={{ color: accent }} aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: t.faint }}>
              Add your email and links in Resume Studio to show them here.
            </p>
          )}
          <p className="mt-8 text-xs" style={{ color: t.faint }}>
            © {year} {name} — Built with ResumeForge AI
          </p>
        </div>
      </footer>
    </div>
  );
}
