import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · PERICO ERP",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh">

      {/* ── Cinematic brand panel ─────────────────────────────────────── */}
      <aside
        className="relative hidden w-[46%] flex-col overflow-hidden lg:flex"
        style={{
          background:
            "linear-gradient(155deg, #0d0b09 0%, #19110a 40%, #0b0905 100%)",
        }}
      >
        {/* Ambient glow layers */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(161,98,7,0.5) 0%, rgba(120,53,15,0.18) 45%, transparent 70%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute -bottom-20 -left-12 h-[400px] w-[400px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(180,83,9,0.35) 0%, transparent 65%)",
              filter: "blur(100px)",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",
              filter: "blur(130px)",
            }}
          />
        </div>

        {/* Light streaks */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { top: "25%", op: 0.07, c: "rgba(251,191,36,0.9)" },
            { top: "40%", op: 0.05, c: "rgba(217,119,6,0.8)" },
            { top: "57%", op: 0.04, c: "rgba(161,98,7,0.7)" },
            { top: "73%", op: 0.025, c: "rgba(120,53,15,0.6)" },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute h-px w-[220%] -left-[60%]"
              style={{
                top: s.top,
                opacity: s.op,
                transform: "rotate(-13deg)",
                background: `linear-gradient(90deg, transparent, ${s.c} 35%, ${s.c} 65%, transparent)`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col justify-between p-14">

          {/* Real PERICO logo — transparent bg, glows on the dark panel */}
          <div className="relative w-fit">
            <div
              className="absolute -inset-6 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse at 18% 50%, rgba(124,92,246,0.5) 0%, transparent 60%)",
                filter: "blur(22px)",
              }}
            />
            <Image
              src="/perico-logo.png"
              alt="PERICO"
              width={201}
              height={50}
              className="relative h-16 w-auto drop-shadow-[0_4px_20px_rgba(124,92,246,0.35)]"
              priority
            />
          </div>

          {/* Hero copy */}
          <div className="space-y-5">
            <p
              className="text-[0.62rem] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "rgba(161,98,7,0.85)" }}
            >
              Enterprise Resource Planning System
            </p>
            <h1
              className="font-display text-[2.6rem] font-semibold leading-[1.1] tracking-tight"
              style={{ color: "#f0ece4" }}
            >
              Your one stop
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(90deg,#f5d47a 0%,#c98d2e 55%,#a16207 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                solution
              </span>
              for Business.
            </h1>
            <p
              className="max-w-[260px] text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Inventory, sales, purchasing, and ledger — unified in one premium platform.
            </p>
          </div>

          {/* Footer */}
          <div
            className="flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            <span
              className="h-px w-10 shrink-0"
              style={{ background: "rgba(161,98,7,0.65)" }}
            />
            PERICO · Dhaka, Bangladesh
          </div>
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm animate-rise">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Image
              src="/perico-logo.png"
              alt="PERICO"
              width={201}
              height={50}
              className="h-11 w-auto"
              priority
            />
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mb-7 mt-1 text-sm text-muted-foreground">
            Sign in to your workspace.
          </p>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
            >
              Create account
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
