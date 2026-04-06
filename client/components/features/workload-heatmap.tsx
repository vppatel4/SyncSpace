"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeatmapResponse } from "@/types/api";

function intensityClass(v: number): string {
  if (v <= 0) return "bg-muted/40";
  if (v < 1) return "bg-primary/15";
  if (v < 2) return "bg-primary/30";
  if (v < 3) return "bg-primary/50";
  return "bg-primary/75";
}

export function WorkloadHeatmap({ data, isLoading }: { data: HeatmapResponse | undefined; isLoading: boolean }) {
  const matrix = useMemo(() => {
    if (!data) return { users: [] as string[], days: [] as string[], map: new Map<string, number>() };
    const users = data.users.map((u) => u.id);
    const daySet = new Set<string>();
    for (const c of data.cells) daySet.add(c.date);
    const days = Array.from(daySet).sort();
    const map = new Map<string, number>();
    for (const c of data.cells) map.set(`${c.userId}|${c.date}`, c.count);
    return { users, days, map };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workload heatmap</CardTitle>
        <CardDescription>Who is carrying the most work by day — spot overload early.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {!isLoading && data && (
          <div className="overflow-x-auto">
            <div className="min-w-[520px] space-y-2">
              <div className="flex gap-2 text-[11px] text-muted-foreground">
                <div className="w-32 shrink-0" />
                <div className="flex flex-1 justify-between gap-1">
                  {matrix.days.slice(-14).map((d) => (
                    <span key={d} className="w-6 rotate-[-35deg] text-center">
                      {d.slice(5)}
                    </span>
                  ))}
                </div>
              </div>
              {matrix.users.map((uid) => {
                const user = data.users.find((u) => u.id === uid);
                return (
                  <div key={uid} className="flex items-center gap-2">
                    <div className="w-32 shrink-0 truncate text-xs font-medium">{user?.name ?? "Member"}</div>
                    <div className="flex flex-1 gap-1">
                      {matrix.days.slice(-14).map((d) => {
                        const v = matrix.map.get(`${uid}|${d}`) ?? 0;
                        return (
                          <motion.div
                            key={`${uid}-${d}`}
                            title={`${v}`}
                            initial={false}
                            animate={{ scale: 1 }}
                            className={`h-6 flex-1 rounded-md ${intensityClass(v)} ring-1 ring-border/40`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
