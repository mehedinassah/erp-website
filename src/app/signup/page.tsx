import type { Metadata } from "next";
import Image from "next/image";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account · PERICO ERP",
};

export default function SignupPage() {
  return (
    <main className="relative flex min-h-dvh">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #a16207 0, transparent 45%), radial-gradient(circle at 80% 70%, #a16207 0, transparent 40%)",
          }}
        />
        <div className="relative">
          <div className="inline-block rounded-2xl bg-white px-6 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            <div className="relative h-14 w-56 overflow-hidden">
              <Image src="/perico.png" alt="PERICO" fill className="object-cover" style={{ objectPosition: "center 50%" }} priority />
            </div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">
            Enterprise Resource Planning (ERP) system
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Start your free trial.
          </h1>
          <p className="mt-4 text-primary-foreground/70">
            Full inventory management, sales, purchasing, and ledger — all in one place.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-primary-foreground/50">
          <span className="h-px w-8 bg-accent" />
          PERICO · Dhaka, Bangladesh
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <div className="relative h-12 w-44 overflow-hidden rounded-md">
              <Image src="/perico.png" alt="PERICO" fill className="object-cover dark:brightness-0 dark:invert" style={{ objectPosition: "center 50%" }} priority />
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Create your account
          </h2>
          <p className="mb-7 mt-1 text-sm text-muted-foreground">
            Set up your business workspace in seconds.
          </p>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
