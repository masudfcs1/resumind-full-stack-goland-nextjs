"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ============================== Step header ============================== */

export function StepHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-[13px] text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================== Form field ============================== */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12.5px] font-medium text-foreground/80">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ============================== Input with leading icon ============================== */

export function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}

/* ============================== Item card shell ============================== */

export function ItemCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-background shadow-xs", className)}>{children}</div>
  );
}

/* ============================== Reorder buttons ============================== */

export function MoveButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        aria-label="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/* ============================== Delete with confirm ============================== */

export function ConfirmDelete({
  itemName,
  onConfirm,
  className,
}: {
  itemName: string;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${itemName}`}
          className={cn("h-7 w-7 text-muted-foreground hover:text-destructive", className)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Everything inside this {itemName} will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ============================== Immutable list operations ============================== */

export function listOps<T>(items: T[], commit: (next: T[]) => void) {
  return {
    add(item: T) {
      commit([...items, item]);
    },
    patch(index: number, patch: Partial<T>) {
      commit(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    },
    remove(index: number) {
      commit(items.filter((_, i) => i !== index));
    },
    move(index: number, dir: -1 | 1) {
      const j = index + dir;
      if (j < 0 || j >= items.length) return;
      const next = [...items];
      [next[index], next[j]] = [next[j], next[index]];
      commit(next);
    },
  };
}

/* ============================== Empty state ============================== */

export function EmptyHint({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="max-w-[280px] text-[12px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
