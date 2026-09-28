"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  STAGE_META,
  useResumeStore,
  type ApplicationStage,
} from "@/lib/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_ORDER } from "./stage-utils";

interface FormState {
  company: string;
  role: string;
  location: string;
  salary: string;
  url: string;
  stage: ApplicationStage;
  resumeId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  company: "",
  role: "",
  location: "",
  salary: "",
  url: "",
  stage: "saved",
  resumeId: "",
  notes: "",
};

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AddApplicationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addApplication = useResumeStore((s) => s.addApplication);
  const resumes = useResumeStore((s) => s.resumes);

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<{ company?: string; role?: string }>({});

  // Fresh form every time the dialog opens
  React.useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clearError = (key: "company" | "role") =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { company?: string; role?: string } = {};
    if (!form.company.trim()) nextErrors.company = "Company is required";
    if (!form.role.trim()) nextErrors.role = "Role is required";
    setErrors(nextErrors);
    if (nextErrors.company || nextErrors.role) return;

    addApplication({
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      salary: form.salary.trim(),
      url: form.url.trim(),
      stage: form.stage,
      resumeId: form.resumeId,
      notes: form.notes.trim(),
    });
    toast.success(`Added ${form.company.trim()} — ${form.role.trim()}`, {
      description: `Stage: ${STAGE_META[form.stage].label}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Add application</DialogTitle>
          <DialogDescription>
            Track a new opportunity in your pipeline. Company and role are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="add-company" required error={errors.company}>
              <Input
                id="add-company"
                value={form.company}
                onChange={(e) => {
                  setField("company", e.target.value);
                  clearError("company");
                }}
                placeholder="e.g. Linear"
                autoFocus
                aria-invalid={Boolean(errors.company)}
              />
            </Field>
            <Field label="Role" htmlFor="add-role" required error={errors.role}>
              <Input
                id="add-role"
                value={form.role}
                onChange={(e) => {
                  setField("role", e.target.value);
                  clearError("role");
                }}
                placeholder="e.g. Product Engineer"
                aria-invalid={Boolean(errors.role)}
              />
            </Field>
            <Field label="Location" htmlFor="add-location">
              <Input
                id="add-location"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Remote"
              />
            </Field>
            <Field label="Salary" htmlFor="add-salary">
              <Input
                id="add-salary"
                value={form.salary}
                onChange={(e) => setField("salary", e.target.value)}
                placeholder="e.g. $160K – $200K"
              />
            </Field>
          </div>

          <Field label="Job posting URL" htmlFor="add-url">
            <Input
              id="add-url"
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="e.g. linear.app/careers"
              inputMode="url"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Stage" htmlFor="add-stage">
              <Select value={form.stage} onValueChange={(v) => setField("stage", v as ApplicationStage)}>
                <SelectTrigger id="add-stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ backgroundColor: STAGE_META[s].color }}
                        />
                        {STAGE_META[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Resume used" htmlFor="add-resume">
              <Select
                value={form.resumeId || "none"}
                onValueChange={(v) => setField("resumeId", v === "none" ? "" : v)}
              >
                <SelectTrigger id="add-resume" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No resume</SelectItem>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: r.accent }}
                        />
                        <span className="truncate">{r.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="add-notes">
            <Textarea
              id="add-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Referrals, prep notes, follow-up plan…"
            />
          </Field>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="size-4" aria-hidden />
              Add application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
