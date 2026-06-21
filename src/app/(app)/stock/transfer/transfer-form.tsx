"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { transferStock } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";

type Warehouse = { id: string; name: string };
type Variant = { id: string; product: string; detail: string };

export function TransferForm({
  warehouses,
  variants,
}: {
  warehouses: Warehouse[];
  variants: Variant[];
}) {
  const [state, action, pending] = useActionState(transferStock, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <Field>
        <Label htmlFor="variantId" required>Product variant</Label>
        <Select id="variantId" name="variantId" required>
          <option value="">— Select a variant —</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.product} · {v.detail}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Field>
          <Label htmlFor="fromWarehouseId" required>From warehouse</Label>
          <Select id="fromWarehouseId" name="fromWarehouseId" required>
            <option value="">— Select source —</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end pb-1">
          <ArrowRight className="size-5 text-muted-foreground" />
        </div>
        <Field>
          <Label htmlFor="toWarehouseId" required>To warehouse</Label>
          <Select id="toWarehouseId" name="toWarehouseId" required>
            <option value="">— Select destination —</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field>
        <Label htmlFor="quantity" required>Quantity to transfer</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required className="max-w-xs" />
      </Field>

      <Field>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="Reason for transfer…" />
      </Field>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Transfer stock
      </Button>
    </form>
  );
}
