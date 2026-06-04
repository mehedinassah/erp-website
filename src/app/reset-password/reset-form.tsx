"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPassword, type ResetState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field, FieldError } from "@/components/ui/label";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/25 bg-success/10 p-4 text-sm text-success">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4" /> Password updated
        </p>
        <p className="mt-1 text-success/90">Your password has been changed. You can now sign in.</p>
        <a href="/login" className="mt-3 inline-block font-medium text-foreground underline underline-offset-4 hover:text-accent">
          Go to sign in →
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}
      <Field>
        <Label htmlFor="password" required>New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="Min 8 characters" autoFocus />
        <FieldError>{fe.password}</FieldError>
      </Field>
      <Field>
        <Label htmlFor="confirmPassword" required>Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
        <FieldError>{fe.confirmPassword}</FieldError>
      </Field>
      <Button type="submit" variant="gold" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Set new password
      </Button>
    </form>
  );
}
