import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { OrderForm } from "@/components/app/order-form";
import { createSalesOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  await requireUser();

  const [customers, warehouses, variants] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
    prisma.variant.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
  ]);

  const variantOptions = variants.map((v) => ({
    id: v.id,
    product: v.product.name,
    detail: `${v.size} · ${v.color} — ${v.sku}`,
    price: v.product.sellPrice,
  }));

  return (
    <div>
      <Link
        href="/sales"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Sales orders
      </Link>
      <PageHeader
        eyebrow="Sales"
        title="New sale"
        description="Stock is checked and deducted from the chosen warehouse on completion."
      />
      <OrderForm
        mode="sales"
        action={createSalesOrder}
        parties={customers.map((c) => ({ id: c.id, name: c.name }))}
        partyLabel="Customer"
        partyOptional
        variants={variantOptions}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
      />
    </div>
  );
}
