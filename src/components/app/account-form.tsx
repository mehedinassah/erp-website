"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";
import type { LedgerType } from "@/lib/enums";

type Defaults = {
  shopName?: string;
  ownerName?: string | null;
  address?: string | null;
  phone?: string | null;
  category?: string | null;
  notes?: string | null;
  openingAmount?: number;
  dueDate?: string | null;
};

export function AccountForm({
  mode,
  type,
  action,
  defaults = {},
}: {
  mode: "create" | "edit";
  type: LedgerType;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  defaults?: Defaults;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};
  const isPaona = type === "PAONA";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="type" value={type} />

      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <Label htmlFor="shopName" required>
                Shop / business name
              </Label>
              <Input id="shopName" name="shopName" defaultValue={defaults.shopName} placeholder="M/S Rahman Traders" />
              <FieldError>{fe.shopName}</FieldError>
            </Field>
            <Field>
              <Label htmlFor="ownerName">Owner name</Label>
              <Input id="ownerName" name="ownerName" defaultValue={defaults.ownerName ?? ""} placeholder="Abdur Rahman" />
            </Field>
            <Field>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone ?? ""} placeholder="+8801…" />
            </Field>
            <Field>
              <Label htmlFor="category">Category tag</Label>
              <Input id="category" name="category" defaultValue={defaults.category ?? ""} placeholder="Wholesale / Retailer / Supplier" />
            </Field>
            <Field>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={defaults.address ?? ""} placeholder="Dhaka, Bangladesh" />
            </Field>
            <Field className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={defaults.notes ?? ""} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isPaona ? "Amount receivable" : "Amount payable"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="openingAmount">
                {mode === "create" ? "Opening amount (৳)" : "Opening amount (৳)"}
              </Label>
              <Input id="openingAmount" name="openingAmount" type="number" min={0} defaultValue={defaults.openingAmount ?? 0} className="tabular" />
            </Field>
            <Field>
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={defaults.dueDate ?? ""} />
            </Field>
            <p className="text-xs text-muted-foreground">
              {isPaona
                ? "The total this business currently owes you. Record collections later from their profile."
                : "The total you currently owe this business. Record your payments later from their profile."}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" variant="gold" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "create" ? "Create account" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
