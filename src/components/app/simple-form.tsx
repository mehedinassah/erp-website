"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Field, FieldError, FieldHint } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ActionState } from "@/lib/validation";

export type SimpleField = {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "textarea";
  placeholder?: string;
  hint?: string;
  defaultValue?: string | null;
};

/** Reusable card form for simple entities (categories, warehouses, …). */
export function SimpleForm({
  action,
  fields,
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  fields: SimpleField[];
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
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

          {fields.map((f) => (
            <Field key={f.name}>
              <Label htmlFor={f.name} required={f.required}>
                {f.label}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  name={f.name}
                  rows={2}
                  placeholder={f.placeholder}
                  defaultValue={f.defaultValue ?? ""}
                />
              ) : (
                <Input
                  id={f.name}
                  name={f.name}
                  placeholder={f.placeholder}
                  defaultValue={f.defaultValue ?? ""}
                />
              )}
              {f.hint && <FieldHint>{f.hint}</FieldHint>}
              <FieldError>{fe[f.name]}</FieldError>
            </Field>
          ))}

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
