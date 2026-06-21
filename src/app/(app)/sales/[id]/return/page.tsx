import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReturnForm } from "./return-form";

export const dynamic = "force-dynamic";

export default async function SalesReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), params]);
  const { tenantId } = session;

  const order = await prisma.salesOrder.findFirst({
    where: { id, tenantId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order || order.status !== "FULFILLED") notFound();

  const items = order.items.map((i) => ({
    variantId: i.variantId,
    label: `${i.variant.product.name} · ${i.variant.size}/${i.variant.color}`,
    sku: i.variant.sku,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));

  return (
    <div className="max-w-3xl">
      <Link
        href={`/sales/${id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to {order.orderNumber}
      </Link>
      <PageHeader
        eyebrow="Sales"
        title="Process return"
        description={`Return items from order ${order.orderNumber}. Stock will be restored to the warehouse.`}
      />
      <Card>
        <CardContent className="pt-6">
          <ReturnForm salesOrderId={id} items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
