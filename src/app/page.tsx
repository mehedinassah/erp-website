import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ScanLine, Boxes, Receipt, Wallet, BarChart3, Upload,
  ArrowRight, Check, ShieldCheck, Smartphone, Building2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PERICO — Inventory, POS & হিসাব for your business",
  description:
    "PERICO is an all-in-one ERP for shops and wholesalers: inventory, barcode POS, sales, purchasing, and Dena-Paona ledger. Works on phone and computer.",
};

const FEATURES = [
  { icon: Boxes, title: "Inventory & stock", desc: "Track every product, variant and stock level across multiple warehouses in real time." },
  { icon: ScanLine, title: "Barcode POS", desc: "Sell fast with a point-of-sale that scans barcodes by camera or scanner and updates stock instantly." },
  { icon: Wallet, title: "Dena–Paona ledger", desc: "Track who owes you (পাওনা) and who you owe (দেনা) with running balances and reminders." },
  { icon: Receipt, title: "Sales & purchasing", desc: "Raise purchase orders, record sales, and generate invoices — all linked to your stock." },
  { icon: BarChart3, title: "Profit reports", desc: "See real revenue, gross profit, margins, best sellers and inventory value at a glance." },
  { icon: Upload, title: "Bulk import", desc: "Bring your whole catalogue, customers and suppliers from Excel or CSV in seconds." },
];

const PLANS = [
  { name: "Starter", price: "1,500", features: ["1 warehouse", "2 users", "Inventory + POS", "Dena–Paona ledger"] },
  { name: "Business", price: "3,500", popular: true, features: ["3 warehouses", "5 users", "Everything in Starter", "Profit reports", "Bulk import"] },
  { name: "Pro", price: "6,000", features: ["Unlimited warehouses", "Unlimited users", "Everything in Business", "Priority support"] },
];

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
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full" style={{ background: "radial-gradient(circle, rgba(161,98,7,0.18) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" /> Built for Bangladeshi shops & wholesalers
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Run your whole shop from{" "}
            <span style={{ background: "linear-gradient(90deg,#c98d2e,#a16207)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>one app</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Inventory, barcode POS, sales, purchasing, and দেনা-পাওনা — all in one place.
            Works on your phone and computer. No installation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]">
              Start your free trial <ArrowRight className="size-4" />
            </Link>
            <Link href="/login" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
              Sign in
            </Link>
          </div>
          <p className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> Free trial</span>
            <span className="flex items-center gap-1"><Smartphone className="size-3.5 text-success" /> Mobile & desktop</span>
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-success" /> Your data, private</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Everything your business needs</h2>
          <p className="mt-2 text-muted-foreground">One platform replaces your notebook, calculator, and spreadsheets.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-border bg-surface/50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="mt-2 text-muted-foreground">Start free. Pay monthly, cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative rounded-xl border bg-card p-6 ${p.popular ? "border-accent shadow-lg" : "border-border"}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                    Most popular
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <Building2 className="mx-auto size-10 text-accent" />
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">Ready to organize your business?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Set up your shop in minutes. Import your products, add your team, and start selling today.
        </p>
        <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]">
          Start your free trial <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} PERICO · Dhaka, Bangladesh</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Start free</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
