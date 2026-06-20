import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/lib/site";
import SiteFooter from "./site-footer";

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="relative h-9 w-36" aria-label={`${SITE.name} home`}>
            <Image src="/perico-light.png" alt={SITE.name} fill className="object-contain object-left dark:hidden" priority />
            <Image src="/perico-dark.png" alt={SITE.name} fill className="hidden object-contain object-left dark:block" priority />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        <div className="prose-legal mt-10 space-y-8">{children}</div>
      </section>

      <SiteFooter />
    </main>
  );
}
