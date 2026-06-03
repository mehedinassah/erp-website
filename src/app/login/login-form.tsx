"use client";

import { useActionState, useState } from "react";
import { Loader2, LockKeyhole, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-rise"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Field>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@rong.com.bd"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field>
        <Label htmlFor="password" required>
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" /> Sign in
          </>
        )}
      </Button>

      <p className="hairline pt-4 text-center text-xs text-muted-foreground">
        Accounts are created by your administrator.
      </p>
    </form>
  );
}
