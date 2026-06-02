"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "./button";

function ConfirmSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
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
}: {
  action: () => Promise<void>;
  entity: string;
  name?: string;
  label?: string;
  confirmLabel?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <form action={action}>
              <ConfirmSubmit label={confirmLabel} />
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
