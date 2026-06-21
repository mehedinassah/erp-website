"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, AlertCircle, ClipboardCheck } from "lucide-react";
import { applyStockTake } from "@/app/(app)/stock/take/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionState } from "@/lib/validation";

type Row = { variantId: string; label: string; sku: string; system: number };

export function StockTakeForm({ warehouseId, rows }: { warehouseId: string; rows: Row[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(applyStockTake, {});
  const [counts, setCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(rows.map((r) => [r.variantId, r.system])),
  );
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => !q || r.label.toLowerCase().includes(q.toLowerCase()) || r.sku.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  const changes = rows.filter((r) => counts[r.variantId] !== r.system);

  return (
    <form
      action={(fd) => {
        fd.set("warehouseId", warehouseId);
        fd.set("items", JSON.stringify(rows.map((r) => ({ variantId: r.variantId, counted: counts[r.variantId] }))));
        action(fd);
      }}
      className="space-y-4"
    >
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or SKU…" className="max-w-xs" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{changes.length}</span> change{changes.length !== 1 ? "s" : ""} to apply
        </p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">System</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Counted</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const counted = counts[r.variantId] ?? 0;
              const variance = counted - r.system;
              return (
                <tr key={r.variantId} className={variance !== 0 ? "bg-accent-soft/30" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.sku}</p>
                  </td>
                  <td className="px-4 py-3 tabular text-right text-muted-foreground">{r.system}</td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      min={0}
                      value={counted}
                      onChange={(e) => setCounts((p) => ({ ...p, [r.variantId]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="mx-auto w-24 text-center"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {variance === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge tone={variance > 0 ? "success" : "danger"}>{variance > 0 ? `+${variance}` : variance}</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Button type="submit" variant="gold" disabled={pending || changes.length === 0}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
        Apply {changes.length} adjustment{changes.length !== 1 ? "s" : ""}
      </Button>
    </form>
  );
}
