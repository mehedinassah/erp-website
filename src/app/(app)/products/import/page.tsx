import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ProductImporter } from "@/components/app/product-importer";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl">
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Products
      </Link>
      <PageHeader
        eyebrow="Catalog"
        title="Import products"
        description="Bring in your whole catalogue from Excel or CSV in one go — no manual entry."
      />
      <ProductImporter warehouses={warehouses} />
    </div>
  );
}
