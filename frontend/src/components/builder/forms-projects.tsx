"use client";

import * as React from "react";
import { FolderGit2, Plus, X } from "lucide-react";
import { uid, useResumeStore, type ProjectItem, type ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function FormProjects({ resume }: { resume: ResumeData }) {
  const updateResume = useResumeStore((s) => s.updateResume);
  const items = resume.projects;
  const commit = (next: ProjectItem[]) => updateResume(resume.id, { projects: next });
  const ops = listOps(items, commit);

  /* Raw comma-separated drafts per project so typing stays smooth while chips update live. */
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  function add() {
    const item: ProjectItem = { id: uid(), name: "", url: "", description: "", tech: [] };
    ops.add(item);
    setDrafts((d) => ({ ...d, [item.id]: "" }));
  }

  function parseTech(raw: string): string[] {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function setTech(item: ProjectItem, index: number, raw: string) {
    setDrafts((d) => ({ ...d, [item.id]: raw }));
    ops.patch(index, { tech: parseTech(raw) });
  }

  function removeTech(item: ProjectItem, index: number, techIndex: number) {
    const next = item.tech.filter((_, i) => i !== techIndex);
    setDrafts((d) => ({ ...d, [item.id]: next.join(", ") }));
    ops.patch(index, { tech: next });
  }

  return (
    <section aria-label="Projects step">
      <StepHeader
        icon={FolderGit2}
        title="Projects"
        description="Side projects and open-source work that prove you build things."
      >
        <Button type="button" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add project
        </Button>
      </StepHeader>

      {items.length === 0 ? (
        <EmptyHint
          icon={FolderGit2}
          title="No projects yet"
          body="Even one well-described project with a live link makes junior and mid-level resumes far stronger."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <ItemCard key={item.id} className="p-4">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FolderGit2 className="h-4 w-4" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                  {item.name || "New project"}
                </p>
                <MoveButtons index={index} count={items.length} onMove={(dir) => ops.move(index, dir)} />
                <ConfirmDelete itemName="project" onConfirm={() => ops.remove(index)} />
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={item.name}
                      placeholder="Design System Pro"
                      autoComplete="off"
                      onChange={(e) => ops.patch(index, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="URL">
                    <Input
                      value={item.url}
                      placeholder="github.com/you/project"
                      autoComplete="off"
                      onChange={(e) => ops.patch(index, { url: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={item.description}
                    placeholder="Open-source React component library with 4.2K GitHub stars, used by 300+ projects."
                    onChange={(e) => ops.patch(index, { description: e.target.value })}
                    className="text-[13px]"
                  />
                </Field>

                <Field label="Tech stack" hint="Separate technologies with commas.">
                  <Input
                    value={drafts[item.id] ?? item.tech.join(", ")}
                    placeholder="React, TypeScript, Storybook"
                    autoComplete="off"
                    onChange={(e) => setTech(item, index, e.target.value)}
                  />
                  {item.tech.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {item.tech.map((t, ti) => (
                        <span
                          key={`${t}-${ti}`}
                          className={cn(
                            "flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-muted-foreground"
                          )}
                        >
                          {t}
                          <button
                            type="button"
                            aria-label={`Remove ${t} from tech stack`}
                            onClick={() => removeTech(item, index, ti)}
                            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted-foreground/15 hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </section>
  );
}
