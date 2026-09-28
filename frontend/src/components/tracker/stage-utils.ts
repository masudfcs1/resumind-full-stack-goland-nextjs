import {
  Bookmark,
  Send,
  Users,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ApplicationStage } from "@/lib/resume-store";

/** Canonical column order (left → right) */
export const STAGE_ORDER: ApplicationStage[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

/** STAGE_META.icon is a string name — map it to real lucide components. */
export const STAGE_ICONS: Record<ApplicationStage, LucideIcon> = {
  saved: Bookmark,
  applied: Send,
  interview: Users,
  offer: Trophy,
  rejected: XCircle,
};

/** 2-letter initials for the company avatar. */
export function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  const [a, b] = words;
  if (!a) return "?";
  if (!b) return a.slice(0, 2).toUpperCase();
  return ((a[0] ?? "") + (b[0] ?? "")).toUpperCase();
}

/** Hex + alpha suffix (e.g. "#10b981" + "1f"). */
export function tint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}
