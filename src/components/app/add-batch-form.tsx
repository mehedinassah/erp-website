"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, PackagePlus } from "lucide-react";
import { addBatch } from "@/app/(app)/stock/expiry/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/validation";

type Variant = { id: string; label: string };
type Warehouse = { id: string; name: string };

export function AddBatchForm({
  variants,
  warehouses,
}: {
  variants: Variant[];
  warehouses: Warehouse[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addBatch, {});
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast({ title: "Batch recorded & stock added", variant: "success" });
      formRef.current?.reset();
    } else if (state.error) {
      toast({ title: state.error, variant: "error" });
    }
  }, [state, toast]);

  if (variants.length === 0) {
    return (
      <p className="rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        No expiry-tracked products yet. Edit a product and enable <strong>“Track batch &amp; expiry”</strong> to record batches here.
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <Label htmlFor="variantId" required>Product</Label>
          <Select id="variantId" name="variantId" required>
            <option value="">— Select a product —</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="warehouseId" required>Warehouse</Label>
          <Select id="warehouseId" name="warehouseId" required>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="quantity" required>Quantity received</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
        </Field>
        <Field>
          <Label htmlFor="batchNumber">Batch / lot number</Label>
          <Input id="batchNumber" name="batchNumber" placeholder="e.g. LOT-2026-A" />
        </Field>
        <Field>
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input id="expiryDate" name="expiryDate" type="date" />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input id="note" name="note" placeholder="Supplier, PO reference…" />
        </Field>
      </div>
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
        Record batch
      </Button>
    </form>
  );
}
