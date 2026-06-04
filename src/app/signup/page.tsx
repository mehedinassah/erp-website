import type { Metadata } from "next";
import Image from "next/image";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account · PERICO ERP",
};

function PericoMark({ iconSize = 64, textSize = "3rem", sub = true }: {
  iconSize?: number; textSize?: string; sub?: boolean;
}) {
  const r = Math.round(iconSize * 0.23);
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="absolute -inset-3 rounded-2xl opacity-70"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.55) 0%, transparent 70%)", filter: "blur(14px)" }} />
        <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className="relative">
          <rect width="64" height="64" rx={r} fill="url(#pg2)" />
          <line x1="13" y1="44" x2="24" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.95" />
          <line x1="24" y1="44" x2="35" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.95" />
          <line x1="35" y1="44" x2="46" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.95" />
          <circle cx="13" cy="44" r="3.5" fill="white" />
          <circle cx="24" cy="20" r="3.5" fill="white" />
          <circle cx="24" cy="44" r="3.5" fill="white" />
          <circle cx="35" cy="20" r="3.5" fill="white" />
          <circle cx="35" cy="44" r="3.5" fill="white" />
          <circle cx="46" cy="20" r="3.5" fill="white" />
          <defs>
            <linearGradient id="pg2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="55%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <div className="font-display font-bold leading-none tracking-[0.06em]"
          style={{ fontSize: textSize, color: "#f0ece4" }}>
          PERICO
        </div>
        {sub && (
          <div className="mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.35em]"
            style={{ color: "rgba(161,98,7,0.8)" }}>
            ERP Platform
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-dvh">
      <aside
        className="relative hidden w-[46%] flex-col overflow-hidden lg:flex"
        style={{ background: "linear-gradient(155deg, #0d0b09 0%, #19110a 40%, #0b0905 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(161,98,7,0.5) 0%, rgba(120,53,15,0.18) 45%, transparent 70%)", filter: "blur(90px)" }} />
          <div className="absolute -bottom-20 -left-12 h-[400px] w-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(180,83,9,0.35) 0%, transparent 65%)", filter: "blur(100px)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[{ top: "25%", op: 0.07, c: "rgba(251,191,36,0.9)" }, { top: "42%", op: 0.05, c: "rgba(217,119,6,0.8)" }, { top: "60%", op: 0.04, c: "rgba(161,98,7,0.7)" }].map((s, i) => (
            <div key={i} className="absolute h-px w-[220%] -left-[60%]"
              style={{ top: s.top, opacity: s.op, transform: "rotate(-13deg)", background: `linear-gradient(90deg, transparent, ${s.c} 35%, ${s.c} 65%, transparent)` }} />
          ))}
        </div>
        <div className="relative flex flex-1 flex-col justify-between p-14">
          <PericoMark iconSize={72} textSize="2.9rem" sub />
          <div className="space-y-5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "rgba(161,98,7,0.85)" }}>
              Enterprise Resource Planning System
            </p>
            <h1 className="font-display text-[2.6rem] font-semibold leading-[1.1] tracking-tight"
              style={{ color: "#f0ece4" }}>
              Start your
              <span className="block" style={{ background: "linear-gradient(90deg,#f5d47a 0%,#c98d2e 55%,#a16207 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                free trial.
              </span>
            </h1>
            <p className="max-w-[260px] text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.38)" }}>
              Full inventory, sales, purchasing, and ledger — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.22)" }}>
            <span className="h-px w-10 shrink-0" style={{ background: "rgba(161,98,7,0.65)" }} />
            PERICO · Dhaka, Bangladesh
          </div>
        </div>
      </aside>

      <section className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <div className="relative h-11 w-48 overflow-hidden rounded-lg">
              <Image src="/perico.png" alt="PERICO" fill className="object-cover" style={{ objectPosition: "center 50%" }} priority />
            </div>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="mb-7 mt-1 text-sm text-muted-foreground">Set up your business workspace in seconds.</p>
          <SignupForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">Sign in</a>
          </p>
        </div>
      </section>
    </main>
  );
}
