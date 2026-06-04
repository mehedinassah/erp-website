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
            "linear-gradient(160deg, #0c0a08 0%, #161009 45%, #0a0907 100%)",
        }}
      >
        {/* ── Layered ambient glow ── */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top-right primary gold bloom */}
          <div
            className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(161,98,7,0.55) 0%, rgba(120,53,15,0.2) 45%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* Bottom-left warm ember */}
          <div
            className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(180,83,9,0.4) 0%, transparent 65%)",
              filter: "blur(90px)",
            }}
          />
          {/* Centre soft haze */}
          <div
            className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
              filter: "blur(120px)",
            }}
          />
        </div>

        {/* ── Light streaks / fine lines ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { top: "28%", opacity: 0.07, rotate: "-14deg", color: "rgba(251,191,36,0.9)" },
            { top: "42%", opacity: 0.05, rotate: "-14deg", color: "rgba(217,119,6,0.7)" },
            { top: "58%", opacity: 0.04, rotate: "-14deg", color: "rgba(161,98,7,0.6)" },
            { top: "72%", opacity: 0.03, rotate: "-14deg", color: "rgba(120,53,15,0.5)" },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute h-px w-[200%] -left-1/2"
              style={{
                top: s.top,
                opacity: s.opacity,
                transform: `rotate(${s.rotate})`,
                background: `linear-gradient(90deg, transparent 0%, ${s.color} 40%, ${s.color} 60%, transparent 100%)`,
              }}
            />
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="relative flex flex-1 flex-col justify-between p-14">

          {/* Logo — blended golden luminescence */}
          <div className="relative">
            {/* Warm glow behind logo */}
            <div
              className="absolute -inset-10 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at 35% 55%, rgba(161,98,7,0.35) 0%, transparent 65%)",
                filter: "blur(30px)",
              }}
            />
            {/* Logo image: sepia+screen turns white bg into warm glow,
                purple/blue icon becomes golden amber — no white box needed */}
            <div
              className="relative h-28 w-[340px] overflow-hidden"
              style={{ mixBlendMode: "screen" }}
            >
              <Image
                src="/perico.png"
                alt="PERICO"
                fill
                className="object-cover"
                style={{
                  objectPosition: "center 50%",
                  filter:
                    "sepia(1) saturate(3) hue-rotate(8deg) brightness(3.5) contrast(1.05)",
                }}
                priority
              />
            </div>
          </div>

          {/* Hero copy */}
          <div className="space-y-5">
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: "rgba(161,98,7,0.85)" }}
            >
              Enterprise Resource Planning System
            </p>
            <h1
              className="font-display text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-white"
            >
              Your one stop
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(90deg, #f5d082 0%, #c88b2a 60%, #a16207 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                solution
              </span>
              for Business.
            </h1>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Inventory, sales, purchasing, and ledger — unified in one premium platform.
            </p>
          </div>

          {/* Footer */}
          <div
            className="flex items-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <span
              className="h-px w-10"
              style={{ background: "rgba(161,98,7,0.7)" }}
            />
            PERICO · Dhaka, Bangladesh
          </div>
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm animate-rise">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <div className="relative h-12 w-48 overflow-hidden rounded-lg">
              <Image
                src="/perico.png"
                alt="PERICO"
                fill
                className="object-cover"
                style={{ objectPosition: "center 50%" }}
                priority
              />
            </div>
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
