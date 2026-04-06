"use client";

import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Lock, LockOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { priorityVariant, statusLabel, statusBadgeClass } from "@/lib/task-styles";
import type { TaskDetail } from "@/types/api";
import { useUpdateTaskMutation } from "@/store/api/syncspaceApi";
import toast from "react-hot-toast";

const COLUMNS: { id: string; title: string }[] = [
  { id: "ToDo", title: "Todo" },
  { id: "WorkInProgress", title: "In Progress" },
  { id: "UnderReview", title: "Under Review" },
  { id: "Completed", title: "Done" },
];

export function KanbanBoard({
  projectId,
  tasks,
  onOpenTask,
}: {
  projectId: string;
  tasks: TaskDetail[];
  onOpenTask: (id: string) => void;
}) {
  const [updateTask] = useUpdateTaskMutation();

  const grouped = useMemo(() => {
    const g: Record<string, TaskDetail[]> = { ToDo: [], WorkInProgress: [], UnderReview: [], Completed: [] };
    for (const t of tasks) {
      if (g[t.status]) g[t.status].push(t);
      else g.ToDo.push(t);
    }
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => a.position - b.position);
    }
    return g;
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const nextStatus = destination.droppableId as TaskDetail["status"];
    const nextPosition = destination.index;
    try {
      await updateTask({
        id: taskId,
        body: { status: nextStatus, position: nextPosition, projectId },
      }).unwrap();
    } catch {
      toast.error("Could not update board");
    }
  };

  return (
    <DragDropContext onDragEnd={(r) => void onDragEnd(r)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <Droppable droppableId={col.id} key={col.id}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex min-h-[280px] flex-col rounded-xl border border-border bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.title}</h3>
                  <Badge variant="secondary" className="rounded-full">
                    {grouped[col.id].length}
                  </Badge>
                </div>
                <div className={cn("flex flex-1 flex-col gap-2", snapshot.isDraggingOver && "bg-primary/5")}>
                  {grouped[col.id].map((task, index) => (
                    <Draggable draggableId={task.id} index={index} key={task.id}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                            <Card
                              role="button"
                              tabIndex={0}
                              onClick={() => onOpenTask(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onOpenTask(task.id);
                                }
                              }}
                              className="cursor-pointer border-border/80 p-3 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-2 text-sm font-semibold leading-snug">{task.title}</p>
                                {task.blockedById ? (
                                  <Lock className="h-4 w-4 shrink-0 text-red-500" aria-label="Blocked" />
                                ) : (
                                  <LockOpen className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Unblocked" />
                                )}
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge variant={priorityVariant(task.priority)} className="rounded-full text-[11px]">
                                  {task.priority}
                                </Badge>
                                <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", statusBadgeClass(task.status))}>
                                  {statusLabel(task.status)}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                {task.dueDate ? (
                                  <span className="text-[11px] text-muted-foreground">{format(new Date(task.dueDate), "MMM d")}</span>
                                ) : (
                                  <span />
                                )}
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={task.assignee?.image ?? undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {task.assignee?.name?.slice(0, 2).toUpperCase() ?? "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              {task.subTasks?.length ? (
                                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary/70"
                                    style={{
                                      width: `${(task.subTasks.filter((s) => s.completed).length / task.subTasks.length) * 100}%`,
                                    }}
                                  />
                                </div>
                              ) : null}
                            </Card>
                          </motion.div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
