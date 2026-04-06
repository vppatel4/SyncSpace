"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = {
  title: string;
  fullTitle: string;
  days: number;
  status: string;
};

export function ProjectTimelineChart({ rows }: { rows: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
          }}
          formatter={(value, _n, p) => [
            `${value} d — ${(p?.payload as { status?: string }).status ?? ""}`,
            "Duration",
          ]}
        />
        <Bar dataKey="days" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
