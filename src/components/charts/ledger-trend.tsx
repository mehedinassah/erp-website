"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTaka, formatBDTCompact } from "@/lib/format";

type Point = { label: string; collected: number; paid: number };

export function LedgerTrend({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="paid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatBDTCompact(v)} />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          content={({ active, payload, label }) =>
            active && payload && payload.length ? (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                <p className="mb-1 font-medium text-foreground">{label}</p>
                <p className="tabular text-success">Collected: {formatTaka(Number(payload.find((p) => p.dataKey === "collected")?.value ?? 0))}</p>
                <p className="tabular text-warning">Paid out: {formatTaka(Number(payload.find((p) => p.dataKey === "paid")?.value ?? 0))}</p>
              </div>
            ) : null
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === "collected" ? "Collected (Paona)" : "Paid out (Dena)")} />
        <Area type="monotone" dataKey="collected" stroke="var(--success)" strokeWidth={2} fill="url(#collected)" animationDuration={700} />
        <Area type="monotone" dataKey="paid" stroke="var(--warning)" strokeWidth={2} fill="url(#paid)" animationDuration={700} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
