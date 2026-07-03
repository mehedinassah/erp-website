"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

function ConfirmSubmit({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending || disabled}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function DeleteButton({
  action,
  entity,
  name,
  label = "Delete",
  confirmLabel = "Delete",
  description,
  confirmPhrase,
}: {
  action: () => Promise<void>;
  entity: string;
  name?: string;
  label?: string;
  confirmLabel?: string;
  description?: string;
  /** If set, the confirm button stays disabled until the user types this phrase. */
  confirmPhrase?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const locked = confirmPhrase
    ? typed.trim().toUpperCase() !== confirmPhrase.toUpperCase()
    : false;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTyped("");
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" /> {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-scale-in">
          <Dialog.Title className="font-display text-lg font-semibold">
            Delete {entity}?
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
            {name && (
              <>
                This permanently removes{" "}
                <span className="font-medium text-foreground">{name}</span>.{" "}
              </>
            )}
            {description ?? "This action cannot be undone."}
          </Dialog.Description>
          {confirmPhrase && (
            <div className="mt-4">
              <label htmlFor="confirm-phrase" className="text-xs text-muted-foreground">
                Type <span className="font-semibold text-foreground">{confirmPhrase}</span> to confirm
              </label>
              <Input
                id="confirm-phrase"
                autoFocus
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmPhrase}
                className="mt-1"
              />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <form action={action}>
              <ConfirmSubmit label={confirmLabel} disabled={locked} />
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
