import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TransferForm } from "./transfer-form";

export const dynamic = "force-dynamic";

export default async function StockTransferPage() {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const [variants, warehouses] = await Promise.all([
    prisma.variant.findMany({
      where: { product: { tenantId } },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.warehouse.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  if (warehouses.length < 2) {
    return (
      <div className="max-w-2xl">
        <Link href="/stock" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Stock control
        </Link>
        <PageHeader eyebrow="Inventory" title="Transfer stock" description="Move stock between warehouses." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You need at least two warehouses to transfer stock.{" "}
            <Link href="/warehouses/new" className="text-accent hover:underline">Add a warehouse</Link> first.
          </CardContent>
        </Card>
      </div>
    );
  }

  const variantOptions = variants.map((v) => ({
    id: v.id,
    product: v.product.name,
    detail: `${v.size} · ${v.color} — ${v.sku}`,
  }));

  return (
    <div className="max-w-2xl">
      <Link href="/stock" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Stock control
      </Link>
      <PageHeader
        eyebrow="Inventory"
        title="Transfer stock"
        description="Move a variant from one warehouse to another. Stock levels update instantly."
      />
      <Card>
        <CardContent className="pt-6">
          <TransferForm
            warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
            variants={variantOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
