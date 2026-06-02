import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ProductForm } from "@/components/app/product-form";
import { updateProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "MANAGER"]);
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
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
        defaults={{
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          gender: product.gender,
          material: product.material,
          season: product.season,
          description: product.description,
          costPrice: product.costPrice,
          sellPrice: product.sellPrice,
          status: product.status,
        }}
      />
    </div>
  );
}
