import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getTenantProfile } from "@/lib/tenant";
import { PageHeader } from "@/components/app/page-header";
import { ProductForm } from "@/components/app/product-form";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const [categories, biz] = await Promise.all([
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getTenantProfile(tenantId),
  ]);

  return (
    <div>
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Products
      </Link>
      <PageHeader
        eyebrow="Catalog"
        title="New product"
        description="Define the product, pricing, and generate its variants."
      />
      <ProductForm
        mode="create"
        action={createProduct}
        categories={categories}
        businessType={biz?.businessType ?? "CLOTHING"}
      />
    </div>
  );
}
