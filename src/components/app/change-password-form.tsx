"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { changePassword } from "@/app/(app)/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changePassword, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Update the password you use to sign in to PERICO.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          {state.error && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {state.error}
            </div>
          )}
          {state.ok && (
            <div role="status" className="flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" /> Password updated successfully.
            </div>
          )}

          <Field>
            <Label htmlFor="currentPassword" required>Current password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
            <FieldError>{fe.currentPassword}</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="newPassword" required>New password</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" placeholder="Min 8 characters" />
              <FieldError>{fe.newPassword}</FieldError>
            </Field>
            <Field>
              <Label htmlFor="confirmPassword" required>Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
              <FieldError>{fe.confirmPassword}</FieldError>
            </Field>
          </div>

          <Button type="submit" variant="gold" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
