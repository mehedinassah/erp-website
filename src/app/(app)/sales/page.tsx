import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { SO_STATUS_LABEL, type SalesOrderStatus } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await requireUser();
  const orders = await prisma.salesOrder.findMany({
    orderBy: { orderDate: "desc" },
    take: 50,
    include: {
      customer: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Sales orders"
        description="Fulfilled sales automatically deduct stock and generate an invoice."
      >
        <Button asChild variant="gold">
          <Link href="/sales/new">
            <Plus className="size-4" /> New sale
          </Link>
        </Button>
      </PageHeader>

      <Card className="animate-rise overflow-hidden">
        {orders.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Order</TH>
                <TH>Customer</TH>
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
                    <Link href={`/sales/${o.id}`} className="font-medium gold-underline">
                      {o.orderNumber}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground">
                    {o.customer?.name ?? "Walk-in"}
                  </TD>
                  <TD className="text-muted-foreground">{formatDate(o.orderDate)}</TD>
                  <TD className="tabular text-center">{o._count.items}</TD>
                  <TD className="tabular text-right font-medium">{formatBDT(o.total)}</TD>
                  <TD className="text-right">
                    <Badge tone={statusTone(o.status)}>
                      {SO_STATUS_LABEL[o.status as SalesOrderStatus] ?? o.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Receipt}
              title="No sales yet"
              description="Record your first sale to see it here."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
