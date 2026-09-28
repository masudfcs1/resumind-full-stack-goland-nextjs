"use client";

import { downloadBlob } from "@/components/account/download";
import { STAGE_META, type ApplicationStage, type JobApplication } from "@/lib/resume-store";

/** Escapes a CSV cell: quotes, commas, and newlines get wrapped + doubled quotes. */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Builds a spreadsheet-friendly CSV of all job applications and triggers a
 * client-side download. Returns the row count written (excluding header).
 */
export function exportApplicationsCsv(
  applications: JobApplication[],
  resumeTitleById: Map<string, string>
): number {
  const header = [
    "Company",
    "Role",
    "Location",
    "Salary",
    "Stage",
    "Resume Used",
    "URL",
    "Notes",
    "Applied",
    "Last Updated",
  ];

  const rows = applications.map((app) => [
    app.company,
    app.role,
    app.location,
    app.salary,
    STAGE_META[app.stage as ApplicationStage]?.label ?? app.stage,
    app.resumeId ? (resumeTitleById.get(app.resumeId) ?? "") : "None",
    app.url,
    app.notes.replace(/\r?\n/g, " "),
    formatDate(app.appliedAt),
    formatDate(app.updatedAt),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `resumeforge-applications-${stamp}.csv`, "text/csv;charset=utf-8");
  return rows.length;
}
