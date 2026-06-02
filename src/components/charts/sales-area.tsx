"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBDT, formatBDTCompact } from "@/lib/format";

type Point = { date: string; label: string; total: number };

export function SalesArea({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => formatBDTCompact(v)}
        />
        <Tooltip
          cursor={{ stroke: "var(--accent)", strokeOpacity: 0.3 }}
          content={({ active, payload, label }) =>
            active && payload && payload.length ? (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                <p className="mb-0.5 font-medium text-foreground">{label}</p>
                <p className="tabular text-accent">
                  {formatBDT(Number(payload[0].value))}
                </p>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#goldFill)"
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
