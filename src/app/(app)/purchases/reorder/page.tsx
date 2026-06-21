import Link from "next/link";
import { ChevronLeft, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatVariant } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { ReorderList } from "@/components/app/reorder-list";

export const dynamic = "force-dynamic";

export default async function ReorderPage() {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const [variants, suppliers, warehouses] = await Promise.all([
    prisma.variant.findMany({
      where: { product: { tenantId, status: "ACTIVE" } },
      include: { product: true, stockLevels: true },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.supplier.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { tenantId }, orderBy: { isDefault: "desc" } }),
  ]);

  const suggestions = variants
    .map((v) => {
      const current = v.stockLevels.reduce((s, sl) => s + sl.quantity, 0);
      return {
        variantId: v.id,
        label: `${v.product.name}${formatVariant(v.size, v.color) ? " · " + formatVariant(v.size, v.color) : ""}`,
        sku: v.sku,
        current,
        threshold: v.lowStockThreshold,
        suggested: Math.max(1, v.lowStockThreshold * 2 - current),
        cost: v.product.costPrice,
      };
    })
    .filter((s) => s.current <= s.threshold)
    .sort((a, b) => a.current - b.current);

  return (
    <div>
      <Link href="/purchases" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Purchase orders
      </Link>
      <PageHeader
        eyebrow="Purchasing"
        title="Reorder suggestions"
        description="Items at or below their reorder point. Select what to buy and generate a purchase order in one click."
      />

      {suggestions.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            icon={PackageCheck}
            title="Nothing to reorder"
            description="Every product is above its reorder point. Great stock health!"
          />
        </Card>
      ) : suppliers.length === 0 || warehouses.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          You need at least one supplier and one warehouse to generate a purchase order.{" "}
          <Link href="/suppliers/new" className="text-accent hover:underline">Add a supplier</Link>.
        </Card>
      ) : (
        <ReorderList
          suggestions={suggestions}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
        />
      )}
    </div>
  );
}
