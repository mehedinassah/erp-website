"use client";

import { useActionState } from "react";
import { signupAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABEL, type BusinessType } from "@/lib/enums";

const initialState = { error: undefined as string | undefined, success: false };

export function SignupForm() {
  const [state, dispatch, pending] = useActionState(signupAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-md border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
        Account created! Redirecting to sign in…
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-4">
      {state.error && (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="businessName">Business name</Label>
        <Input
          id="businessName"
          name="businessName"
          placeholder="e.g. PERICO Clothing"
          autoComplete="organization"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessType">What do you sell?</Label>
        <Select id="businessType" name="businessType" defaultValue="" required>
          <option value="" disabled>Select your business type</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>{BUSINESS_TYPE_LABEL[t as BusinessType]}</option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          This sets up the right catalogue fields and starter categories. You can change it later.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Mehedi Hassan"
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min 8 characters"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" variant="gold" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
