"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyWorkQuery } from "@/store/api/syncspaceApi";
import { priorityVariant } from "@/lib/task-styles";
import { EmptyTasks } from "@/components/illustrations/empty-states";
import type { TaskDetail } from "@/types/api";

function TaskRow({ task }: { task: TaskDetail }) {
  return (
    <Link
      href={`/projects/${task.projectId}?task=${task.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/40 px-3 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">{task.project?.name ?? "Project"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={priorityVariant(task.priority)} className="text-[10px]">
          {task.priority}
        </Badge>
        {task.dueDate && <span className="text-[11px] text-muted-foreground">{format(new Date(task.dueDate), "MMM d")}</span>}
      </div>
    </Link>
  );
}

function Section({ title, tasks }: { title: string; tasks: TaskDetail[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here — you are clear.</p>
          ) : (
            tasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MyWorkPage() {
  const { data, isLoading } = useGetMyWorkQuery();

  const empty =
    data &&
    data.overdue.length === 0 &&
    data.dueToday.length === 0 &&
    data.dueThisWeek.length === 0 &&
    data.recentlyCompleted.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
        <p className="text-sm text-muted-foreground">A personal command center for your SyncSpace assignments.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && empty && <EmptyTasks />}

      {!isLoading && data && !empty && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Overdue" tasks={data.overdue} />
          <Section title="Due today" tasks={data.dueToday} />
          <Section title="Due this week" tasks={data.dueThisWeek} />
          <Section title="Recently completed" tasks={data.recentlyCompleted} />
        </div>
      )}
    </div>
  );
}
