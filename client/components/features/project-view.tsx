"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarRange, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/features/kanban-board";
import { TaskDetailSheet } from "@/components/features/task-detail-sheet";
import { useGetProjectQuery } from "@/store/api/syncspaceApi";
import { priorityVariant } from "@/lib/task-styles";

export function ProjectView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskFromUrl = searchParams.get("task");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { data, isLoading, error } = useGetProjectQuery(projectId);

  useEffect(() => {
    if (taskFromUrl) {
      setActiveTaskId(taskFromUrl);
      setSheetOpen(true);
    }
  }, [taskFromUrl]);

  const tasks = useMemo(() => data?.project.tasks ?? [], [data?.project.tasks]);

  const onOpenTask = (id: string) => {
    setActiveTaskId(id);
    setSheetOpen(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("task", id);
    router.push(`/projects/${projectId}?${sp.toString()}`);
  };

  const onSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setActiveTaskId(null);
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("task");
      const q = sp.toString();
      router.push(q ? `/projects/${projectId}?${q}` : `/projects/${projectId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data?.project) {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <p className="font-semibold">Project not found</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have been deleted or you may not have access.</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const p = data.project;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{p.name}</h1>
            <Badge variant={priorityVariant(p.priority)}>{p.priority}</Badge>
            <Badge variant="outline">{p.status}</Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{p.description ?? "No description yet."}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/projects/${projectId}/timeline`}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Timeline
              </Link>
            </Button>
            <Button size="sm" variant="outline" type="button" onClick={() => router.push("/dashboard")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </motion.div>

      <KanbanBoard projectId={projectId} tasks={tasks} onOpenTask={onOpenTask} />

      <TaskDetailSheet taskId={activeTaskId} open={sheetOpen} onOpenChange={onSheetOpenChange} />
    </div>
  );
}
