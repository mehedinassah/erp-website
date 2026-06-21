"use client";

import { useActionState, useEffect } from "react";
import { Loader2, AlertCircle, Banknote } from "lucide-react";
import { recordPayment } from "@/app/(app)/sales/[id]/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/validation";

export function RecordPaymentForm({
  orderId,
  outstanding,
}: {
  orderId: string;
  outstanding: number;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(recordPayment, {});
  const toast = useToast();

  useEffect(() => {
    if (state.ok) toast({ title: "Payment recorded", variant: "success" });
    else if (state.error) toast({ title: state.error, variant: "error" });
  }, [state, toast]);

  if (outstanding <= 0) return null;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}
      <div className="flex gap-2">
        <Field className="flex-1">
          <Label htmlFor="amount" required>Amount (৳)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            max={outstanding}
            defaultValue={outstanding}
            placeholder="Enter amount paid"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="gold" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
            Record payment
          </Button>
        </div>
      </div>
    </form>
  );
}
