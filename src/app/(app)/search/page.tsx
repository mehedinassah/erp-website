import Link from "next/link";
import { Search, Shirt, Users, Factory, Receipt, Truck, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ci = (q: string) => ({ contains: q, mode: "insensitive" as const });

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const q = (sp.q ?? "").trim();

  let groups: {
    key: string;
    label: string;
    icon: typeof Shirt;
    items: { id: string; href: string; title: string; sub?: string; right?: string }[];
  }[] = [];

  if (q.length >= 1) {
    const [products, customers, suppliers, sales, purchases, ledgers] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId, OR: [{ name: ci(q) }, { sku: ci(q) }] },
        include: { category: true },
        take: 8,
      }),
      prisma.customer.findMany({
        where: { tenantId, OR: [{ name: ci(q) }, { phone: ci(q) }, { email: ci(q) }] },
        take: 8,
      }),
      prisma.supplier.findMany({
        where: { tenantId, OR: [{ name: ci(q) }, { contactName: ci(q) }, { phone: ci(q) }] },
        take: 8,
      }),
      prisma.salesOrder.findMany({
        where: { tenantId, orderNumber: ci(q) },
        include: { customer: true },
        take: 8,
        orderBy: { orderDate: "desc" },
      }),
      prisma.purchaseOrder.findMany({
        where: { tenantId, poNumber: ci(q) },
        include: { supplier: true },
        take: 8,
        orderBy: { orderDate: "desc" },
      }),
      prisma.ledgerAccount.findMany({
        where: { tenantId, OR: [{ shopName: ci(q) }, { code: ci(q) }, { ownerName: ci(q) }, { phone: ci(q) }] },
        take: 8,
      }),
    ]);

    groups = [
      {
        key: "products",
        label: "Products",
        icon: Shirt,
        items: products.map((p) => ({
          id: p.id,
          href: `/products/${p.id}`,
          title: p.name,
          sub: `${p.sku} · ${p.category.name}`,
          right: formatBDT(p.sellPrice),
        })),
      },
      {
        key: "customers",
        label: "Customers",
        icon: Users,
        items: customers.map((c) => ({
          id: c.id,
          href: `/customers/${c.id}/edit`,
          title: c.name,
          sub: c.phone ?? c.email ?? undefined,
        })),
      },
      {
        key: "suppliers",
        label: "Suppliers",
        icon: Factory,
        items: suppliers.map((s) => ({
          id: s.id,
          href: `/suppliers/${s.id}/edit`,
          title: s.name,
          sub: s.contactName ?? s.phone ?? undefined,
        })),
      },
      {
        key: "sales",
        label: "Sales orders",
        icon: Receipt,
        items: sales.map((o) => ({
          id: o.id,
          href: `/sales/${o.id}`,
          title: o.orderNumber,
          sub: `${o.customer?.name ?? "Walk-in"} · ${formatDate(o.orderDate)}`,
          right: formatBDT(o.total),
        })),
      },
      {
        key: "purchases",
        label: "Purchase orders",
        icon: Truck,
        items: purchases.map((o) => ({
          id: o.id,
          href: `/purchases/${o.id}`,
          title: o.poNumber,
          sub: `${o.supplier.name} · ${formatDate(o.orderDate)}`,
          right: formatBDT(o.totalAmount),
        })),
      },
      {
        key: "ledger",
        label: "Dena–Paona accounts",
        icon: Wallet,
        items: ledgers.map((l) => ({
          id: l.id,
          href: `/ledger/${l.id}`,
          title: l.shopName,
          sub: `${l.code}${l.ownerName ? " · " + l.ownerName : ""}`,
        })),
      },
    ].filter((g) => g.items.length > 0);
  }

  const totalResults = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Search" title="Search" description="Find products, orders, customers, suppliers and ledger accounts." />

      <form action="/search" className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search anything…" className="pl-9" autoFocus />
        </div>
        <Button type="submit" variant="gold">Search</Button>
      </form>

      {q.length >= 1 ? (
        totalResults > 0 ? (
          <div className="space-y-6">
            {groups.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.key}>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Icon className="size-3.5" /> {g.label}
                  </p>
                  <Card className="divide-y divide-border overflow-hidden">
                    {g.items.map((it) => (
                      <Link
                        key={it.id}
                        href={it.href}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{it.title}</p>
                          {it.sub && <p className="truncate text-xs text-muted-foreground">{it.sub}</p>}
                        </div>
                        {it.right && <span className="tabular shrink-0 text-sm font-medium">{it.right}</span>}
                      </Link>
                    ))}
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-10 text-center">
            <Search className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-medium">No results for “{q}”</p>
            <p className="text-sm text-muted-foreground">Try a product name, SKU, order number, or customer.</p>
          </Card>
        )
      ) : (
        <Card className="p-10 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Type above to search across your workspace.</p>
        </Card>
      )}
    </div>
  );
}
