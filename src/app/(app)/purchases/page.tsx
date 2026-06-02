import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, canManage } from "@/lib/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { PO_STATUS_LABEL, type PurchaseOrderStatus } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await requireUser();
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { orderDate: "desc" },
    include: {
      supplier: true,
      warehouse: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Purchasing"
        title="Purchase orders"
        description="Raise orders to suppliers and receive stock into your warehouses."
      >
        {canManage(session.role) && (
          <Button asChild variant="gold">
            <Link href="/purchases/new">
              <Plus className="size-4" /> New purchase order
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="animate-rise overflow-hidden">
        {orders.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>PO number</TH>
                <TH>Supplier</TH>
                <TH>Date</TH>
                <TH className="text-center">Items</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {orders.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/purchases/${o.id}`} className="font-medium gold-underline">
                      {o.poNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{o.warehouse.code}</p>
                  </TD>
                  <TD className="text-muted-foreground">{o.supplier.name}</TD>
                  <TD className="text-muted-foreground">{formatDate(o.orderDate)}</TD>
                  <TD className="tabular text-center">{o._count.items}</TD>
                  <TD className="tabular text-right font-medium">{formatBDT(o.totalAmount)}</TD>
                  <TD className="text-right">
                    <Badge tone={statusTone(o.status)}>
                      {PO_STATUS_LABEL[o.status as PurchaseOrderStatus] ?? o.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Truck}
              title="No purchase orders"
              description="Create a purchase order to restock your catalogue."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
