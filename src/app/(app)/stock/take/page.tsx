import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatVariant } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StockTakeForm } from "@/components/app/stock-take-form";

export const dynamic = "force-dynamic";

export default async function StockTakePage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), searchParams]);
  const { tenantId } = session;

  const warehouses = await prisma.warehouse.findMany({ where: { tenantId }, orderBy: { isDefault: "desc" } });
  const warehouseId = sp.warehouse || warehouses[0]?.id || "";

  let rows: { variantId: string; label: string; sku: string; system: number }[] = [];
  if (warehouseId) {
    const variants = await prisma.variant.findMany({
      where: { product: { tenantId, status: "ACTIVE" } },
      include: { product: true, stockLevels: { where: { warehouseId } } },
      orderBy: { product: { name: "asc" } },
    });
    rows = variants.map((v) => ({
      variantId: v.id,
      label: `${v.product.name}${formatVariant(v.size, v.color) ? " · " + formatVariant(v.size, v.color) : ""}`,
      sku: v.sku,
      system: v.stockLevels[0]?.quantity ?? 0,
    }));
  }

  return (
    <div>
      <Link href="/stock" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Stock control
      </Link>
      <PageHeader
        eyebrow="Inventory"
        title="Stock take"
        description="Count your physical stock and reconcile it with the system. Differences are logged as adjustments."
      />

      {/* Warehouse picker (GET form) */}
      <form className="mb-4 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Warehouse</label>
          <Select name="warehouse" defaultValue={warehouseId} className="w-56">
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">Load</Button>
      </form>

      {warehouseId ? (
        rows.length ? (
          <StockTakeForm warehouseId={warehouseId} rows={rows} />
        ) : (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No active products to count.</CardContent></Card>
        )
      ) : (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Add a warehouse first.</CardContent></Card>
      )}
    </div>
  );
}
