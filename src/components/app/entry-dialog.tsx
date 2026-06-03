"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { addEntry, updateEntry, deleteEntry } from "@/app/(app)/ledger/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field } from "@/components/ui/label";
import { PAYMENT_METHODS, METHOD_LABEL, type LedgerType } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

type Entry = {
  id: string;
  kind: string;
  amount: number;
  method: string | null;
  note: string | null;
  occurredAt: string; // yyyy-mm-dd
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function EntryDialog({
  mode,
  ledgerType,
  ledgerId,
  entry,
  canDelete = false,
}: {
  mode: "add" | "edit";
  ledgerType: LedgerType;
  ledgerId?: string;
  entry?: Entry;
  canDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const payLabel = ledgerType === "PAONA" ? "Collection received" : "Payment made";

  const action =
    mode === "add"
      ? addEntry.bind(null, ledgerId!)
      : updateEntry.bind(null, entry!.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );
  const [kind, setKind] = useState(entry?.kind ?? "PAYMENT");

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {mode === "add" ? (
          <Button variant="gold">
            <Plus className="size-4" /> Add transaction
          </Button>
        ) : (
          <button
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Edit transaction"
          >
            <Pencil className="size-4" />
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-scale-in">
          <Dialog.Title className="font-display text-lg font-semibold">
            {mode === "add" ? "New transaction" : "Edit transaction"}
          </Dialog.Title>
          <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
            {mode === "add"
              ? "Record a payment or add more due to this account."
              : "Update the amount, method, note or date."}
          </Dialog.Description>

          <form action={formAction} className="mt-4 space-y-4">
            {state.error && (
              <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {state.error}
              </div>
            )}

            {mode === "add" && (
              <Field>
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="PAYMENT">{payLabel}</option>
                  <option value="CHARGE">Add more due</option>
                </Select>
              </Field>
            )}
            {mode === "edit" && <input type="hidden" name="kind" value={entry!.kind} />}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label htmlFor="amount" required>
                  Amount (৳)
                </Label>
                <Input id="amount" name="amount" type="number" min={1} defaultValue={entry?.amount ?? ""} className="tabular" autoFocus />
              </Field>
              <Field>
                <Label htmlFor="occurredAt">Date</Label>
                <Input id="occurredAt" name="occurredAt" type="date" defaultValue={entry?.occurredAt ?? today()} />
              </Field>
            </div>

            {kind === "PAYMENT" && (
              <Field>
                <Label htmlFor="method">Method</Label>
                <Select id="method" name="method" defaultValue={entry?.method ?? "CASH"}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field>
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" name="note" rows={2} defaultValue={entry?.note ?? ""} placeholder="e.g. Cheque no. 0012, bKash, advance…" />
            </Field>

            <div className="flex items-center justify-between gap-2 pt-1">
              {mode === "edit" && canDelete ? (
                <DeleteEntryButton id={entry!.id} onDone={() => setOpen(false)} />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" variant="gold" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {mode === "add" ? "Save" : "Update"}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteEntryButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="size-4" /> Delete
      </Button>
    );
  }
  return (
    <form action={async () => { await deleteEntry(id); onDone(); }}>
      <Button type="submit" variant="destructive">
        Confirm delete
      </Button>
    </form>
  );
}
