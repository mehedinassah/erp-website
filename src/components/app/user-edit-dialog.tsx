"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { updateUser, deleteUser } from "@/app/(app)/settings/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldError } from "@/components/ui/label";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

type U = { id: string; name: string; email: string; role: string; active: boolean };

export function UserEditDialog({ user, isSelf }: { user: U; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateUser.bind(null, user.id),
    {},
  );
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer" aria-label="Edit user">
          <Pencil className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-scale-in">
          <Dialog.Title className="font-display text-lg font-semibold">Edit user</Dialog.Title>
          <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">{user.email}</Dialog.Description>

          <form action={action} className="mt-4 space-y-4">
            {state.error && (
              <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" /> {state.error}
              </div>
            )}

            <Field>
              <Label htmlFor={`name-${user.id}`} required>Full name</Label>
              <Input id={`name-${user.id}`} name="name" defaultValue={user.name} />
              <FieldError>{fe.name}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label htmlFor={`role-${user.id}`}>Role</Label>
                <Select id={`role-${user.id}`} name="role" defaultValue={user.role}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label htmlFor={`active-${user.id}`}>Status</Label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-sm">
                  <input id={`active-${user.id}`} type="checkbox" name="active" defaultChecked={user.active} className="accent-[var(--accent)]" />
                  Active
                </label>
              </Field>
            </div>

            <Field>
              <Label htmlFor={`pw-${user.id}`}>Reset password (optional)</Label>
              <Input id={`pw-${user.id}`} name="password" type="text" placeholder="Leave blank to keep current" />
              <FieldError>{fe.password}</FieldError>
            </Field>

            <div className="flex items-center justify-between gap-2 pt-1">
              {!isSelf ? (
                <DeleteUserButton id={user.id} onDone={() => setOpen(false)} />
              ) : (
                <span className="text-xs text-muted-foreground">This is you</span>
              )}
              <div className="flex gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button type="submit" variant="gold" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteUserButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return (
      <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirm(true)}>
        <Trash2 className="size-4" /> Delete
      </Button>
    );
  return (
    <form action={async () => { await deleteUser(id); onDone(); }}>
      <Button type="submit" variant="destructive">Confirm delete</Button>
    </form>
  );
}
