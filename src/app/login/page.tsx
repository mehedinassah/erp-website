import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · RONG Inventory",
};

export default function LoginPage() {
  return (
    <main className="grain relative flex min-h-dvh">
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
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-accent font-display text-lg font-bold text-accent-foreground">
              R
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              RONG
            </span>
          </div>
        </div>

        <div className="relative max-w-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">
            Inventory · Stock · Sales
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Every thread, every size, every sale — accounted for.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            The operations backbone for a modern Dhaka clothing label. Track
            variants, manage purchasing, and fulfil orders with confidence.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-primary-foreground/50">
          <span className="h-px w-8 bg-accent" />
          Dhaka, Bangladesh · ৳ BDT
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-md bg-accent font-display text-lg font-bold text-accent-foreground">
                R
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                RONG
              </span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mb-7 mt-1 text-sm text-muted-foreground">
            Sign in to the inventory console.
          </p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
