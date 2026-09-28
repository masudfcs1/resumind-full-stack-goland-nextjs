"use client";

import * as React from "react";
import { Briefcase, ChevronDown, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  formatMonth,
  uid,
  useResumeStore,
  type ExperienceItem,
  type ResumeData,
} from "@/lib/resume-store";
import { enhanceBullet, sleep } from "@/lib/mock-ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDelete,
  EmptyHint,
  Field,
  ItemCard,
  MoveButtons,
  StepHeader,
  listOps,
} from "@/components/builder/builder-kit";

const MONTH_CLS = "[color-scheme:light] dark:[color-scheme:dark]";

export default function FormExperience({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const items = resume.experience;
  const commit = (next: ExperienceItem[]) => updateResume(resume.id, { experience: next });
  const ops = listOps(items, commit);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);
  const [enhancing, setEnhancing] = React.useState<string | null>(null);

  function add() {
    const item: ExperienceItem = {
      id: uid(),
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    };
    ops.add(item);
    setOpenId(item.id);
  }

  async function enhance(expId: string, bulletIndex: number) {
    const key = `${expId}:${bulletIndex}`;
    setEnhancing(key);
    await sleep(600);
    const fresh = useResumeStore.getState().resumes.find((r) => r.id === resume.id);
    const exp = fresh?.experience.find((e) => e.id === expId);
    const raw = exp?.bullets[bulletIndex] ?? "";
    if (!raw.trim()) {
      setEnhancing(null);
      return;
    }
    const improved = enhanceBullet(raw);
    commit(
      (fresh?.experience ?? items).map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.map((b, i) => (i === bulletIndex ? improved : b)) }
          : e
      )
    );
    setEnhancing(null);
    toast.success("Bullet enhanced", {
      description: "Rewritten with a stronger action verb and a measurable metric.",
    });
  }

  function setBullets(expId: string, bullets: string[]) {
    commit(items.map((e) => (e.id === expId ? { ...e, bullets } : e)));
  }

  return (
    <section aria-label="Work experience step">
      <StepHeader
        icon={Briefcase}
        title="Work experience"
        description="Impact-first bullets beat job descriptions every time."
      >
        <Button type="button" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add position
        </Button>
      </StepHeader>

      {items.length === 0 ? (
        <EmptyHint
          icon={Briefcase}
          title="No positions yet"
          body="Add your most recent role first. Start each bullet with an action verb and end with a number."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const open = openId === item.id;
            const dateLabel = [
              formatMonth(item.startDate),
              item.current ? "Present" : formatMonth(item.endDate),
            ]
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
                          <Briefcase className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold">
                            {item.company || "New position"}
                          </span>
                          <span className="block truncate text-[11.5px] text-muted-foreground">
                            {[item.role, dateLabel].filter(Boolean).join(" · ") || "Add role & dates"}
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
                      <ConfirmDelete itemName="position" onConfirm={() => ops.remove(index)} />
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-4 border-t px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Role">
                          <Input
                            value={item.role}
                            placeholder="Frontend Engineer"
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { role: e.target.value })}
                          />
                        </Field>
                        <Field label="Company">
                          <Input
                            value={item.company}
                            placeholder="Acme Inc."
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { company: e.target.value })}
                          />
                        </Field>
                        <Field label="Location">
                          <Input
                            value={item.location}
                            placeholder="San Francisco, CA"
                            autoComplete="off"
                            onChange={(e) => ops.patch(index, { location: e.target.value })}
                          />
                        </Field>
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
                              disabled={item.current}
                              onChange={(e) => ops.patch(index, { endDate: e.target.value })}
                              className={cn(MONTH_CLS, item.current && "opacity-50")}
                            />
                          </div>
                        </Field>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium">I currently work here</p>
                          <p className="text-[11px] text-muted-foreground">Hides the end date on your resume.</p>
                        </div>
                        <Switch
                          checked={item.current}
                          onCheckedChange={(v) => ops.patch(index, { current: v, endDate: v ? "" : item.endDate })}
                          aria-label="I currently work here"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12.5px] font-medium text-foreground/80">Bullets</Label>
                        {item.bullets.map((bullet, bi) => {
                          const key = `${item.id}:${bi}`;
                          return (
                            <div key={bi} className="flex items-start gap-2">
                              <Textarea
                                rows={2}
                                value={bullet}
                                placeholder="Led a team of 5 engineers to ship…"
                                onChange={(e) =>
                                  setBullets(
                                    item.id,
                                    item.bullets.map((b, i) => (i === bi ? e.target.value : b))
                                  )
                                }
                                className="min-h-[52px] text-[13px]"
                              />
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label="Enhance bullet with AI"
                                  disabled={enhancing !== null || !bullet.trim()}
                                  onClick={() => enhance(item.id, bi)}
                                >
                                  {enhancing === key ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" aria-hidden />
                                  ) : (
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  aria-label="Delete bullet"
                                  onClick={() =>
                                    setBullets(
                                      item.id,
                                      item.bullets.filter((_, i) => i !== bi)
                                    )
                                  }
                                >
                                  <X className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-[12.5px] text-muted-foreground"
                          onClick={() => setBullets(item.id, [...item.bullets, ""])}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden /> Add bullet
                        </Button>
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
