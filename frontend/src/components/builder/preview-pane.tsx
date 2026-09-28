"use client";

import * as React from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_META, type ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import ResumePreview from "@/components/resume/resume-preview";
import { Button } from "@/components/ui/button";

/* Spec-defined zoom presets: Fit / Small / Actual. */
const ZOOMS = [
  { label: "Fit", value: 0.45 },
  { label: "Small", value: 0.6 },
  { label: "Actual", value: 0.75 },
] as const;

export default function PreviewPane({
  resume,
  className,
}: {
  resume: ResumeData;
  className?: string;
}) {
  const [zoom, setZoom] = React.useState<number>(0.6);
  const [busy, setBusy] = React.useState(false);
  const zoomRef = React.useRef(zoom);
  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  /**
   * Temporarily resets CSS zoom to 1 so the print dialog (and #print-root
   * print CSS in globals.css) outputs the resume at true A4 size.
   */
  function handleExport(showToast: boolean) {
    if (busy) return;
    if (showToast) {
      toast.info('Choose "Save as PDF" in the print dialog', {
        description: "Set margins to None and enable background graphics for the best result.",
      });
    }
    setBusy(true);
    window.setTimeout(() => {
      const prev = zoomRef.current;
      setZoom(1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      window.setTimeout(() => {
        window.print();
        setZoom(prev);
        setBusy(false);
      }, 80);
    }, showToast ? 300 : 0);
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {/* Sticky header bar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur md:px-4">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-black/5 dark:ring-white/10"
          style={{ background: resume.accent }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight">
            {TEMPLATE_META[resume.template].name}
          </p>
          <p className="truncate text-[10.5px] leading-tight text-muted-foreground">
            {resume.personal.fullName.trim() || "Untitled"} · A4
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border p-0.5" role="group" aria-label="Zoom level">
            {ZOOMS.map((z) => (
              <button
                key={z.label}
                type="button"
                title={`${z.label} (${Math.round(z.value * 100)}%)`}
                aria-label={`Zoom ${z.label} — ${Math.round(z.value * 100)}%`}
                aria-pressed={zoom === z.value}
                disabled={busy}
                onClick={() => setZoom(z.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                  zoom === z.value
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {z.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => handleExport(true)}
            className="h-8 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Print resume"
            disabled={busy}
            onClick={() => handleExport(false)}
          >
            <Printer className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Dotted, neutral scrollable backdrop */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain bg-muted/40 p-4 dark:bg-zinc-950/50 md:p-6"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(127,127,127,0.30) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div
          className="mx-auto w-fit"
          style={{ zoom, transition: "zoom 180ms ease" }}
        >
          {/* print CSS in globals.css prints only #print-root */}
          <ResumePreview resume={resume} id="print-root" />
          <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
            794 × 1123 px · A4 at 96 dpi
          </p>
        </div>
      </div>
    </div>
  );
}
