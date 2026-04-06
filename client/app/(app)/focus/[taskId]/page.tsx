"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetTaskQuery, useUpdateTaskMutation } from "@/store/api/syncspaceApi";
import toast from "react-hot-toast";
import type { TaskDetail } from "@/types/api";

export default function FocusPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const { data, isLoading } = useGetTaskQuery(params.taskId);
  const [updateTask, { isLoading: saving }] = useUpdateTaskMutation();
  const task = data?.task;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (task) router.push(`/projects/${task.projectId}?task=${task.id}`);
        else router.push("/dashboard");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, task]);

  const toggleSub = async (t: TaskDetail, subId: string, completed: boolean) => {
    const next = (t.subTasks ?? []).map((s) => (s.id === subId ? { ...s, completed } : s));
    try {
      await updateTask({
        id: t.id,
        body: {
          subTasks: next.map((s) => ({ title: s.title, completed: s.completed, position: s.position })),
          projectId: t.projectId,
        },
      }).unwrap();
    } catch {
      toast.error("Could not update checklist");
    }
  };

  if (isLoading || !task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-muted-foreground">{isLoading ? "Loading focus…" : "Task not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 md:py-20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Focus mode</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{task.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Due {task.dueDate ? format(new Date(task.dueDate), "MMMM d, yyyy") : "not set"} · {task.project?.name}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Exit focus"
            onClick={() => router.push(`/projects/${task.projectId}?task=${task.id}`)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div>
          <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-foreground/90">{task.description ?? "Add a description in the task panel."}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
          <div className="space-y-2">
            {(task.subTasks ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3">
                <Checkbox checked={s.completed} disabled={saving} onCheckedChange={(v) => void toggleSub(task, s.id, Boolean(v))} />
                <span className={s.completed ? "text-muted-foreground line-through" : "text-base"}>{s.title}</span>
              </label>
            ))}
            {!task.subTasks?.length && <p className="text-sm text-muted-foreground">No checklist items.</p>}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">Press Escape to exit focus mode</p>
      </div>
    </div>
  );
}
