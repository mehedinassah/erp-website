"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { recordMovement } from "@/app/(app)/stock/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldHint } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";

type VariantOption = {
  id: string;
  product: string;
  detail: string;
};
type Warehouse = { id: string; name: string };

const TYPES = [
  { value: "PURCHASE_IN", label: "Stock in (received)" },
  { value: "SALE_OUT", label: "Stock out (sold / removed)" },
  { value: "ADJUSTMENT", label: "Adjustment (correction, +/−)" },
  { value: "TRANSFER_IN", label: "Transfer in" },
  { value: "TRANSFER_OUT", label: "Transfer out" },
];

export function MovementForm({
  variants,
  warehouses,
  defaultVariantId,
  defaultWarehouseId,
}: {
  variants: VariantOption[];
  warehouses: Warehouse[];
  defaultVariantId?: string;
  defaultWarehouseId?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(
    recordMovement,
    {},
  );

  // Group variants by product for optgroups
  const grouped = variants.reduce<Record<string, VariantOption[]>>((acc, v) => {
    (acc[v.product] ??= []).push(v);
    return acc;
  }, {});

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
          {state.error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <Field>
            <Label htmlFor="variantId" required>
              Variant
            </Label>
            <Select
              id="variantId"
              name="variantId"
              defaultValue={defaultVariantId ?? ""}
            >
              <option value="" disabled>
                Select a product variant
              </option>
              {Object.entries(grouped).map(([product, opts]) => (
                <optgroup key={product} label={product}>
                  {opts.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.detail}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="warehouseId" required>
                Warehouse
              </Label>
              <Select
                id="warehouseId"
                name="warehouseId"
                defaultValue={defaultWarehouseId ?? warehouses[0]?.id}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label htmlFor="type" required>
                Movement type
              </Label>
              <Select id="type" name="type" defaultValue="PURCHASE_IN">
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <Label htmlFor="quantity" required>
              Quantity
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step={1}
              defaultValue={1}
              className="tabular"
            />
            <FieldHint>
              For adjustments, use a negative number to reduce stock.
            </FieldHint>
          </Field>

          <Field>
            <Label htmlFor="reason">Reason / note</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={2}
              placeholder="e.g. New delivery from Tangail Weavers"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="gold" className="flex-1" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Record movement
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
