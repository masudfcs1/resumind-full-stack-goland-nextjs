"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function useSanitizedId(prefix: string): string {
  const raw = React.useId();
  return React.useMemo(() => `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`, [raw, prefix]);
}

/* ------------------------------------------------------------------ */
/* Sparkline — tiny inline line chart (uses currentColor)              */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  className,
  width = 100,
  height = 34,
}: {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  const gid = useSanitizedId("spark");
  const safeData = data.length > 1 ? data : [...data, ...data];
  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;

  const pts = safeData.map((v, i) => {
    const x = 3 + (i / (safeData.length - 1)) * (width - 6);
    const y = height - 4 - ((v - min) / range) * (height - 9);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width - 3},${height} L3,${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-24", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} stroke="none" />
      <motion.path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ScoreRing — animated circular ATS score gauge                       */
/* ------------------------------------------------------------------ */

export function scoreColor(score: number): string {
  if (score >= 85) return "#10b981"; // emerald-500
  if (score >= 70) return "#f59e0b"; // amber-500
  return "#f43f5e"; // rose-500
}

export function ScoreRing({
  score,
  size = 44,
  strokeWidth = 4,
  className,
  showLabel = true,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(pct);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`ATS score ${pct} out of 100`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * pct) / 100 }}
        transition={{ duration: 1, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {showLabel && (
        <text
          x="50%"
          y="50%"
          dy={size >= 40 ? "0.05em" : "0.08em"}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground"
          fontSize={Math.round(size * (pct >= 100 ? 0.28 : 0.32))}
          fontWeight={700}
        >
          {pct}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ActivityBars — weekly bar chart (SVG, animated grow, hover titles)  */
/* ------------------------------------------------------------------ */

export interface DayActivity {
  day: string;
  value: number;
}

export function ActivityBars({
  data,
  className,
  height = 128,
}: {
  data: DayActivity[];
  className?: string;
  height?: number;
}) {
  const gid = useSanitizedId("bars");
  const W = 300;
  const H = height;
  const labelSpace = 20;
  const gap = 12;
  const n = Math.max(data.length, 1);
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("w-full", className)}
      role="img"
      aria-label="Activity for each day of this week"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" className="stop-teal-600 dark:stop-teal-400" />
          <stop offset="100%" className="stop-emerald-500 dark:stop-emerald-400" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * (H - labelSpace - 6), 4);
        const x = i * (bw + gap);
        const y = H - labelSpace - h;
        return (
          <g key={d.day}>
            <title>{`${d.day} — ${d.value} actions`}</title>
            <motion.rect
              x={x}
              width={bw}
              rx={5}
              fill={`url(#${gid})`}
              initial={{ y: H - labelSpace, height: 0, opacity: 0.6 }}
              animate={{ y, height: h, opacity: 1 }}
              whileHover={{ opacity: 0.82 }}
              transition={{ duration: 0.65, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ cursor: "default" }}
            />
            <text
              x={x + bw / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={9.5}
              fontWeight={600}
              className="fill-muted-foreground"
            >
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
