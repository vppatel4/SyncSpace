"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetActivityQuery,
  useGetPriorityBurndownQuery,
  useGetProjectsQuery,
  useGetWorkloadHeatmapQuery,
} from "@/store/api/syncspaceApi";
import { TaskPulse } from "@/components/features/task-pulse";
import { WorkloadHeatmap } from "@/components/features/workload-heatmap";

/** Recharts breaks Next.js SSR (webpack `reading 'call'`); load chart only on the client. */
const PriorityBurndown = dynamic(
  () => import("@/components/features/priority-burndown").then((m) => m.PriorityBurndown),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Priority burndown</CardTitle>
          <CardDescription>Urgent vs High tasks completed per week — protect what matters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    ),
  },
);

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-3xl font-bold tracking-tight"
    >
      {value}
    </motion.span>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: activity, isLoading: loadingActivity } = useGetActivityQuery(40, { pollingInterval: 30000 });
  const { data: heatmap, isLoading: loadingHeat } = useGetWorkloadHeatmapQuery(84);
  const { data: burndown, isLoading: loadingBurn } = useGetPriorityBurndownQuery({ weeks: 12 });

  const totalTasks = projects?.projects.reduce((acc, p) => acc + (p._count?.tasks ?? 0), 0) ?? 0;
  const activeProjects = projects?.projects.filter((p) => p.status === "Active").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your SyncSpace mission control — workload, priorities, and pulse.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader>
            <CardDescription>Active projects</CardDescription>
            <CardTitle className="text-3xl">
              {loadingProjects ? <Skeleton className="h-9 w-16" /> : <AnimatedNumber value={activeProjects} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Projects currently in motion.</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardDescription>Total tasks tracked</CardDescription>
            <CardTitle className="text-3xl">
              {loadingProjects ? <Skeleton className="h-9 w-16" /> : <AnimatedNumber value={totalTasks} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Across every workspace you can access.</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardDescription>Activity (24h)</CardDescription>
            <CardTitle className="text-3xl">
              {loadingActivity ? <Skeleton className="h-9 w-16" /> : <AnimatedNumber value={activity?.items.length ?? 0} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Recent events in your feed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskPulse items={activity?.items} isLoading={loadingActivity} />
        <PriorityBurndown data={burndown} isLoading={loadingBurn} />
      </div>

      <WorkloadHeatmap data={heatmap} isLoading={loadingHeat} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Jump back into your SyncSpace workspaces.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">
              View all
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {loadingProjects &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          {!loadingProjects &&
            projects?.projects.slice(0, 6).map((p, idx) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex h-full flex-col justify-between rounded-xl border border-border/80 bg-card/40 p-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-primary" />
                      <p className="font-semibold">{p.name}</p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description ?? "No description"}</p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{p._count?.tasks ?? 0} tasks</p>
                </Link>
              </motion.div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
