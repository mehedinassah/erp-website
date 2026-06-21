"use client";

import { useActionState, useState } from "react";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { createQuotation } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";

type Customer = { id: string; name: string };
type Variant = { id: string; product: string; detail: string; sku: string; price: number };
type Line = { variantId: string; quantity: number; price: number };

export function NewQuoteForm({ customers, variants }: { customers: Customer[]; variants: Variant[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createQuotation, {});
  const [lines, setLines] = useState<Line[]>([{ variantId: "", quantity: 1, price: 0 }]);
  const [discount, setDiscount] = useState(0);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const total = Math.max(0, subtotal - discount);

  function addLine() {
    setLines((prev) => [...prev, { variantId: "", quantity: 1, price: 0 }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onVariantChange(i: number, variantId: string) {
    const v = variants.find((v) => v.id === variantId);
    setLine(i, { variantId, price: v?.price ?? 0 });
  }

  return (
    <form
      action={(fd) => {
        fd.set("items", JSON.stringify(lines));
        fd.set("discount", String(discount));
        action(fd);
      }}
      className="space-y-6"
    >
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field>
            <Label htmlFor="customerId">Customer</Label>
            <Select id="customerId" name="customerId">
              <option value="">— Walk-in / no customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" name="validUntil" type="date" />
          </Field>
          <Field className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Terms, delivery details, etc." />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {lines.map((line, i) => {
              return (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_36px] items-end gap-2">
                  <Field>
                    {i === 0 && <Label>Product</Label>}
                    <Select value={line.variantId} onChange={(e) => onVariantChange(i, e.target.value)} required>
                      <option value="">— Select —</option>
                      {variants.map((v) => <option key={v.id} value={v.id}>{v.product} · {v.detail}</option>)}
                    </Select>
                  </Field>
                  <Field>
                    {i === 0 && <Label>Qty</Label>}
                    <Input type="number" min={1} value={line.quantity} onChange={(e) => setLine(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                  </Field>
                  <Field>
                    {i === 0 && <Label>Unit price</Label>}
                    <Input type="number" min={0} value={line.price} onChange={(e) => setLine(i, { price: Math.max(0, parseInt(e.target.value) || 0) })} />
                  </Field>
                  <div className={i === 0 ? "pt-6" : ""}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addLine}>
            <Plus className="size-4" /> Add item
          </Button>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} className="w-28 text-right" />
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular text-accent">৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create quotation
      </Button>
    </form>
  );
}
