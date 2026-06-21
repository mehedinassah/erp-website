"use client";

import { useActionState, useState } from "react";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { createSalesReturn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";
import type { ActionState } from "@/lib/validation";

type SOItem = {
  variantId: string;
  label: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export function ReturnForm({
  salesOrderId,
  items,
}: {
  salesOrderId: string;
  items: SOItem[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createSalesReturn,
    {},
  );

  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.variantId, 0])),
  );

  const totalReturn = items.reduce(
    (s, i) => s + (qtys[i.variantId] ?? 0) * i.unitPrice,
    0,
  );

  function buildFormData(fd: FormData) {
    fd.set("salesOrderId", salesOrderId);
    const returnItems = items
      .filter((i) => (qtys[i.variantId] ?? 0) > 0)
      .map((i) => ({
        variantId: i.variantId,
        quantity: qtys[i.variantId],
        unitPrice: i.unitPrice,
      }));
    fd.set("items", JSON.stringify(returnItems));
  }

  return (
    <form
      action={(fd) => {
        buildFormData(fd);
        action(fd);
      }}
      className="space-y-6"
    >
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Sold</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Return qty</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Refund</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.variantId}>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </td>
                <td className="px-4 py-3 text-center tabular text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={qtys[item.variantId] ?? 0}
                    onChange={(e) =>
                      setQtys((p) => ({
                        ...p,
                        [item.variantId]: Math.min(
                          item.quantity,
                          Math.max(0, parseInt(e.target.value) || 0),
                        ),
                      }))
                    }
                    className="mx-auto w-20 text-center"
                  />
                </td>
                <td className="px-4 py-3 tabular text-right text-destructive">
                  {(qtys[item.variantId] ?? 0) > 0
                    ? `−৳${((qtys[item.variantId] ?? 0) * item.unitPrice).toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted/40">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold">Total refund</td>
              <td className="px-4 py-3 tabular text-right font-semibold text-destructive">
                −৳{totalReturn.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" name="reason" placeholder="e.g. Defective item, wrong size…" />
        </Field>
        <Field>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Any additional notes…" />
        </Field>
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="gold" disabled={pending || totalReturn === 0}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
          Process return · ৳{totalReturn.toLocaleString()}
        </Button>
      </div>
    </form>
  );
}
