"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, type ForgotState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestPasswordReset, {});

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/25 bg-success/10 p-4 text-sm text-success">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4" /> Check your email
        </p>
        <p className="mt-1 text-success/90">
          If an account exists for that address, we&apos;ve sent a link to reset your password. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      )}
      <Field>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@business.com" autoFocus />
      </Field>
      <Button type="submit" variant="gold" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
