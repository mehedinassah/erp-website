import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { PosTerminal } from "@/components/app/pos-terminal";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await requireUser();
  const { tenantId } = session;
  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId },
    orderBy: { isDefault: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Counter"
        title="Point of sale"
        description="Scan products with a barcode scanner or your camera, then complete the sale — stock updates instantly."
      />
      <PosTerminal warehouses={warehouses} />
    </div>
  );
}
