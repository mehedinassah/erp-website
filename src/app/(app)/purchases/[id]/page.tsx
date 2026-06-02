import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PackageCheck, Ban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, canManage } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { formatBDT, formatDate } from "@/lib/format";
import { PO_STATUS_LABEL, type PurchaseOrderStatus } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  receivePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireUser(), params]);

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!po) notFound();

  const manage = canManage(session.role);
  const open = po.status !== "RECEIVED" && po.status !== "CANCELLED";

  return (
    <div>
      <Link
        href="/purchases"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Purchase orders
      </Link>

      <PageHeader
        eyebrow="Purchase order"
        title={po.poNumber}
        description={`${po.supplier.name} → ${po.warehouse.name}`}
      >
        <Badge tone={statusTone(po.status)}>
          {PO_STATUS_LABEL[po.status as PurchaseOrderStatus] ?? po.status}
        </Badge>
        {manage && open && (
          <>
            <form
              action={async () => {
                "use server";
                await cancelPurchaseOrder(po.id);
              }}
            >
              <Button type="submit" variant="outline">
                <Ban className="size-4" /> Cancel
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await receivePurchaseOrder(po.id);
              }}
            >
              <Button type="submit" variant="gold">
                <PackageCheck className="size-4" /> Receive stock
              </Button>
            </form>
          </>
        )}
        {canDelete(session.role) && (
          <DeleteButton
            entity="purchase order"
            name={po.poNumber}
            description="Any stock already received from this order will be reversed."
            action={async () => {
              "use server";
              await deletePurchaseOrder(po.id);
            }}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="pl-6">Variant</TH>
                  <TH className="text-right">Ordered</TH>
                  <TH className="text-right">Received</TH>
                  <TH className="text-right">Unit cost</TH>
                  <TH className="pr-6 text-right">Line total</TH>
                </TR>
              </THead>
              <TBody>
                {po.items.map((it) => (
                  <TR key={it.id}>
                    <TD className="pl-6">
                      <p className="font-medium">{it.variant.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.variant.size} · {it.variant.color} · {it.variant.sku}
                      </p>
                    </TD>
                    <TD className="tabular text-right">{it.quantity}</TD>
                    <TD className="tabular text-right">
                      <span
                        className={
                          it.receivedQty >= it.quantity
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        {it.receivedQty}
                      </span>
                    </TD>
                    <TD className="tabular text-right">{formatBDT(it.unitCost)}</TD>
                    <TD className="tabular pr-6 text-right font-medium">
                      {formatBDT(it.unitCost * it.quantity)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Supplier", po.supplier.name],
                ["Warehouse", po.warehouse.name],
                ["Order date", formatDate(po.orderDate)],
                ["Expected", po.expectedDate ? formatDate(po.expectedDate) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium">{v}</span>
                </div>
              ))}
              <div className="hairline flex justify-between pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="tabular text-accent">
                  {formatBDT(po.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
