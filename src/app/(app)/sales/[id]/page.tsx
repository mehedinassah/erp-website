import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canDelete, canManageLedger } from "@/lib/permissions";
import { formatBDT, formatDate } from "@/lib/format";
import {
  SO_STATUS_LABEL, type SalesOrderStatus,
  PAYMENT_STATUS_LABEL, type PaymentStatus,
} from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/app/print-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { RecordPaymentForm } from "@/components/app/record-payment-form";
import { deleteSalesOrder } from "../actions";

const paymentTone = (s: string) =>
  s === "PAID" ? "success" : s === "PARTIAL" ? "warning" : "danger";

export const dynamic = "force-dynamic";

export default async function SalesOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireUser(), params]);
  const { tenantId } = session;

  const order = await prisma.salesOrder.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      warehouse: true,
      user: true,
      items: { include: { variant: { include: { product: true } } } },
      salesReturns: { include: { items: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Toolbar (hidden when printing) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/sales"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Sales orders
        </Link>
        <div className="flex items-center gap-2">
          {order.status === "FULFILLED" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/sales/${order.id}/return`}>
                <RotateCcw className="size-4" /> Return
              </Link>
            </Button>
          )}
          {canDelete(session.role) && (
            <DeleteButton
              entity="sale"
              name={order.orderNumber}
              description="The sold stock will be returned to inventory."
              action={async () => {
                "use server";
                await deleteSalesOrder(order.id);
              }}
            />
          )}
          <PrintButton />
        </div>
      </div>

      <Card className="animate-rise overflow-hidden p-8 sm:p-10">
        {/* Invoice header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
                R
              </span>
              <div>
                <p className="font-display text-xl font-semibold leading-none">
                  PERICO
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Clothing · Dhaka
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold">Invoice</p>
            <p className="tabular text-sm text-muted-foreground">
              {order.orderNumber}
            </p>
            <div className="mt-1 flex justify-end gap-2">
              <Badge tone={statusTone(order.status)}>
                {SO_STATUS_LABEL[order.status as SalesOrderStatus] ?? order.status}
              </Badge>
              <Badge tone={paymentTone(order.paymentStatus)}>
                {PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="hairline my-7" />

        {/* Bill to / meta */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billed to
            </p>
            <p className="font-medium">{order.customer?.name ?? "Walk-in customer"}</p>
            {order.customer?.address && (
              <p className="text-sm text-muted-foreground">
                {order.customer.address}
              </p>
            )}
            {order.customer?.phone && (
              <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
            )}
          </div>
          <div className="sm:text-right">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Date: </span>
                {formatDate(order.orderDate)}
              </p>
              <p>
                <span className="text-muted-foreground">Fulfilled from: </span>
                {order.warehouse.name}
              </p>
              {order.user && (
                <p>
                  <span className="text-muted-foreground">Served by: </span>
                  {order.user.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-7">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Item</TH>
                <TH className="text-center">Qty</TH>
                <TH className="text-right">Unit price</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <TBody>
              {order.items.map((it) => (
                <TR key={it.id} className="hover:bg-transparent">
                  <TD>
                    <p className="font-medium">{it.variant.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.variant.size} · {it.variant.color} · {it.variant.sku}
                    </p>
                  </TD>
                  <TD className="tabular text-center">{it.quantity}</TD>
                  <TD className="tabular text-right">{formatBDT(it.unitPrice)}</TD>
                  <TD className="tabular text-right font-medium">
                    {formatBDT(it.unitPrice * it.quantity)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular">{formatBDT(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular text-destructive">
                  −{formatBDT(order.discount)}
                </span>
              </div>
            )}
            <div className="hairline flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular text-accent">{formatBDT(order.total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="hairline mt-7 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Payment panel */}
        {canManageLedger(session.role) && order.status === "FULFILLED" && (
          <div className="hairline mt-7 pt-5 print:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment
            </p>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="tabular mt-0.5 font-semibold">{formatBDT(order.total)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="tabular mt-0.5 font-semibold text-success">{formatBDT(order.amountPaid)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="tabular mt-0.5 font-semibold text-destructive">
                  {formatBDT(Math.max(0, order.total - order.amountPaid))}
                </p>
              </div>
            </div>
            <RecordPaymentForm
              orderId={order.id}
              outstanding={Math.max(0, order.total - order.amountPaid)}
            />
          </div>
        )}

        {/* Returns */}
        {order.salesReturns.length > 0 && (
          <div className="hairline mt-7 pt-5 print:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Returns ({order.salesReturns.length})
            </p>
            <div className="space-y-2">
              {order.salesReturns.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                  <span className="font-medium">{r.returnNumber}</span>
                  <span className="tabular text-destructive">−{formatBDT(r.totalAmount)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Thank you for shopping with PERICO · ৳ all amounts in BDT
        </p>
      </Card>
    </div>
  );
}
