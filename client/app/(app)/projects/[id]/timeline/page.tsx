"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjectQuery } from "@/store/api/syncspaceApi";
import { statusLabel } from "@/lib/task-styles";

const ProjectTimelineChart = dynamic(
  () => import("@/components/features/project-timeline-chart").then((m) => m.ProjectTimelineChart),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[320px] w-full rounded-xl" /> },
);

export default function ProjectTimelinePage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useGetProjectQuery(params.id);

  const rows =
    data?.project.tasks.map((t) => {
      const start = t.dueDate ? new Date(new Date(t.dueDate).getTime() - 7 * 86400000) : new Date();
      const end = t.dueDate ? new Date(t.dueDate) : new Date(start.getTime() + 7 * 86400000);
      const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
      return {
        title: t.title.slice(0, 24) + (t.title.length > 24 ? "…" : ""),
        fullTitle: t.title,
        days: duration,
        status: statusLabel(t.status),
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground">{data?.project.name ?? "Project"} — Gantt-style overview by duration until due date.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/projects/${params.id}`}>Back to board</Link>
        </Button>
      </div>

      {isLoading && <Skeleton className="h-80 w-full rounded-xl" />}

      {!isLoading && data && (
        <Card>
          <CardHeader>
            <CardTitle>Task durations</CardTitle>
            <CardDescription>Bar length approximates days from (due − 7d) to due — a lightweight planning view.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ProjectTimelineChart rows={rows} />
          </CardContent>
        </Card>
      )}

      {!isLoading && data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>Due dates for each task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.project.tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span className="font-medium">{t.title}</span>
                <span className="text-muted-foreground">{t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
