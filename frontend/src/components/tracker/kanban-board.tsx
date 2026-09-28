"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  STAGE_META,
  useResumeStore,
  type ApplicationStage,
  type JobApplication,
  type ResumeData,
} from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-card";
import { STAGE_ICONS, STAGE_ORDER } from "./stage-utils";
import { EASE, staggerContainer, staggerItem } from "./motion-presets";

/* ------------------------------ props ----------------------------------- */

interface KanbanBoardProps {
  applications: JobApplication[];
  resumes: ResumeData[];
  onOpen: (id: string) => void;
  onQuickAdd: () => void;
}

/* ------------------------------ board ----------------------------------- */

export function KanbanBoard({ applications, resumes, onOpen, onQuickAdd }: KanbanBoardProps) {
  const moveApplication = useResumeStore((s) => s.moveApplication);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [offerPulse, setOfferPulse] = React.useState<number | null>(null);

  // A click event fires right after a real drag ends (mouseup lands on the same
  // card). Suppress card clicks for a short window after any drag finishes.
  const suppressClickRef = React.useRef(false);

  // Mouse: start dragging after 6px so plain clicks still open the sheet.
  // Touch: press-and-hold (180ms) so vertical page scroll stays smooth.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const resumeById = React.useMemo(() => new Map(resumes.map((r) => [r.id, r])), [resumes]);
  const activeApp = activeId ? applications.find((a) => a.id === activeId) : undefined;

  React.useEffect(() => {
    if (offerPulse === null) return;
    const t = setTimeout(() => setOfferPulse(null), 950);
    return () => clearTimeout(t);
  }, [offerPulse]);

  const endDrag = React.useCallback(() => {
    setActiveId(null);
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 260);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    endDrag();
    const fromStage = event.active.data.current?.stage as ApplicationStage | undefined;
    const toStage = event.over?.data.current?.stage as ApplicationStage | undefined;
    if (!fromStage || !toStage || fromStage === toStage) return;

    const app = applications.find((a) => a.id === event.active.id);
    if (!app) return;

    moveApplication(String(event.active.id), toStage);

    if (toStage === "offer") {
      setOfferPulse(Date.now());
      toast.success("Offer received!", {
        icon: <Trophy className="size-4 text-emerald-500" aria-hidden />,
        description: `${app.company} — ${app.role}. Congratulations, time to negotiate!`,
      });
    } else {
      toast(`Moved ${app.company} → ${STAGE_META[toStage].label}`);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={endDrag}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 lg:flex-row lg:gap-3 lg:overflow-x-auto lg:pb-2 xl:gap-4 scrollbar-thin"
        aria-label="Job application board"
      >
        {STAGE_ORDER.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            apps={applications.filter((a) => a.stage === stage)}
            resumeById={resumeById}
            onOpen={onOpen}
            onQuickAdd={onQuickAdd}
            boardEmpty={applications.length === 0}
            suppressClickRef={suppressClickRef}
            pulsing={stage === "offer" && offerPulse !== null}
          />
        ))}
      </motion.div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeApp ? (
          <ApplicationCard
            app={activeApp}
            resume={activeApp.resumeId ? resumeById.get(activeApp.resumeId) : undefined}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ------------------------------ column ---------------------------------- */

interface ColumnProps {
  stage: ApplicationStage;
  apps: JobApplication[];
  resumeById: Map<string, ResumeData>;
  onOpen: (id: string) => void;
  onQuickAdd: () => void;
  boardEmpty: boolean;
  suppressClickRef: React.RefObject<boolean>;
  pulsing: boolean;
}

function Column({
  stage,
  apps,
  resumeById,
  onOpen,
  onQuickAdd,
  boardEmpty,
  suppressClickRef,
  pulsing,
}: ColumnProps) {
  const meta = STAGE_META[stage];
  const Icon = STAGE_ICONS[stage];
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage}`, data: { stage } });

  return (
    <motion.section
      variants={staggerItem}
      animate={pulsing ? { scale: [1, 1.02, 1] } : undefined}
      transition={pulsing ? { duration: 0.55, ease: "easeInOut" } : undefined}
      aria-label={`${meta.label} column, ${apps.length} ${apps.length === 1 ? "card" : "cards"}`}
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border bg-muted/40 shadow-sm transition-colors",
        "w-full lg:w-auto lg:min-w-[260px] lg:flex-1",
        pulsing && "border-emerald-500/60 shadow-lg shadow-emerald-500/10"
      )}
    >
      <header className="flex items-center gap-2 rounded-t-2xl border-b bg-background/60 px-3 py-2.5">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <Icon aria-hidden className="size-3.5 shrink-0" style={{ color: meta.color }} />
        <h3 className="truncate text-[13px] font-semibold tracking-tight">{meta.label}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {apps.length}
        </span>
      </header>

      {/* droppable body — one droppable per column, no sortable-within */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-b-2xl p-2 transition-all",
          "max-h-[70vh] overflow-y-auto scrollbar-thin lg:max-h-[56vh]",
          isOver && "bg-emerald-500/[0.06] ring-2 ring-inset ring-emerald-500/50"
        )}
      >
        {apps.length === 0 ? (
          <EmptyColumn
            stage={stage}
            boardEmpty={boardEmpty}
            onQuickAdd={onQuickAdd}
            highlighted={isOver}
          />
        ) : (
          apps.map((app, index) => (
            <DraggableCard
              key={app.id}
              app={app}
              index={index}
              resume={app.resumeId ? resumeById.get(app.resumeId) : undefined}
              onOpen={onOpen}
              suppressClickRef={suppressClickRef}
            />
          ))
        )}
      </div>
    </motion.section>
  );
}

/* --------------------------- empty column -------------------------------- */

function EmptyColumn({
  stage,
  boardEmpty,
  onQuickAdd,
  highlighted,
}: {
  stage: ApplicationStage;
  boardEmpty: boolean;
  onQuickAdd: () => void;
  highlighted: boolean;
}) {
  if (stage === "saved" && boardEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">No saved jobs yet.</p>
        <button
          type="button"
          onClick={onQuickAdd}
          className="text-xs font-semibold text-emerald-600 underline underline-offset-2 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Add your first application
        </button>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors",
        highlighted ? "border-emerald-500/50" : "border-border/70"
      )}
    >
      <p className="text-[11px] text-muted-foreground/80">Drop cards here</p>
    </div>
  );
}

/* --------------------------- draggable card ------------------------------ */

function DraggableCard({
  app,
  index,
  resume,
  onOpen,
  suppressClickRef,
}: {
  app: JobApplication;
  index: number;
  resume?: ResumeData;
  onOpen: (id: string) => void;
  suppressClickRef: React.RefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
    data: { stage: app.stage },
  });

  const handleClick = () => {
    if (suppressClickRef.current) return;
    onOpen(app.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: EASE, delay: Math.min(index * 0.04, 0.3) }}
    >
      <button
        type="button"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={handleClick}
        aria-label={`Open ${app.company} — ${app.role} (${STAGE_META[app.stage].label})`}
        className={cn(
          "block w-full touch-manipulation rounded-xl text-left outline-hidden",
          "cursor-grab transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-500/60",
          isDragging && "opacity-40"
        )}
      >
        <ApplicationCard app={app} resume={resume} dragging={isDragging} />
      </button>
    </motion.div>
  );
}
