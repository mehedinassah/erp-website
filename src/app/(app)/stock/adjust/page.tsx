import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { MovementForm } from "@/components/app/movement-form";

export const dynamic = "force-dynamic";

export default async function AdjustStockPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; warehouse?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const [variants, warehouses] = await Promise.all([
    prisma.variant.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);

  const variantOptions = variants.map((v) => ({
    id: v.id,
    product: v.product.name,
    detail: `${v.size} · ${v.color} — ${v.sku}`,
  }));

  return (
    <div>
      <Link
        href="/stock"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Stock control
      </Link>
      <PageHeader
        eyebrow="Inventory"
        title="Record stock movement"
        description="Log a receipt, sale, transfer, or correction. Stock levels update instantly."
      />
      <MovementForm
        variants={variantOptions}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
        defaultVariantId={sp.variant}
        defaultWarehouseId={sp.warehouse}
      />
    </div>
  );
}
