import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { LabelSheet } from "@/components/app/label-sheet";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  await requireUser();

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sellPrice: true,
      variants: {
        orderBy: [{ size: "asc" }, { color: "asc" }],
        select: {
          id: true,
          sku: true,
          barcode: true,
          size: true,
          color: true,
          colorHex: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Catalog"
          title="Barcode labels"
          description="Generate scannable labels for your products, then print them onto sticker sheets to attach to garments."
        />
      </div>
      <LabelSheet products={products} />
    </div>
  );
}
