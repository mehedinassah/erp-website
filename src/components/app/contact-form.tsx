"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";

type Defaults = {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export function ContactForm({
  action,
  defaults = {},
  withContact = false,
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  defaults?: Defaults;
  withContact?: boolean;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <Field>
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input id="name" name="name" defaultValue={defaults.name} />
            <FieldError>{fe.name}</FieldError>
          </Field>

          {withContact && (
            <Field>
              <Label htmlFor="contactName">Contact person</Label>
              <Input id="contactName" name="contactName" defaultValue={defaults.contactName ?? ""} />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone ?? ""} placeholder="+8801…" />
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} />
            </Field>
          </div>

          <Field>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={defaults.address ?? ""} />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="gold" className="flex-1" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
