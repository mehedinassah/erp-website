"use client";

import { useActionState, useState } from "react";
import { Loader2, AlertCircle, Truck } from "lucide-react";
import { createPurchaseOrder } from "@/app/(app)/purchases/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionState } from "@/lib/validation";

type Suggestion = {
  variantId: string;
  label: string;
  sku: string;
  current: number;
  threshold: number;
  suggested: number;
  cost: number;
};
type Option = { id: string; name: string };

export function ReorderList({
  suggestions,
  suppliers,
  warehouses,
}: {
  suggestions: Suggestion[];
  suppliers: Option[];
  warehouses: Option[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPurchaseOrder, {});
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      suggestions.map((s) => [s.variantId, { include: true, qty: s.suggested }]),
    ) as Record<string, { include: boolean; qty: number }>,
  );

  const selected = suggestions.filter((s) => rows[s.variantId]?.include && rows[s.variantId]?.qty > 0);
  const total = selected.reduce((sum, s) => sum + s.cost * rows[s.variantId].qty, 0);

  return (
    <form
      action={(fd) => {
        fd.set("items", JSON.stringify(selected.map((s) => ({ variantId: s.variantId, quantity: rows[s.variantId].qty, price: s.cost }))));
        action(fd);
      }}
      className="space-y-5"
    >
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <Field>
            <Label htmlFor="partyId" required>Supplier</Label>
            <Select id="partyId" name="partyId" required>
              <option value="">— Select supplier —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="warehouseId" required>Deliver to</Label>
            <Select id="warehouseId" name="warehouseId" required>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="expectedDate">Expected date</Label>
            <Input id="expectedDate" name="expectedDate" type="date" />
          </Field>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <span className="sr-only">Include</span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">In stock</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Order qty</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suggestions.map((s) => {
              const r = rows[s.variantId];
              return (
                <tr key={s.variantId} className={r.include ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) => setRows((p) => ({ ...p, [s.variantId]: { ...p[s.variantId], include: e.target.checked } }))}
                      className="accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={s.current === 0 ? "danger" : "warning"}>{s.current} / {s.threshold}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      min={1}
                      value={r.qty}
                      onChange={(e) => setRows((p) => ({ ...p, [s.variantId]: { ...p[s.variantId], qty: Math.max(1, parseInt(e.target.value) || 1) } }))}
                      className="mx-auto w-20 text-center"
                    />
                  </td>
                  <td className="px-4 py-3 tabular text-right text-muted-foreground">
                    ৳{(s.cost * r.qty).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.length} item{selected.length !== 1 ? "s" : ""} · est. <span className="tabular font-semibold text-foreground">৳{total.toLocaleString()}</span>
        </p>
        <Button type="submit" variant="gold" disabled={pending || selected.length === 0}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
          Generate purchase order
        </Button>
      </div>
    </form>
  );
}
