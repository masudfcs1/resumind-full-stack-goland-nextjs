"use client";

import type { ResumeData } from "@/lib/resume-store";
import { formatMonth } from "@/lib/resume-store";

/* Standalone HTML export — mirrors the live preview design with a hand-written
   <style> block. No external dependencies, works offline when opened directly. */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function rangeLabel(start: string, end: string, current: boolean): string {
  const from = formatMonth(start);
  const to = current ? "Present" : formatMonth(end);
  if (!from && !to) return "";
  return [from, to].filter(Boolean).join(" — ");
}

export function buildPortfolioHtml(data: ResumeData, accent: string, dark: boolean): string {
  const { personal, summary, skills, experience, projects, education } = data;
  const name = personal.fullName || "Your Name";
  const title = personal.jobTitle || "Portfolio";
  const year = new Date().getFullYear();

  const bg = dark ? "#0b0b0d" : "#fafaf9";
  const card = dark ? "#141417" : "#ffffff";
  const text = dark ? "#fafafa" : "#18181b";
  const sub = dark ? "#a1a1aa" : "#52525b";
  const faint = dark ? "#71717a" : "#a1a1aa";
  const border = dark ? "rgba(255,255,255,0.09)" : "#e4e4e7";
  const chip = dark ? "rgba(255,255,255,0.06)" : "#f4f4f5";

  const contactLinks = [
    personal.email ? { label: personal.email, href: `mailto:${esc(personal.email)}` } : null,
    personal.phone ? { label: personal.phone, href: `tel:${esc(personal.phone.replace(/[^+\d]/g, ""))}` } : null,
    personal.website ? { label: personal.website, href: `https://${personal.website.replace(/^https?:\/\//, "")}` } : null,
    personal.linkedin ? { label: personal.linkedin, href: `https://${personal.linkedin.replace(/^https?:\/\//, "")}` } : null,
    personal.github ? { label: personal.github, href: `https://${personal.github.replace(/^https?:\/\//, "")}` } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  const skillsHtml = skills
    .map(
      (s) => `        <div class="skill">
          <div class="skill-head"><span>${esc(s.name)}</span><span class="muted">${Math.max(8, Math.min(100, s.level * 20))}%</span></div>
          <div class="bar"><div class="fill" style="width:${Math.max(8, Math.min(100, s.level * 20))}%"></div></div>
        </div>`
    )
    .join("\n");

  const experienceHtml = experience
    .map((job) => {
      const label = rangeLabel(job.startDate, job.endDate, job.current);
      const bullets = job.bullets.map((b) => `          <li>${esc(b)}</li>`).join("\n");
      return `      <li class="job">
        <div class="row"><h3>${esc(job.role || "Role")}</h3>${label ? `<span class="date">${esc(label)}</span>` : ""}</div>
        <p class="accent-text">${esc(job.company)}${job.location ? ` <span class="muted">· ${esc(job.location)}</span>` : ""}</p>
${job.bullets.length > 0 ? `        <ul class="bullets">\n${bullets}\n        </ul>` : ""}
      </li>`;
    })
    .join("\n");

  const projectsHtml = projects
    .map(
      (p) => `      <article class="project">
        <div class="row"><h3>${esc(p.name)}</h3>${p.url ? `<span class="url">${esc(p.url)}</span>` : ""}</div>
        <p class="desc">${esc(p.description)}</p>
        ${p.tech.length > 0 ? `<div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      </article>`
    )
    .join("\n");

  const educationHtml = education
    .map((e) => {
      const label = rangeLabel(e.startDate, e.endDate, false);
      return `      <div class="edu">
        <div class="row"><h3>${esc(e.school)}</h3>${label ? `<span class="date">${esc(label)}</span>` : ""}</div>
        <p class="desc">${esc([e.degree, e.field].filter(Boolean).join(" · "))}${e.gpa ? ` <span class="muted">· GPA ${esc(e.gpa)}</span>` : ""}</p>
      </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en"${dark ? ' class="dark"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Portfolio of ${esc(name)} — ${esc(title)}" />
<title>${esc(name)} — Portfolio</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: ${bg}; color: ${text}; line-height: 1.6; }
  a { text-decoration: none; color: inherit; }
  .wrap { max-width: 768px; margin: 0 auto; padding: 0 24px; }
  .hero { padding: 88px 24px 64px; border-bottom: 1px solid ${border};
          background-image: linear-gradient(140deg, ${withAlpha(accent, "2b")} 0%, transparent 58%),
                            radial-gradient(640px 320px at 88% -12%, ${withAlpha(accent, "26")}, transparent); }
  .badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 4px 12px;
           font-size: 12px; font-weight: 500; background: ${withAlpha(accent, "1a")}; color: ${accent}; }
  .badge::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: ${accent}; }
  .hero h1 { font-size: 44px; font-weight: 800; letter-spacing: -0.02em; margin-top: 16px; }
  .hero .role { margin-top: 6px; font-size: 20px; font-weight: 600; color: ${accent}; }
  .loc { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; border-radius: 999px;
         padding: 4px 12px; font-size: 12px; color: ${sub}; background: ${chip}; border: 1px solid ${border}; }
  .cta { margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap; }
  .btn { display: inline-block; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 600;
         transition: transform .15s ease; }
  .btn:hover { transform: translateY(-2px); }
  .btn-solid { background: ${accent}; color: #ffffff; }
  .btn-ghost { border: 1.5px solid ${border}; background: ${card}; }
  section { padding: 40px 0; border-top: 1px solid ${border}; }
  main > section:first-child { border-top: 0; }
  h2 { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 700;
       letter-spacing: 0.2em; text-transform: uppercase; color: ${sub}; }
  h2::before { content: ""; width: 28px; height: 3px; border-radius: 999px; background: ${accent}; }
  .about p { margin-top: 16px; color: ${sub}; }
  .skills { margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px 40px; }
  .skill-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
  .bar { height: 6px; border-radius: 999px; background: ${chip}; border: 1px solid ${border}; overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; background: ${accent}; }
  .timeline { margin-top: 28px; padding-left: 28px; border-left: 2px solid ${border};
              display: flex; flex-direction: column; gap: 36px; list-style: none; }
  .job { position: relative; }
  .job::before { content: ""; position: absolute; left: -37px; top: 7px; width: 14px; height: 14px;
                 border-radius: 999px; border: 3px solid ${accent}; background: ${bg}; }
  .row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .row h3 { font-size: 17px; font-weight: 600; }
  .date { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: ${faint}; }
  .accent-text { margin-top: 2px; font-size: 14px; font-weight: 500; color: ${accent}; }
  .muted { color: ${faint}; font-weight: 400; }
  .bullets { margin-top: 12px; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;
             font-size: 14px; color: ${sub}; }
  .bullets li { position: relative; padding-left: 16px; }
  .bullets li::before { content: ""; position: absolute; left: 0; top: 9px; width: 6px; height: 6px;
                        border-radius: 999px; background: ${withAlpha(accent, "99")}; }
  .projects { margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .project { background: ${card}; border: 1px solid ${border}; border-radius: 12px; padding: 20px; }
  .desc { margin-top: 8px; font-size: 14px; color: ${sub}; }
  .url { border-radius: 6px; padding: 2px 8px; font-family: ui-monospace, Menlo, monospace; font-size: 11px;
         background: ${withAlpha(accent, "14")}; color: ${accent}; }
  .tags { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .tags span { border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 500;
               background: ${chip}; border: 1px solid ${border}; color: ${sub}; }
  .edu-list { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
  .edu { background: ${card}; border: 1px solid ${border}; border-radius: 12px; padding: 16px 20px; }
  footer { background: ${card}; border-top: 1px solid ${border}; padding: 48px 24px 40px; text-align: center; }
  footer .kicker { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${faint}; }
  footer h2 { justify-content: center; margin-top: 8px; font-size: 28px; font-weight: 800;
              letter-spacing: 0; text-transform: none; color: ${text}; }
  footer h2::before { display: none; }
  .links { margin-top: 24px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .links a { display: inline-block; border-radius: 999px; padding: 8px 16px; font-size: 14px; font-weight: 500;
             background: ${chip}; border: 1px solid ${border}; color: ${sub}; transition: transform .15s ease; }
  .links a:hover { transform: translateY(-2px); }
  .copyright { margin-top: 32px; font-size: 12px; color: ${faint}; }
  @media (max-width: 560px) { .hero h1 { font-size: 34px; } }
</style>
</head>
<body>
  <header class="hero">
    <div class="wrap" style="padding: 0;">
      <span class="badge">Available for new opportunities</span>
      <h1>${esc(name)}</h1>
      <p class="role">${esc(title)}</p>
${personal.location ? `      <span class="loc">📍 ${esc(personal.location)}</span>\n` : ""}      <div class="cta">
        <a class="btn btn-solid" href="#projects">View projects →</a>
        <a class="btn btn-ghost" href="#contact">Contact</a>
      </div>
    </div>
  </header>
  <main class="wrap">
${summary ? `    <section id="about" class="about">
      <h2>About</h2>
      <p>${esc(summary)}</p>
    </section>\n` : ""}${skills.length > 0 ? `    <section id="skills">
      <h2>Skills</h2>
      <div class="skills">
${skillsHtml}
      </div>
    </section>\n` : ""}${experience.length > 0 ? `    <section id="experience">
      <h2>Experience</h2>
      <ol class="timeline">
${experienceHtml}
      </ol>
    </section>\n` : ""}${projects.length > 0 ? `    <section id="projects">
      <h2>Projects</h2>
      <div class="projects">
${projectsHtml}
      </div>
    </section>\n` : ""}${education.length > 0 ? `    <section id="education">
      <h2>Education</h2>
      <div class="edu-list">
${educationHtml}
      </div>
    </section>\n` : ""}  </main>
  <footer id="contact">
    <p class="kicker">Get in touch</p>
    <h2>Let&apos;s work together</h2>
${contactLinks.length > 0 ? `    <div class="links">
${contactLinks.map((l) => `      <a href="${l.href}">${l.label}</a>`).join("\n")}
    </div>\n` : ""}    <p class="copyright">© ${year} ${esc(name)} — Built with ResumeForge AI</p>
  </footer>
</body>
</html>
`;
}
