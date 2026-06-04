import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password · PERICO ERP" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm animate-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mb-7 mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            This reset link is missing its token. Please request a new link from the{" "}
            <a href="/forgot-password" className="underline underline-offset-2">forgot password</a> page.
          </div>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">Back to sign in</a>
        </p>
      </div>
    </main>
  );
}
