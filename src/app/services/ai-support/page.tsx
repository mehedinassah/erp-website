import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Bot, Sparkles, ArrowRight, Check, FileText, MessageSquareText,
  Zap, Globe, ShieldCheck, Code2,
} from "lucide-react";
import SiteFooter from "@/components/marketing/site-footer";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "AI Customer Support — PERICO",
  description:
    "Add an AI chat widget to your website that answers customers from your own documents, 24/7. Included in PERICO Pro, or available standalone worldwide.",
};

const FEATURES = [
  { icon: FileText, title: "Trained on your docs", desc: "Upload your FAQs, policies, and product info. The assistant answers only from your content — no made-up answers." },
  { icon: MessageSquareText, title: "Embeddable chat widget", desc: "Paste one line of code on your site. A friendly chat bubble appears in the corner, ready to help visitors." },
  { icon: Zap, title: "Instant, streaming answers", desc: "Replies stream in real time, with the source documents behind every answer." },
  { icon: Globe, title: "Works on any website", desc: "Shopify, WordPress, custom — if you can paste a script tag, you can add the assistant." },
  { icon: ShieldCheck, title: "Your data stays yours", desc: "Each business is isolated. Your documents are only ever used to answer your customers." },
  { icon: Code2, title: "No-code setup", desc: "Manage everything from your dashboard. No developers required." },
];

const STEPS = [
  { title: "Upload your knowledge", desc: "Add FAQs, policies, and product info as text or PDF." },
  { title: "Copy the snippet", desc: "Grab your one-line embed code from the dashboard." },
  { title: "Go live", desc: "Paste it on your site. Customers start getting instant answers." },
];

function WidgetMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-white/15"><Bot className="size-4" /></span>
          <div>
            <p className="text-sm font-semibold leading-none">Acme Support</p>
            <p className="mt-0.5 text-[10px] opacity-80">AI assistant · Online</p>
          </div>
        </div>
        <span className="size-2 rounded-full bg-green-400" />
      </div>
      <div className="space-y-3 bg-surface/50 p-4">
        <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs">
          Hi! 👋 Ask me anything about our products, shipping, or returns.
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-xs text-accent-foreground">
          What&apos;s your return policy?
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs">
          We offer a 30-day money-back guarantee on all orders. Refunds are processed within 5 business days. 📦
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <div className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">Type your message…</div>
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground"><ArrowRight className="size-4" /></span>
      </div>
    </div>
  );
}

export default function AISupportMarketingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="relative h-9 w-36">
            <Image src="/perico-light.png" alt="PERICO" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/perico-dark.png" alt="PERICO" fill className="hidden object-contain object-left dark:block" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/#services" className="hidden rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block">All services</Link>
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute -right-20 -top-24 h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,92,246,0.18) 0%, transparent 70%)", filter: "blur(70px)" }} />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-rise text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" /> New service
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
              An AI support agent for your website
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
              Upload your FAQs and policies, and let an AI chat widget answer your customers 24/7 — in their own words, grounded in your documents.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="#pricing" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]">
                See pricing <ArrowRight className="size-4" />
              </Link>
              <Link href="/signup" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted">Start free trial</Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> No code</span>
              <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> Answers from your data</span>
              <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> Live in minutes</span>
            </div>
          </div>
          <div className="animate-rise [animation-delay:150ms]"><WidgetMock /></div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Why it&apos;s great</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to deflect support tickets</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
                <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent transition-transform group-hover:scale-110"><f.icon className="size-5" /></span>
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Live in three steps</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted/60">{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing — two ways to get it */}
      <section id="pricing" className="scroll-mt-20 border-y border-border bg-surface/50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pricing</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Two ways to get AI Support</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Already using PERICO? It&apos;s included in Pro. Just want the AI widget? Get it standalone.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Bundled with Pro */}
            <div className="relative flex flex-col rounded-xl border border-accent shadow-lg lg:scale-[1.02] bg-card p-7">
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                <Sparkles className="size-3 fill-current" /> Best value
              </span>
              <h3 className="font-display text-lg font-semibold">With PERICO {PLANS.PRO.name}</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-semibold">৳{PLANS.PRO.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Includes the full ERP <em>and</em> AI Support.</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {["AI Customer-Support widget", "Everything in the ERP", "Unlimited warehouses & users", "One simple bill"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-success" /> {f}</li>
                ))}
              </ul>
              <Link href="/signup" className="mt-6 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Start free trial
              </Link>
            </div>
            {/* Standalone */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-7">
              <h3 className="font-display text-lg font-semibold">Standalone</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-semibold">$19</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Just the AI widget — sold worldwide in USD.</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {["AI Customer-Support widget", "Upload docs & PDFs", "Usage-based plans", "No ERP required"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-success" /> {f}</li>
                ))}
              </ul>
              <Link href="/contact" className="mt-6 block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted">
                Get standalone access
              </Link>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Global checkout (USD) coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-accent-soft text-accent"><Bot className="size-6" /></span>
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Let AI handle the repetitive questions</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">Set it up in minutes and give your customers instant answers, day or night.</p>
        <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]">
          Start your free trial <ArrowRight className="size-4" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
