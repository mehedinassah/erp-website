"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { createUser } from "@/app/(app)/settings/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldError } from "@/components/ui/label";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

export function UserAddForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createUser,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}
      {state.ok && (
        <div className="flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> User created. Share the email &amp; password with them.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="name" required>Full name</Label>
          <Input id="name" name="name" placeholder="e.g. Rezaul Karim" />
          <FieldError>{fe.name}</FieldError>
        </Field>
        <Field>
          <Label htmlFor="email" required>Email (login)</Label>
          <Input id="email" name="email" type="email" placeholder="person@gmail.com" />
          <FieldError>{fe.email}</FieldError>
        </Field>
        <Field>
          <Label htmlFor="role" required>Role</Label>
          <Select id="role" name="role" defaultValue="STAFF">
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>
            ))}
          </Select>
          <FieldError>{fe.role}</FieldError>
        </Field>
        <Field>
          <Label htmlFor="password" required>Password</Label>
          <Input id="password" name="password" type="text" placeholder="At least 6 characters" />
          <FieldError>{fe.password}</FieldError>
        </Field>
      </div>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Create user
      </Button>
    </form>
  );
}
