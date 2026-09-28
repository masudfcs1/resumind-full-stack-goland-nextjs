"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Filter, Target, TrendingUp } from "lucide-react";
import { useResumeStore } from "@/lib/resume-store";
import { useMounted } from "@/lib/use-mounted";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Builds a smooth polyline through the score history (vertical: 0=top).
 * Interactivity lives on absolutely-positioned HTML hit-area buttons overlaid
 * on the SVG (the SVG itself is distorted by preserveAspectRatio="none", so
 * circles stay decorative). A floating tooltip shows score + scan date; it
 * flips horizontally near the chart edges and vertically under the card top
 * so it never overflows the card. Wrapper height stays exactly 44px — the
 * tooltip is absolutely positioned, so there is zero layout shift.
 */
function TrendChart({ points, color }: { points: { score: number; at: number }[]; color: string }) {
  const W = 100;
  const H = 44;
  const gid = React.useId();
  const [hovered, setHovered] = React.useState<number | null>(null);

  /* Reset hover whenever the underlying data changes — no stale tooltips
     across filter switches or new scans (belt-and-braces on top of key={chartKey}). */
  const dataSig = points.map((p) => `${p.at}:${p.score}`).join("|");
  React.useEffect(() => {
    setHovered(null);
  }, [dataSig]);

  if (points.length < 2) {
    return (
      <div className="flex h-[44px] items-center justify-center text-[11px] text-muted-foreground">
        Run 2+ scans to see your trend
      </div>
    );
  }
  const min = Math.min(...points.map((p) => p.score)) - 4;
  const max = Math.max(...points.map((p) => p.score)) + 4;
  const span = Math.max(1, max - min);
  const step = W / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: i * step,
    y: H - ((p.score - min) / span) * (H - 6) - 3,
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  /* Tooltip geometry. Vertical scale is 1:1 (the chart is exactly H px tall),
     so viewBox y == px from the top; x is expressed as a percentage so it
     follows the horizontally-stretched SVG exactly. */
  const hp = hovered != null ? coords[hovered] : undefined;
  const hd = hovered != null ? points[hovered] : undefined;
  const topPct = hp ? (hp.y / H) * 100 : 0;
  const align = !hp ? "center" : hp.x <= 14 ? "left" : hp.x >= 86 ? "right" : "center";
  const above = !hp || hp.y >= 14;

  return (
    <div
      className="relative h-[44px] w-full"
      onMouseLeave={() => setHovered(null)}
      onClick={(e) => {
        /* Tap/click on empty chart area dismisses the tooltip (touch-friendly). */
        if (!(e.target instanceof Element) || !e.target.closest("button")) setHovered(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setHovered(null);
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[44px] overflow-visible" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hovered === i ? 3.5 : 2.2}
            fill="white"
            stroke={color}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none transition-[r] duration-150 ease-out"
          />
        ))}
      </svg>

      {hp && hd && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-2 py-1 text-[10.5px] leading-tight text-popover-foreground shadow-md"
          style={{
            left: `${hp.x}%`,
            ...(above
              ? { bottom: `calc(${(100 - topPct).toFixed(2)}% + 7px)` }
              : { top: `calc(${topPct.toFixed(2)}% + 7px)` }),
            transform:
              align === "center"
                ? "translateX(-50%)"
                : align === "left"
                  ? "translateX(-6px)"
                  : "translateX(calc(-100% + 6px))",
            whiteSpace: "nowrap",
          }}
        >
          <span className="font-semibold">{hd.score}/100</span>
          <span className="block text-muted-foreground">{format(new Date(hd.at), "MMM d, h:mm a")}</span>
          <span
            className={cn(
              "absolute h-1.5 w-1.5 rotate-45 border-border bg-popover",
              above ? "-bottom-1 border-b border-r" : "-top-1 border-t border-l",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "left" && "left-[2.5px]",
              align === "right" && "right-[2.5px]",
            )}
          />
        </div>
      )}

      {/* Invisible hit-areas: 14px (>= 12px min) for mouse, touch and keyboard. */}
      {coords.map((c, i) => (
        <button
          key={i}
          type="button"
          tabIndex={0}
          aria-label={`Scan on ${format(new Date(points[i].at), "MMM d")}, score ${points[i].score}`}
          className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          style={{ left: `${c.x}%`, top: `${((c.y / H) * 100).toFixed(2)}%` }}
          onMouseEnter={() => setHovered(i)}
          onFocus={() => setHovered(i)}
          onBlur={() => setHovered(null)}
          onClick={() => setHovered(i)}
        />
      ))}
    </div>
  );
}

