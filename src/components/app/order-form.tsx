"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBDT } from "@/lib/format";
import type { ActionState } from "@/lib/validation";

export type VariantOpt = {
  id: string;
  product: string;
  detail: string;
  price: number;
};
type Party = { id: string; name: string };
type Warehouse = { id: string; name: string };
type Row = { key: number; variantId: string; quantity: number; price: number };

export function OrderForm({
  mode,
  action,
  parties,
  partyLabel,
  partyOptional = false,
  variants,
  warehouses,
}: {
  mode: "purchase" | "sales";
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  parties: Party[];
  partyLabel: string;
  partyOptional?: boolean;
  variants: VariantOpt[];
  warehouses: Warehouse[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  const [rows, setRows] = useState<Row[]>([
    { key: 1, variantId: "", quantity: 1, price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);

  const variantMap = useMemo(
    () => new Map(variants.map((v) => [v.id, v])),
    [variants],
  );
  const grouped = useMemo(() => {
    return variants.reduce<Record<string, VariantOpt[]>>((acc, v) => {
      (acc[v.product] ??= []).push(v);
      return acc;
    }, {});
  }, [variants]);

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.price, 0);
  const total = mode === "sales" ? Math.max(0, subtotal - discount) : subtotal;

  const payload = rows
    .filter((r) => r.variantId && r.quantity > 0)
    .map((r) => ({ variantId: r.variantId, quantity: r.quantity, price: r.price }));

  function update(key: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }
  function setVariant(key: number, variantId: string) {
    const v = variantMap.get(variantId);
    update(key, { variantId, price: v ? v.price : 0 });
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: (prev.at(-1)?.key ?? 0) + 1, variantId: "", quantity: 1, price: 0 },
    ]);
  }
  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  const priceLabel = mode === "purchase" ? "Unit cost" : "Unit price";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="items" value={JSON.stringify(payload)} />

      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r) => {
              const lineTotal = r.quantity * r.price;
              return (
                <div
                  key={r.key}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border border-border/70 p-2 sm:border-0 sm:p-0"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <Label className="sm:hidden">Variant</Label>
                    <Select
                      value={r.variantId}
                      onChange={(e) => setVariant(r.key, e.target.value)}
                    >
                      <option value="" disabled>
                        Select variant
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
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Label className="sm:hidden">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={r.quantity}
                      onChange={(e) =>
                        update(r.key, { quantity: Math.max(1, Number(e.target.value)) })
                      }
                      className="tabular"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <Label className="sm:hidden">{priceLabel}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={r.price}
                      onChange={(e) =>
                        update(r.key, { price: Math.max(0, Number(e.target.value)) })
                      }
                      className="tabular"
                    />
                  </div>
                  <div className="col-span-3 hidden text-right text-sm sm:col-span-1 sm:block">
                    <span className="tabular text-muted-foreground">
                      {formatBDT(lineTotal)}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(r.key)}
                      aria-label="Remove line"
                      className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-4" /> Add line
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="partyId" required={!partyOptional}>
                {partyLabel}
              </Label>
              <Select id="partyId" name="partyId" defaultValue="">
                <option value="">
                  {partyOptional ? "Walk-in / none" : `Select ${partyLabel.toLowerCase()}`}
                </option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label htmlFor="warehouseId" required>
                Warehouse
              </Label>
              <Select id="warehouseId" name="warehouseId" defaultValue={warehouses[0]?.id}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>

            {mode === "purchase" && (
              <Field>
                <Label htmlFor="expectedDate">Expected date</Label>
                <Input id="expectedDate" name="expectedDate" type="date" />
              </Field>
            )}

            {mode === "sales" && (
              <Field>
                <Label htmlFor="discount">Discount (৳)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="tabular"
                />
              </Field>
            )}

            <Field>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular">{formatBDT(subtotal)}</span>
            </div>
            {mode === "sales" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular text-destructive">
                  −{formatBDT(discount)}
                </span>
              </div>
            )}
            <div className="hairline flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular text-accent">{formatBDT(total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" variant="gold" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "purchase" ? "Create purchase order" : "Create sale"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
