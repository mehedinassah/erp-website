import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { OrderForm } from "@/components/app/order-form";
import { createPurchaseOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const [suppliers, warehouses, variants] = await Promise.all([
    prisma.supplier.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.variant.findMany({
      where: { product: { tenantId } },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
  ]);

  const variantOptions = variants.map((v) => ({
    id: v.id,
    product: v.product.name,
    detail: `${v.size} · ${v.color} — ${v.sku}`,
    price: v.product.costPrice,
  }));

  return (
    <div>
      <Link
        href="/purchases"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Purchase orders
      </Link>
      <PageHeader
        eyebrow="Purchasing"
        title="New purchase order"
        description="Order stock from a supplier. Receiving it later will update inventory automatically."
      />
      <OrderForm
        mode="purchase"
        action={createPurchaseOrder}
        parties={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        partyLabel="Supplier"
        variants={variantOptions}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
      />
    </div>
  );
}
