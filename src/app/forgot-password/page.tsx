import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password · PERICO ERP" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm animate-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="mb-7 mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
        <ForgotForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <a href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
            Back to sign in
          </a>
        </p>
      </div>
    </main>
  );
}
