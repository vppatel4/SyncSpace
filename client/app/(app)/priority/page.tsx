"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTasksQuery } from "@/store/api/syncspaceApi";
import { priorityVariant } from "@/lib/task-styles";
import { EmptyTasks } from "@/components/illustrations/empty-states";
import type { TaskDetail } from "@/types/api";

const PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;

export default function PriorityPage() {
  const [tab, setTab] = useState<(typeof PRIORITIES)[number]>("Urgent");
  const { data, isLoading } = useGetTasksQuery();

  const byPriority = useMemo(() => {
    const all = data?.tasks ?? [];
    const open = all.filter((t) => t.status !== "Completed");
    return {
      Urgent: open.filter((t) => t.priority === "Urgent"),
      High: open.filter((t) => t.priority === "High"),
      Medium: open.filter((t) => t.priority === "Medium"),
      Low: open.filter((t) => t.priority === "Low"),
    } as Record<(typeof PRIORITIES)[number], TaskDetail[]>;
  }, [data?.tasks]);

  const tasks = byPriority[tab];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Priority views</h1>
        <p className="text-sm text-muted-foreground">Focus on what matters — slice all SyncSpace tasks by priority.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof PRIORITIES)[number])}>
        <TabsList className="flex flex-wrap">
          {PRIORITIES.map((p) => (
            <TabsTrigger key={p} value={p}>
              {p}
            </TabsTrigger>
          ))}
        </TabsList>

        {PRIORITIES.map((p) => (
          <TabsContent key={p} value={p} className="mt-4">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Open {p} tasks
                  <Badge variant={priorityVariant(p)}>{byPriority[p].length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
                {!isLoading && tasks.length === 0 && tab === p && <EmptyTasks />}
                {!isLoading && byPriority[p].length > 0 && (
                  <ul className="space-y-2">
                    {byPriority[p].map((t: TaskDetail) => (
                      <li key={t.id}>
                        <Link
                          href={`/projects/${t.projectId}?task=${t.id}`}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3 text-sm hover:bg-muted/40"
                        >
                          <span className="font-medium">{t.title}</span>
                          <span className="text-xs text-muted-foreground">{t.project?.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
