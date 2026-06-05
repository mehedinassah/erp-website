import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ScanLine, Boxes, Receipt, Wallet, BarChart3, Upload,
  ArrowRight, Check, ShieldCheck, Smartphone, Building2,
  TrendingUp, UserPlus, PackagePlus, Rocket, Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PERICO — Inventory, POS & হিসাব for your business",
  description:
    "PERICO is an all-in-one ERP for shops and wholesalers: inventory, barcode POS, sales, purchasing, and Dena-Paona ledger. Works on phone and computer.",
};

const FEATURES = [
  { icon: Boxes, title: "Inventory & stock", desc: "Track every product, variant and stock level across multiple warehouses in real time." },
  { icon: ScanLine, title: "Barcode POS", desc: "Sell fast with point-of-sale that scans barcodes by camera or scanner and updates stock instantly." },
  { icon: Wallet, title: "Dena–Paona ledger", desc: "Track who owes you (পাওনা) and who you owe (দেনা) with running balances and reminders." },
  { icon: Receipt, title: "Sales & purchasing", desc: "Raise purchase orders, record sales, and generate invoices — all linked to your stock." },
  { icon: BarChart3, title: "Profit reports", desc: "See real revenue, gross profit, margins, best sellers and inventory value at a glance." },
  { icon: Upload, title: "Bulk import", desc: "Bring your whole catalogue, customers and suppliers from Excel or CSV in seconds." },
];

const STEPS = [
  { icon: UserPlus, title: "Create your account", desc: "Sign up in 30 seconds and get your own private workspace." },
  { icon: PackagePlus, title: "Import your products", desc: "Upload your catalogue from Excel, or add products and stock." },
  { icon: Rocket, title: "Start selling", desc: "Scan, sell, track profit and manage দেনা-পাওনা from any device." },
];

const PLANS = [
  { name: "Starter", price: "1,500", features: ["1 warehouse", "2 users", "Inventory + POS", "Dena–Paona ledger"] },
  { name: "Business", price: "3,500", popular: true, features: ["3 warehouses", "5 users", "Everything in Starter", "Profit reports", "Bulk import"] },
  { name: "Pro", price: "6,000", features: ["Unlimited warehouses", "Unlimited users", "Everything in Business", "Priority support"] },
];

/* Faux dashboard preview rendered in pure markup — looks like the real app */
function ProductPreview() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-warning/50" />
        <span className="size-2.5 rounded-full bg-success/50" />
        <span className="ml-3 hidden rounded-md bg-muted px-3 py-1 text-[11px] text-muted-foreground sm:block">
          perico-erp.vercel.app/dashboard
        </span>
      </div>
      <div className="p-4">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Revenue", v: "৳9,50,000", t: "text-accent" },
            { l: "Gross profit", v: "৳3,20,000", t: "text-success" },
            { l: "Orders", v: "142", t: "text-foreground" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-border p-3">
              <p className="text-[10px] text-muted-foreground">{k.l}</p>
              <p className={`tabular mt-1 font-display text-sm font-semibold sm:text-base ${k.t}`}>{k.v}</p>
            </div>
          ))}
        </div>
        {/* chart */}
        <div className="mt-3 rounded-lg border border-border p-3">
          <p className="mb-2 text-[10px] text-muted-foreground">Sales trend · 30 days</p>
          <svg viewBox="0 0 320 90" className="h-20 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,70 L40,60 L80,64 L120,42 L160,48 L200,28 L240,34 L280,16 L320,22 L320,90 L0,90 Z" fill="url(#lp)" />
            <path d="M0,70 L40,60 L80,64 L120,42 L160,48 L200,28 L240,34 L280,16 L320,22" fill="none" stroke="var(--accent)" strokeWidth="2" />
          </svg>
        </div>
        {/* rows */}
        <div className="mt-3 space-y-2">
          {[
            { n: "Hand-Block Cotton Panjabi", s: "PNJ-001", p: "৳2,350" },
            { n: "Jamdani Handloom Saree", s: "SAR-014", p: "৳9,500" },
          ].map((r) => (
            <div key={r.s} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.n}</span>
                <span className="text-[10px] text-muted-foreground">{r.s}</span>
              </span>
              <span className="tabular font-medium">{r.p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="relative h-9 w-36">
            <Image src="/perico-light.png" alt="PERICO" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/perico-dark.png" alt="PERICO" fill className="hidden object-contain object-left dark:block" priority />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute -right-20 -top-24 h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(161,98,7,0.20) 0%, transparent 70%)", filter: "blur(70px)" }} />
          <div className="animate-float-slow absolute -left-24 top-40 h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,92,246,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          {/* Copy */}
          <div className="animate-rise text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" /> Built for Bangladeshi shops & wholesalers
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
              Run your whole shop from{" "}
              <span style={{ background: "linear-gradient(90deg,#c98d2e,#a16207)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>one app</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
              Inventory, barcode POS, sales, purchasing, and দেনা-পাওনা — all in one place. Works on your phone and computer. No installation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]">
                Start your free trial <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted">Sign in</Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> Free trial</span>
              <span className="flex items-center gap-1"><Smartphone className="size-3.5 text-success" /> Mobile & desktop</span>
              <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-success" /> Your data, private</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="animate-rise [animation-delay:150ms]">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4">
          {[
            { v: "All-in-one", l: "Replaces 4+ tools" },
            { v: "< 5 min", l: "To set up your shop" },
            { v: "Phone + PC", l: "Use anywhere" },
            { v: "Bengali ৳", l: "Built for local trade" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{s.v}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Features</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything your business needs</h2>
          <p className="mt-2 text-muted-foreground">One platform replaces your notebook, calculator, and spreadsheets.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
              <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent transition-transform group-hover:scale-110">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-border bg-card p-6">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted/60">{i + 1}</span>
                <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free. Pay monthly, cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${p.popular ? "border-accent shadow-lg lg:scale-[1.03]" : "border-border"}`}>
              {p.popular && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                  <Star className="size-3 fill-current" /> Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-semibold">৳{p.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-success" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${p.popular ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(161,98,7,0.16) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent mx-auto"><TrendingUp className="size-6" /></span>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Ready to organize your business?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Set up your shop in minutes. Import your products, add your team, and start selling today.
          </p>
          <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]">
            Start your free trial <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-1.5"><Building2 className="size-4" /> © {new Date().getFullYear()} PERICO · Dhaka, Bangladesh</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Start free</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
