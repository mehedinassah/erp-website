import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · PERICO ERP",
};

/** Exact SVG recreation of the PERICO icon — transparent bg, no white bleed */
function PericoMark({
  iconSize = 72,
  textSize = "3rem",
  sub = true,
}: {
  iconSize?: number;
  textSize?: string;
  sub?: boolean;
}) {
  return (
    <div className="flex items-center gap-5">
      {/* Icon */}
      <div className="relative shrink-0">
        {/* Purple glow behind icon */}
        <div
          className="absolute -inset-4 rounded-3xl opacity-50"
          style={{
            background: "radial-gradient(circle, rgba(160,86,227,0.6) 0%, rgba(74,144,222,0.2) 55%, transparent 75%)",
            filter: "blur(18px)",
          }}
        />
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          className="relative drop-shadow-lg"
        >
          {/* Rounded square: purple → blue gradient (matches original exactly) */}
          <rect width="64" height="64" rx="15" fill="url(#pericoGrad)" />
          {/* Three diagonal circuit lines — bottom-left to top-right */}
          <line x1="11" y1="50" x2="26" y2="23" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.95" />
          <line x1="20" y1="52" x2="35" y2="25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.95" />
          <line x1="29" y1="54" x2="44" y2="27" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.95" />
          {/* Dots at top endpoints only */}
          <circle cx="26" cy="21" r="3.8" fill="white" />
          <circle cx="35" cy="23" r="3.8" fill="white" />
          <circle cx="44" cy="25" r="3.8" fill="white" />
          <defs>
            <linearGradient id="pericoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A056E3" />
              <stop offset="100%" stopColor="#4A90DE" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark */}
      <div>
        <div
          className="font-display font-bold leading-none tracking-[0.05em]"
          style={{ fontSize: textSize, color: "#f0ece4" }}
        >
          PERICO
        </div>
        {sub && (
          <div
            className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.38em]"
            style={{ color: "rgba(161,98,7,0.85)" }}
          >
            ERP Platform
          </div>
        )}
      </div>
    </div>
  );
}

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

          {/* Brand mark */}
          <PericoMark iconSize={72} textSize="2.9rem" sub />

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
            <div className="relative h-11 w-48 overflow-hidden rounded-lg">
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
