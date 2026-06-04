import type { Metadata } from "next";
import Image from "next/image";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account · PERICO ERP",
};

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
          {/* White stacked logo on dark panel */}
          <div className="relative w-fit">
            <div
              className="absolute -inset-8 opacity-40"
              style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.25) 0%, transparent 65%)", filter: "blur(24px)" }}
            />
            <Image
              src="/perico-dark.png"
              alt="PERICO"
              width={800}
              height={1058}
              className="relative h-32 w-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>
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
            <Image src="/perico-light.png" alt="PERICO" width={800} height={1027} className="h-20 w-auto dark:hidden" priority />
            <Image src="/perico-dark.png" alt="PERICO" width={800} height={1058} className="hidden h-20 w-auto dark:block" priority />
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