export function ScoreTrendCard() {
  const mounted = useMounted();
  const history = useResumeStore((s) => s.scoreHistory);
  const resumes = useResumeStore((s) => s.resumes);
  const [filterId, setFilterId] = React.useState<string>("all");

  /* Resumes that actually have history entries, newest-scan first */
  const scannedResumes = React.useMemo(() => {
    const seen = new Map<string, { id: string; title: string; lastAt: number }>();
    for (const h of history) {
      const cur = seen.get(h.resumeId);
      if (!cur || h.at > cur.lastAt) {
        seen.set(h.resumeId, { id: h.resumeId, title: h.resumeTitle, lastAt: h.at });
      }
    }
    return [...seen.values()].sort((a, b) => b.lastAt - a.lastAt);
  }, [history]);

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[44px] w-full" />
          <Skeleton className="mt-3 h-3 w-48" />
        </CardContent>
      </Card>
    );
  }

  const filtered = filterId === "all" ? history : history.filter((h) => h.resumeId === filterId);
  const sorted = [...filtered].sort((a, b) => a.at - b.at);
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const delta = latest && first ? latest.score - first.score : 0;
  const activeResume = resumes.find((r) => r.id === filterId);
  const latestResume = resumes.find((r) => r.id === latest?.resumeId);
  const accent = (filterId !== "all" ? activeResume?.accent : undefined) ?? latestResume?.accent ?? "#10b981";
  const chartKey = `${filterId}-${sorted.length}`;

  return (
    <Card className="group relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: accent }}
      />
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1 space-y-0">
        <CardTitle className="flex shrink-0 items-center gap-2 text-[14px] font-semibold">
          <Target className="w-4 h-4 shrink-0 text-emerald-500" />
          ATS Score Trend
        </CardTitle>
        {delta !== 0 && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            <TrendingUp className={cn("w-3 h-3", delta < 0 && "rotate-180")} />
            {delta > 0 ? "+" : ""}
            {delta} pts
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {scannedResumes.length > 1 && (
          <div className="flex justify-end">
            <Select value={filterId} onValueChange={setFilterId}>
              <SelectTrigger
                size="sm"
                className="h-7 w-[150px] gap-1 rounded-lg border-border/70 bg-muted/50 pl-2 pr-1.5 text-[11px] font-medium"
                aria-label="Filter trend by resume"
              >
                <Filter className="size-3 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All resumes" />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-56">
                <SelectItem value="all" className="text-[12.5px]">
                  All resumes
                </SelectItem>
                {scannedResumes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-[12.5px]">
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <TrendChart key={chartKey} points={sorted} color={accent} />
        {latest ? (
          <div className="flex items-center justify-between gap-2 text-[11.5px]">
            <p className="text-muted-foreground truncate">
              <span className="font-semibold text-foreground">{latest.score}/100</span> · {latest.resumeTitle}
              <span className="mx-1.5">·</span>
              {formatDistanceToNow(new Date(latest.at), { addSuffix: true })}
            </p>
            <Link
              href="/dashboard/ats"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Scan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">
            {filterId === "all"
              ? "No scans yet — run the ATS Scanner to start tracking."
              : "No scans for this resume yet — run the ATS Scanner."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
