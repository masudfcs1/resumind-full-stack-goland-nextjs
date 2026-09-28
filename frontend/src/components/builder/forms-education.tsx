"use client";

import * as React from "react";
import { ChevronDown, GraduationCap, Plus } from "lucide-react";
import {
  formatMonth,
  uid,
  useResumeStore,
  type EducationItem,
  type ResumeData,
} from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConfirmDelete,
  EmptyHint,
  Field,
  ItemCard,
  MoveButtons,
  StepHeader,
  listOps,
} from "@/components/builder/builder-kit";

const DEGREE_OPTIONS = ["B.S.", "B.A.", "M.S.", "M.B.A.", "Ph.D."] as const;
const OTHER = "__other__";
const MONTH_CLS = "[color-scheme:light] dark:[color-scheme:dark]";

export default function FormEducation({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const items = resume.education;
  const commit = (next: EducationItem[]) => updateResume(resume.id, { education: next });
  const ops = listOps(items, commit);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  function add() {
    const item: EducationItem = {
      id: uid(),
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
    };
    ops.add(item);
    setOpenId(item.id);
  }

  return (
    <section aria-label="Education step">
      <StepHeader
        icon={GraduationCap}
        title="Education"
        description="Degrees, bootcamps, coursework — whatever earns trust."
      >
        <Button type="button" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add education
        </Button>
      </StepHeader>

      {items.length === 0 ? (
        <EmptyHint
          icon={GraduationCap}
          title="No education yet"
          body="Add your most relevant degree or program. GPA is optional — include it if it's 3.5+."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const open = openId === item.id;
            const isPreset = (DEGREE_OPTIONS as readonly string[]).includes(item.degree);
            const selectValue = isPreset ? item.degree : item.degree ? OTHER : "";
            const dateLabel = [formatMonth(item.startDate), formatMonth(item.endDate)]
              .filter(Boolean)
              .join(" — ");
            return (
              <Collapsible
                key={item.id}
                open={open}
                onOpenChange={(o) => setOpenId(o ? item.id : null)}
              >
                <ItemCard>
                  <div className="flex items-center gap-1 p-2 pr-2.5">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
                        aria-expanded={open}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <GraduationCap className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold">
                            {item.school || "New education"}
                          </span>
                          <span className="block truncate text-[11.5px] text-muted-foreground">
                            {[item.degree, item.field, dateLabel].filter(Boolean).join(" · ") ||
                              "Add degree & dates"}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            open && "rotate-180"
                          )}
                          aria-hidden
                        />
                      </button>
                    </CollapsibleTrigger>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <MoveButtons index={index} count={items.length} onMove={(dir) => ops.move(index, dir)} />
                      <ConfirmDelete itemName="education entry" onConfirm={() => ops.remove(index)} />
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-4 border-t px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="School" className="sm:col-span-2">
                          <Input
                            value={item.school}
                            placeholder="University of California, Berkeley"
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { school: e.target.value })}
                          />
                        </Field>
                        <Field label="Degree">
                          <Select
                            value={selectValue}
                            onValueChange={(v) =>
                              ops.patch(index, { degree: v === OTHER ? "" : v })
                            }
                          >
                            <SelectTrigger className="w-full" aria-label="Degree">
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEGREE_OPTIONS.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                              <SelectItem value={OTHER}>Other…</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Field of study">
                          <Input
                            value={item.field}
                            placeholder="Computer Science"
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { field: e.target.value })}
                          />
                        </Field>
                        {selectValue === OTHER && (
                          <Field label="Custom degree" hint="e.g. B.Eng., B.F.A., Certificate">
                            <Input
                              value={item.degree}
                              placeholder="B.Eng."
                              autoFocus
                              autoComplete="off"
                              onChange={(e) => ops.patch(index, { degree: e.target.value })}
                            />
                          </Field>
                        )}
                        <Field label="Dates">
                          <div className="flex items-center gap-2">
                            <Input
                              type="month"
                              aria-label="Start date"
                              value={item.startDate}
                              onChange={(e) => ops.patch(index, { startDate: e.target.value })}
                              className={MONTH_CLS}
                            />
                            <span className="shrink-0 text-xs text-muted-foreground">to</span>
                            <Input
                              type="month"
                              aria-label="End date"
                              value={item.endDate}
                              onChange={(e) => ops.patch(index, { endDate: e.target.value })}
                              className={MONTH_CLS}
                            />
                          </div>
                        </Field>
                        <Field label="GPA" hint="Optional — include if 3.5 or above.">
                          <Input
                            value={item.gpa}
                            placeholder="3.8"
                            inputMode="decimal"
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { gpa: e.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  </CollapsibleContent>
                </ItemCard>
              </Collapsible>
            );
          })}
        </div>
      )}
    </section>
  );
}
