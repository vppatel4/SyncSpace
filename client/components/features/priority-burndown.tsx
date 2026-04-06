"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BurndownResponse } from "@/types/api";

export function PriorityBurndown({ data, isLoading }: { data: BurndownResponse | undefined; isLoading: boolean }) {
  const chartData =
    data?.series.map((s) => ({
      week: s.week.slice(5),
      urgent: s.urgent,
      high: s.high,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Priority burndown</CardTitle>
        <CardDescription>Urgent vs High tasks completed per week — protect what matters.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}
        {!isLoading && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                />
                <Line type="monotone" dataKey="urgent" stroke="#ef4444" strokeWidth={2} dot={false} name="Urgent" />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={false} name="High" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
