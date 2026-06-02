"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

type Point = { name: string; value: number };

const TONES = [
  "#a16207",
  "#7A1F2B",
  "#2A3759",
  "#1F5F5B",
  "#5B5B3A",
  "#A4583B",
  "#475569",
  "#b45309",
];

export function CategoryBar({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload, label }) =>
            active && payload && payload.length ? (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                <p className="mb-0.5 font-medium text-foreground">{label}</p>
                <p className="tabular text-muted-foreground">
                  {formatNumber(Number(payload[0].value))} units
                </p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={700}>
          {data.map((_, i) => (
            <Cell key={i} fill={TONES[i % TONES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
