"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { createExpense } from "@/app/(app)/expenses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, PAYMENT_METHODS, METHOD_LABEL, type ExpenseCategory, type PaymentMethod } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

export function ExpenseForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createExpense, {});
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast({ title: "Expense recorded", variant: "success" });
      formRef.current?.reset();
    } else if (state.error) {
      toast({ title: state.error, variant: "error" });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="category" required>Category</Label>
          <Select id="category" name="category" defaultValue="RENT">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c as ExpenseCategory]}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="amount" required>Amount (৳)</Label>
          <Input id="amount" name="amount" type="number" min={1} className="tabular" />
        </Field>
        <Field>
          <Label htmlFor="spentAt">Date</Label>
          <Input id="spentAt" name="spentAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field>
          <Label htmlFor="method">Paid via</Label>
          <Select id="method" name="method" defaultValue="CASH">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{METHOD_LABEL[m as PaymentMethod]}</option>
            ))}
          </Select>
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Input id="note" name="note" placeholder="e.g. June shop rent" />
        </Field>
      </div>
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Record expense
      </Button>
    </form>
  );
}
