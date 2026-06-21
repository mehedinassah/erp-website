import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getTenantProfile } from "@/lib/tenant";
import { PageHeader } from "@/components/app/page-header";
import { ProductForm } from "@/components/app/product-form";
import { updateProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const { id } = await params;

  const [product, categories, biz] = await Promise.all([
    prisma.product.findFirst({ where: { id, tenantId } }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getTenantProfile(tenantId),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div>
      <Link
        href={`/products/${product.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {product.name}
      </Link>
      <PageHeader eyebrow="Catalog" title="Edit product" />
      <ProductForm
        mode="edit"
        action={action}
        categories={categories}
        businessType={biz?.businessType ?? "CLOTHING"}
        defaults={{
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          gender: product.gender,
          material: product.material,
          season: product.season,
          brand: product.brand,
          unit: product.unit,
          description: product.description,
          imageUrl: product.imageUrl,
          costPrice: product.costPrice,
          sellPrice: product.sellPrice,
          targetStock: product.targetStock,
          trackExpiry: product.trackExpiry,
          status: product.status,
        }}
      />
    </div>
  );
}
