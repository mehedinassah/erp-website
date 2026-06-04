"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createTenant } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldError, FieldHint } from "@/components/ui/label";
import type { ActionState } from "@/lib/validation";

const PLANS = ["TRIAL", "STARTER", "BUSINESS", "PRO"];

export function CreateBusinessDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createTenant, {});
  const fe = state.fieldErrors ?? {};
  const router = useRouter();

  // On success, refresh the list and close shortly after showing confirmation.
  useEffect(() => {
    if (state.ok) {
      router.refresh();
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state.ok, router]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="gold">
          <Plus className="size-4" /> Create business
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-scale-in">
          <Dialog.Title className="font-display text-lg font-semibold">
            Create a business
          </Dialog.Title>
          <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
            Sets up an isolated workspace and an admin login. Share these
            credentials with the business owner.
          </Dialog.Description>

          {state.ok ? (
            <div className="mt-6 flex flex-col items-center py-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </span>
              <p className="mt-3 font-medium">Business created</p>
              <p className="text-sm text-muted-foreground">
                The admin can now sign in with the email and password you set.
              </p>
            </div>
          ) : (
            <form action={action} className="mt-4 space-y-4">
              {state.error && (
                <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" /> {state.error}
                </div>
              )}

              <Field>
                <Label htmlFor="businessName" required>Business name</Label>
                <Input id="businessName" name="businessName" placeholder="e.g. Yellow Clothing" />
                <FieldError>{fe.businessName}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="name" required>Admin&apos;s full name</Label>
                <Input id="name" name="name" placeholder="The owner / main user" />
                <FieldError>{fe.name}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="email" required>Admin email (their login)</Label>
                <Input id="email" name="email" type="email" placeholder="owner@business.com" />
                <FieldError>{fe.email}</FieldError>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label htmlFor="password" required>Password</Label>
                  <Input id="password" name="password" type="text" placeholder="Min 8 characters" />
                  <FieldError>{fe.password}</FieldError>
                </Field>
                <Field>
                  <Label htmlFor="plan">Plan</Label>
                  <Select id="plan" name="plan" defaultValue="TRIAL">
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <FieldHint>You&apos;ll share this email + password with the business owner.</FieldHint>

              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button type="submit" variant="gold" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Create business
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
